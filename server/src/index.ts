import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import * as XLSX from 'xlsx';
import cron from 'node-cron';
import { pool } from './db.js';
import { sendOportunidadStatusEmail, sendAcuerdoProximoAVencerEmail } from './emailService.js';

// Load environment variables from .env file
config();

const __dirname = resolve(fileURLToPath(import.meta.url), '../..');

const port = Number(process.env.API_PORT ?? 3001);

function normalizeAcuerdo(acuerdo: any) {
  return {
    ...acuerdo,
    activosIncluidosIds: Array.isArray(acuerdo.activosIncluidosIds) ? acuerdo.activosIncluidosIds : [],
  };
}

function addCorsHeaders(response: import('node:http').ServerResponse) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Max-Age', '86400');
}

function sendJson(response: import('node:http').ServerResponse, status: number, payload: unknown) {
  addCorsHeaders(response);
  response.writeHead(status, {
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request: import('node:http').IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as { identifier?: string; email?: string; username?: string; password?: string };
}

async function getMenuOptions(subscriptionType: string) {
  const result = await pool.query(
    `SELECT mo.code, mo.label, mo.path, mo.icon, mo.sort_order AS "sortOrder"
     FROM menu_options mo
     INNER JOIN subscription_menu_access sma ON sma.menu_option_code = mo.code
    WHERE sma.subscription_type = $1 AND mo.is_active = TRUE
     ORDER BY mo.sort_order`,
      [subscriptionType],
  );
  return result.rows;
}

async function isAdminRequest(request: import('node:http').IncomingMessage) {
  const userId = request.headers['x-user-id'];
  if (typeof userId !== 'string' || !userId) return false;
  const result = await pool.query(
    `SELECT 1 FROM auth_credentials
    WHERE (email = $1 OR username = $1) AND subscription_type = 'ADMIN' AND NOW() >= valid_from AND NOW() < valid_until`,
    [userId],
  );
  return result.rowCount === 1;
}

async function parseMultipartFormData(request: import('node:http').IncomingMessage): Promise<{ fields: Record<string, string>; files: Record<string, Buffer> }> {
  const boundary = request.headers['content-type']?.split('boundary=')[1];
  if (!boundary) throw new Error('No boundary found');

  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);

  const fields: Record<string, string> = {};
  const files: Record<string, Buffer> = {};

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = buffer.toString('binary').split(`--${boundary}`);

  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const headerEndIndex = part.indexOf('\r\n\r\n');
      if (headerEndIndex === -1) continue;

      const header = part.substring(0, headerEndIndex);
      const body = part.substring(headerEndIndex + 4);
      const cleanBody = body.replace(/\r\n--$/, '').replace(/\r\n$/, '');

      const nameMatch = header.match(/name="([^"]+)"/);
      const filenameMatch = header.match(/filename="([^"]+)"/);

      if (nameMatch) {
        const fieldName = nameMatch[1];
        if (filenameMatch) {
          files[fieldName] = Buffer.from(cleanBody, 'binary');
        } else {
          fields[fieldName] = cleanBody.trim();
        }
      }
    }
  }

  return { fields, files };
}

async function getUserCompaniaId(userId: string): Promise<string | null> {
  // Try to parse as UUID first, then fall back to email/username
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  let result;
  if (isValidUUID) {
    result = await pool.query<{ compania_id: string | null }>(
      `SELECT compania_id FROM auth_credentials WHERE id = $1::uuid`,
      [userId],
    );
  } else {
    result = await pool.query<{ compania_id: string | null }>(
      `SELECT compania_id FROM auth_credentials WHERE email = $1 OR username = $1`,
      [userId],
    );
  }

  return result.rows[0]?.compania_id ?? null;
}

async function ensureAcuerdoAlertaFields() {
  try {
    // Verificar si existen los campos de alertas, si no, crearlos
    const campos = [
      'alerta_80_enviada',
      'alerta_90_enviada',
      'alerta_95_enviada',
      'alerta_99_enviada',
      'alerta_100_enviada'
    ];

    for (const campo of campos) {
      try {
        await pool.query(`
          ALTER TABLE acuerdos
          ADD COLUMN ${campo} boolean DEFAULT false
        `);
        console.log(`✅ Campo ${campo} creado en tabla acuerdos`);
      } catch (error: any) {
        if (error.code === '42701') {
          // Columna ya existe
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error ensurando campos de alertas:', error);
  }
}

async function scheduleAcuerdoAlerts() {
  // Ejecutar cada 24 horas a las 7:00 AM hora colombiana (12:00 UTC)
  cron.schedule('0 12 * * *', async () => {
    console.log('🔔 Verificando acuerdos para alertas de porcentaje...');
    try {
      // Obtener todos los acuerdos activos con sus compromisos
      const acuerdosResult = await pool.query(`
        SELECT
          a.id,
          a.nombre,
          a.fecha_inicio,
          a.fecha_fin,
          a.marca_id,
          a.responsable_correo,
          a.alerta_80_enviada,
          a.alerta_90_enviada,
          a.alerta_95_enviada,
          a.alerta_99_enviada,
          a.alerta_100_enviada,
          m.nombre as marca_nombre,
          m.correo_contacto_1,
          COUNT(DISTINCT e.id) as total_evidencias,
          COUNT(DISTINCT CASE WHEN e.estado IN ('Aprobada', 'En revisión') THEN e.id END) as evidencias_activas
        FROM acuerdos a
        LEFT JOIN marcas m ON a.marca_id = m.id
        LEFT JOIN compromisos c ON a.id = c.acuerdo_id
        LEFT JOIN evidencias e ON c.id = e.compromiso_id
        WHERE a.estado = 'Activo'
        GROUP BY a.id, a.nombre, a.fecha_inicio, a.fecha_fin, a.marca_id, a.responsable_correo,
                 a.alerta_80_enviada, a.alerta_90_enviada, a.alerta_95_enviada, a.alerta_99_enviada, a.alerta_100_enviada,
                 m.nombre, m.correo_contacto_1
      `);

      for (const acuerdo of acuerdosResult.rows) {
        // Calcular porcentaje consumido
        const fechaInicio = new Date(acuerdo.fecha_inicio).getTime();
        const fechaFin = new Date(acuerdo.fecha_fin).getTime();
        const ahora = Date.now();

        const duracionTotal = fechaFin - fechaInicio;
        const tiempoTranscurrido = ahora - fechaInicio;
        const porcentajeConsumido = Math.round((tiempoTranscurrido / duracionTotal) * 100);

        console.log(`\n📊 Acuerdo "${acuerdo.nombre}": ${porcentajeConsumido}% consumido`);

        // Definir umbrales y sus flags correspondientes
        const umbrales = [
          { porcentaje: 80, flag: 'alerta_80_enviada' },
          { porcentaje: 90, flag: 'alerta_90_enviada' },
          { porcentaje: 95, flag: 'alerta_95_enviada' },
          { porcentaje: 99, flag: 'alerta_99_enviada' },
          { porcentaje: 100, flag: 'alerta_100_enviada' },
        ];

        const updateFlags = {};
        const emailsAEnviar = [];

        for (const umbral of umbrales) {
          if (porcentajeConsumido >= umbral.porcentaje && !acuerdo[umbral.flag]) {
            console.log(`⚠️ Alerta de ${umbral.porcentaje}% alcanzada para "${acuerdo.nombre}"`);
            updateFlags[umbral.flag] = true;
            emailsAEnviar.push({ umbral: umbral.porcentaje });
          }
        }

        // Enviar emails si hay nuevas alertas
        if (emailsAEnviar.length > 0) {
          // Email al contacto de la marca
          if (acuerdo.correo_contacto_1) {
            for (const email of emailsAEnviar) {
              await sendAcuerdoProximoAVencerEmail(
                { nombre: acuerdo.marca_nombre, contacto: { email: acuerdo.correo_contacto_1 } },
                {
                  nombre: acuerdo.nombre,
                  valor: 0,
                  vigenciaHasta: new Date(acuerdo.fecha_fin).toLocaleDateString('es-CO'),
                  porcentajeConsumido,
                  umbral: email.umbral
                }
              ).catch(err => console.error('❌ Error enviando email a marca:', err));
            }
          }

          // Email al responsable interno
          if (acuerdo.responsable_correo) {
            for (const email of emailsAEnviar) {
              await sendAcuerdoProximoAVencerEmail(
                { nombre: acuerdo.marca_nombre, contacto: { email: acuerdo.responsable_correo } },
                {
                  nombre: acuerdo.nombre,
                  valor: 0,
                  vigenciaHasta: new Date(acuerdo.fecha_fin).toLocaleDateString('es-CO'),
                  porcentajeConsumido,
                  umbral: email.umbral
                }
              ).catch(err => console.error('❌ Error enviando email a responsable:', err));
            }
          }

          // Actualizar flags en la base de datos
          if (Object.keys(updateFlags).length > 0) {
            const updates = Object.entries(updateFlags)
              .map(([key], idx) => `${key} = $${idx + 1}`)
              .join(', ');
            const values = Object.values(updateFlags);

            await pool.query(
              `UPDATE acuerdos SET ${updates} WHERE id = $${values.length + 1}`,
              [...values, acuerdo.id]
            );
            console.log(`✅ Flags actualizados para "${acuerdo.nombre}"`);
          }
        }
      }

      console.log('✅ Verificación de alertas completada');
    } catch (error) {
      console.error('❌ Error en el scheduler de acuerdos:', error);
    }
  });

  console.log('⏰ Scheduler de alertas de acuerdos activado (7:00 AM hora colombiana - 12:00 UTC)');
}

async function getAdminConfiguration() {
  const [subscriptions, menuOptions, access, companias, sectores] = await Promise.all([
    pool.query(`SELECT code, name, description, price_cop AS "priceCop", max_users AS "maxUsers", features, is_active AS "isActive" FROM subscriptions ORDER BY code`),
    pool.query(`SELECT code, label, path, icon, sort_order AS "sortOrder", is_active AS "isActive" FROM menu_options ORDER BY sort_order`),
    pool.query(`SELECT subscription_type AS "subscriptionType", menu_option_code AS "menuOptionCode" FROM subscription_menu_access ORDER BY subscription_type, menu_option_code`),
    pool.query(`SELECT id, nombre, sector, nombre_contacto AS "contactName", telefono_contacto AS "phone", telefono2_contacto AS "phone2", mail_contacto AS "email", mail2_contacto AS "email2", logo_url AS "logoUrl" FROM companias ORDER BY nombre`),
    pool.query(`SELECT id, nombre, descripcion, is_active AS "isActive" FROM sectores ORDER BY nombre`),
  ]);
  return { subscriptions: subscriptions.rows, menuOptions: menuOptions.rows, access: access.rows, companias: companias.rows, sectores: sectores.rows };
}

async function getAdminUsers() {
  const result = await pool.query(`
        SELECT ac.id, ac.email, ac.username, ac.subscription_type AS "subscriptionType",
           ac.compania_id AS "companiaId", c.nombre AS "companiaNombre",
          ac.valid_from AS "validFrom", ac.valid_until AS "validUntil",
          ac.created_at AS "createdAt", ac.updated_at AS "updatedAt", ac.last_login_at AS "lastLoginAt"
    FROM auth_credentials ac
    LEFT JOIN companias c ON c.id = ac.compania_id
    ORDER BY ac.username`);
  return result.rows;
}

async function getAdminReports() {
  const [subscriptions, companias, usuarios] = await Promise.all([
    pool.query(`SELECT code, name, description, price_cop AS "priceCop", max_users AS "maxUsers", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt" FROM subscriptions ORDER BY code`),
    pool.query(`SELECT id, nombre, sector, nombre_contacto AS "contactName", telefono_contacto AS "phone", telefono2_contacto AS "phone2", mail_contacto AS "email", mail2_contacto AS "email2", logo_url AS "logoUrl", created_at AS "createdAt", updated_at AS "updatedAt" FROM companias ORDER BY nombre`),
    pool.query(`SELECT ac.id, ac.email, ac.username, ac.subscription_type AS "subscriptionType", ac.compania_id AS "companiaId", c.nombre AS "companiaNombre", ac.valid_from AS "validFrom", ac.valid_until AS "validUntil", ac.created_at AS "createdAt", ac.updated_at AS "updatedAt", ac.last_login_at AS "lastLoginAt" FROM auth_credentials ac LEFT JOIN companias c ON c.id = ac.compania_id ORDER BY ac.username`),
  ]);
  return { subscriptions: subscriptions.rows, companias: companias.rows, usuarios: usuarios.rows };
}

const server = createServer(async (request, response) => {
  // Manejar solicitudes OPTIONS (preflight de CORS)
  if (request.method === 'OPTIONS') {
    addCorsHeaders(response);
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === 'GET' && request.url === '/health') {
    try {
      await pool.query('SELECT 1');
      sendJson(response, 200, { status: 'ok', database: 'connected' });
    } catch {
      sendJson(response, 503, { status: 'error', database: 'unavailable' });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/login') {
    try {
      const { identifier, password } = await readJson(request);
      if (!identifier?.trim() || !password) {
        sendJson(response, 400, { error: 'Ingresa tu usuario o correo y contraseña.' });
        return;
      }
      const result = await pool.query<{ id: string; email: string | null; username: string | null; password_hash: string; subscription_type: string; compania_id: string | null; compania_nombre: string | null; compania_logo: string | null }>(
        `SELECT ac.id, ac.email, ac.username, ac.password_hash, ac.subscription_type, ac.compania_id,
                c.nombre AS compania_nombre, c.logo_url AS compania_logo
         FROM auth_credentials ac
         LEFT JOIN companias c ON ac.compania_id = c.id
         WHERE (LOWER(ac.email) = LOWER($1) OR LOWER(ac.username) = LOWER($1))
           AND NOW() >= ac.valid_from AND NOW() < ac.valid_until
         LIMIT 1`,
        [identifier.trim()],
      );
      const credential = result.rows[0];
      if (!credential || !(await bcrypt.compare(password, credential.password_hash))) {
        sendJson(response, 401, { error: 'Las credenciales no son válidas o están vencidas.' });
        return;
      }
      await pool.query('UPDATE auth_credentials SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [credential.id]);
      const menuOptions = await getMenuOptions(credential.subscription_type);
      sendJson(response, 200, { user: { id: credential.id, email: credential.email, username: credential.username, subscriptionType: credential.subscription_type, companiaId: credential.compania_id, companiaNombre: credential.compania_nombre, companiaLogo: credential.compania_logo, menuOptions } });
    } catch {
      sendJson(response, 500, { error: 'No fue posible iniciar sesión.' });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/register') {
    try {
      const { email, username, password } = await readJson(request);
      const normalizedEmail = email?.trim().toLowerCase();
      const normalizedUsername = username?.trim().toLowerCase();
      if (!normalizedEmail || !normalizedUsername || !password) {
        sendJson(response, 400, { error: 'Completa correo, usuario y contraseña.' });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        sendJson(response, 400, { error: 'Ingresa un correo electrónico válido.' });
        return;
      }
      if (!/^[a-z0-9._-]{3,32}$/.test(normalizedUsername)) {
        sendJson(response, 400, { error: 'El usuario debe tener entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.' });
        return;
      }
      if (password.length < 8) {
        sendJson(response, 400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
        return;
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await pool.query<{ id: string; email: string; username: string; subscription_type: string }>(
        `INSERT INTO auth_credentials (email, username, password_hash, valid_from, valid_until)
         VALUES ($1, $2, $3, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 year')
         RETURNING id, email, username, subscription_type`,
        [normalizedEmail, normalizedUsername, passwordHash],
      );
      const user = result.rows[0];
      const menuOptions = await getMenuOptions(user.subscription_type);
      sendJson(response, 201, { user: { id: user.id, email: user.email, username: user.username, subscriptionType: user.subscription_type, menuOptions } });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        sendJson(response, 409, { error: 'El correo o usuario ya está registrado.' });
        return;
      }
      sendJson(response, 500, { error: 'No fue posible crear la cuenta.' });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/request-password-reset') {
    try {
      const { identifier } = await readJson(request) as { identifier?: string };
      if (!identifier?.trim()) {
        sendJson(response, 400, { error: 'Ingresa tu correo o usuario.' });
        return;
      }
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const result = await pool.query<{ id: string; email: string }>(
        `SELECT id, email FROM auth_credentials WHERE (LOWER(email) = $1 OR LOWER(username) = $1) LIMIT 1`,
        [normalizedIdentifier],
      );
      if (result.rowCount === 0) {
        sendJson(response, 404, { error: 'No encontramos una cuenta con ese correo o usuario.' });
        return;
      }
      const user = result.rows[0];
      // Generate a temporary password (8 random chars)
      const temporaryPassword = Math.random().toString(36).substring(2, 10);
      const resetToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      await pool.query(
        `UPDATE auth_credentials SET password_hash = $1, reset_token = $2, reset_token_expires_at = NOW() + INTERVAL '30 minutes' WHERE id = $3`,
        [passwordHash, resetToken, user.id],
      );

      // In a real app, send email here using nodemailer or similar
      // For now, we return the temporary password to show in the UI as if it was sent
      sendJson(response, 200, {
        resetToken,
        temporaryPassword,
        email: user.email,
        message: 'Se ha enviado un correo con tu contraseña temporal. Por seguridad, debes cambiarla al ingresar.'
      });
    } catch {
      sendJson(response, 500, { error: 'No fue posible procesar la solicitud de recuperación.' });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/reset-password') {
    try {
      const { identifier, resetToken, newPassword } = await readJson(request) as { identifier?: string; resetToken?: string; newPassword?: string };
      if (!identifier?.trim() || !resetToken?.trim() || !newPassword?.trim()) {
        sendJson(response, 400, { error: 'Completa todos los campos.' });
        return;
      }
      if (newPassword.length < 8) {
        sendJson(response, 400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
        return;
      }
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const result = await pool.query<{ id: string; reset_token: string; reset_token_expires_at: string }>(
        `SELECT id, reset_token, reset_token_expires_at FROM auth_credentials WHERE (LOWER(email) = $1 OR LOWER(username) = $1) LIMIT 1`,
        [normalizedIdentifier],
      );
      if (result.rowCount === 0) {
        sendJson(response, 404, { error: 'Usuario no encontrado.' });
        return;
      }
      const user = result.rows[0];
      if (!user.reset_token || user.reset_token !== resetToken) {
        sendJson(response, 400, { error: 'El código de recuperación es inválido.' });
        return;
      }
      if (new Date(user.reset_token_expires_at) < new Date()) {
        sendJson(response, 400, { error: 'El código de recuperación ha expirado. Solicita uno nuevo.' });
        return;
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await pool.query(
        `UPDATE auth_credentials SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL, updated_at = NOW() WHERE id = $2`,
        [passwordHash, user.id],
      );
      sendJson(response, 200, { message: 'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.' });
    } catch {
      sendJson(response, 500, { error: 'No fue posible restablecer la contraseña.' });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/api/auth/change-password') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const { currentPassword, newPassword } = await readJson(request) as { currentPassword?: string; newPassword?: string };
      if (!currentPassword?.trim() || !newPassword?.trim()) {
        sendJson(response, 400, { error: 'Completa todos los campos.' });
        return;
      }
      if (newPassword.length < 8) {
        sendJson(response, 400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
        return;
      }
      const result = await pool.query<{ password_hash: string }>(
        `SELECT password_hash FROM auth_credentials WHERE id = $1`,
        [userId],
      );
      if (result.rowCount === 0) {
        sendJson(response, 404, { error: 'Usuario no encontrado.' });
        return;
      }
      const user = result.rows[0];
      if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
        sendJson(response, 401, { error: 'La contraseña actual es incorrecta.' });
        return;
      }
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await pool.query(
        `UPDATE auth_credentials SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [newPasswordHash, userId],
      );
      sendJson(response, 200, { message: 'Contraseña actualizada correctamente.' });
    } catch {
      sendJson(response, 500, { error: 'No fue posible cambiar la contraseña.' });
    }
    return;
  }

  // GET /api/sectores - Obtener lista de sectores (público)
  if (request.method === 'GET' && request.url === '/api/sectores') {
    try {
      const result = await pool.query('SELECT id, nombre, descripcion, is_active AS "isActive" FROM sectores WHERE is_active = TRUE ORDER BY nombre');
      sendJson(response, 200, result.rows);
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible obtener los sectores.' });
    }
    return;
  }

  // GET /api/sectores/:id - Obtener un sector específico (público)
  const sectorMatch = request.url?.match(/^\/api\/sectores\/([^/]+)$/);
  if (request.method === 'GET' && sectorMatch) {
    try {
      const sectorId = decodeURIComponent(sectorMatch[1]);
      const result = await pool.query('SELECT id, nombre, descripcion, is_active AS "isActive" FROM sectores WHERE id = $1', [sectorId]);
      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Sector no encontrado.' });
        return;
      }
      sendJson(response, 200, result.rows[0]);
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible obtener el sector.' });
    }
    return;
  }

  if (request.url?.startsWith('/api/admin/')) {
    try {
      const companyMatch = request.url?.match(/^\/api\/admin\/companias\/([^/]+)$/);
      if (request.method === 'GET' && companyMatch) {
        const companyId = decodeURIComponent(companyMatch[1]);
        const result = await pool.query<{ id: string; nombre: string; sector?: string; nombre_contacto?: string; logo_url?: string | null }>(
          'SELECT id, nombre, sector, nombre_contacto, logo_url FROM companias WHERE id = $1',
          [companyId],
        );
        if (result.rows.length === 0) {
          sendJson(response, 404, { error: 'Compañía no encontrada.' });
          return;
        }
        sendJson(response, 200, result.rows[0]);
        return;
      }
      if (!(await isAdminRequest(request))) {
        sendJson(response, 403, { error: 'Se requiere un usuario administrador.' });
        return;
      }
      if (request.method === 'GET' && request.url === '/api/admin/configuration') {
        sendJson(response, 200, await getAdminConfiguration());
        return;
      }
      if (request.method === 'GET' && request.url === '/api/admin/users') {
        sendJson(response, 200, { users: await getAdminUsers() });
        return;
      }
      if (request.method === 'GET' && request.url === '/api/admin/reports') {
        sendJson(response, 200, await getAdminReports());
        return;
      }
      if (request.method === 'GET' && request.url === '/api/admin/sectores') {
        const result = await pool.query('SELECT id, nombre, descripcion, is_active AS "isActive" FROM sectores ORDER BY nombre');
        sendJson(response, 200, result.rows);
        return;
      }
      if (request.method === 'POST' && request.url === '/api/admin/users') {
        const body = await readJson(request) as { email?: string; username?: string; password?: string; subscriptionType?: string; companiaId?: string | null; validFrom?: string; validUntil?: string };
        const email = body.email?.trim().toLowerCase();
        const username = body.username?.trim().toLowerCase();
        if (!email || !username || !body.password || !body.subscriptionType) {
          sendJson(response, 400, { error: 'Correo, usuario, contraseña y suscripción son obligatorios.' });
          return;
        }
        if (body.password.length < 8) {
          sendJson(response, 400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
          return;
        }
        await pool.query(
          `INSERT INTO auth_credentials (email, username, password_hash, subscription_type, compania_id, valid_from, valid_until)
           VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), COALESCE($7, NOW() + INTERVAL '1 year'))`,
          [email, username, await bcrypt.hash(body.password, 12), body.subscriptionType, body.companiaId || null, body.validFrom || null, body.validUntil || null],
        );
        sendJson(response, 201, { users: await getAdminUsers() });
        return;
      }
      const userMatch = request.url?.match(/^\/api\/admin\/users\/([^/]+)$/);
      if (request.method === 'PATCH' && userMatch) {
        const body = await readJson(request) as { email?: string; username?: string; password?: string; subscriptionType?: string; companiaId?: string | null; validFrom?: string; validUntil?: string };
        const userId = decodeURIComponent(userMatch[1]);
        const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : null;
        await pool.query(
          `UPDATE auth_credentials SET email = COALESCE($2, email), username = COALESCE($3, username), password_hash = COALESCE($4, password_hash), subscription_type = COALESCE($5, subscription_type), compania_id = $6, valid_from = COALESCE($7, valid_from), valid_until = COALESCE($8, valid_until), updated_at = NOW() WHERE id = $1`,
          [userId, body.email?.trim().toLowerCase() || null, body.username?.trim().toLowerCase() || null, passwordHash, body.subscriptionType || null, body.companiaId ?? null, body.validFrom || null, body.validUntil || null],
        );
        sendJson(response, 200, { users: await getAdminUsers() });
        return;
      }
      if (request.method === 'POST' && request.url === '/api/admin/subscriptions') {
        const body = await readJson(request) as { code?: string; name?: string; description?: string; priceCop?: number; maxUsers?: number | null; features?: string[] };
        const code = body.code?.trim().toUpperCase();
        if (!code || !body.name?.trim()) {
          sendJson(response, 400, { error: 'El código y nombre del plan son obligatorios.' });
          return;
        }
        await pool.query(
          `INSERT INTO subscriptions (code, name, description, price_cop, max_users, features)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [code, body.name.trim(), body.description?.trim() ?? '', body.priceCop ?? 0, body.maxUsers ?? null, JSON.stringify(body.features ?? [])],
        );
        sendJson(response, 201, await getAdminConfiguration());
        return;
      }
      const subscriptionMatch = request.url?.match(/^\/api\/admin\/subscriptions\/([^/]+)$/);
      if (request.method === 'PATCH' && subscriptionMatch) {
        const body = await readJson(request) as { name?: string; description?: string; priceCop?: number; maxUsers?: number | null; features?: string[]; isActive?: boolean };
        await pool.query(
          `UPDATE subscriptions SET name = COALESCE($2, name), description = COALESCE($3, description), price_cop = COALESCE($4, price_cop), max_users = $5, features = COALESCE($6, features), is_active = COALESCE($7, is_active), updated_at = NOW() WHERE code = $1`,
          [decodeURIComponent(subscriptionMatch[1]), body.name?.trim() ?? null, body.description?.trim() ?? null, body.priceCop ?? null, body.maxUsers ?? null, body.features ? JSON.stringify(body.features) : null, body.isActive ?? null],
        );
        sendJson(response, 200, await getAdminConfiguration());
        return;
      }
      if (request.method === 'DELETE' && subscriptionMatch) {
        await pool.query('DELETE FROM subscriptions WHERE code = $1', [decodeURIComponent(subscriptionMatch[1])]);
        sendJson(response, 200, await getAdminConfiguration());
        return;
      }
      if (request.method === 'PUT' && request.url === '/api/admin/access') {
        const body = await readJson(request) as { subscriptionType?: string; menuOptionCodes?: string[] };
        if (!body.subscriptionType || !Array.isArray(body.menuOptionCodes)) {
          sendJson(response, 400, { error: 'Suscripción y opciones son obligatorias.' });
          return;
        }
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query('DELETE FROM subscription_menu_access WHERE subscription_type = $1', [body.subscriptionType]);
          for (const menuOptionCode of body.menuOptionCodes) {
            await client.query('INSERT INTO subscription_menu_access (subscription_type, menu_option_code) VALUES ($1, $2)', [body.subscriptionType, menuOptionCode]);
          }
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
        sendJson(response, 200, await getAdminConfiguration());
        return;
      }
      if (request.method === 'POST' && request.url === '/api/admin/companias') {
        const body = await readJson(request) as { nombre?: string; sector?: string; nombreContacto?: string; telefonoContacto?: string; telefono2Contacto?: string; mailContacto?: string; mail2Contacto?: string; logoUrl?: string };
        const required = [body.nombre, body.sector, body.nombreContacto, body.telefonoContacto, body.mailContacto];
        if (required.some((value) => !value?.trim())) {
          sendJson(response, 400, { error: 'Nombre, sector, contacto, teléfono y correo son obligatorios.' });
          return;
        }
        await pool.query(
          `INSERT INTO companias (nombre, sector, nombre_contacto, telefono_contacto, telefono2_contacto, mail_contacto, mail2_contacto, logo_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [body.nombre?.trim(), body.sector?.trim(), body.nombreContacto?.trim(), body.telefonoContacto?.trim(), body.telefono2Contacto?.trim() || null, body.mailContacto?.trim().toLowerCase(), body.mail2Contacto?.trim().toLowerCase() || null, body.logoUrl?.trim() || null],
        );
        sendJson(response, 201, await getAdminConfiguration());
        return;
      }
      if ((request.method === 'PATCH' || request.method === 'DELETE') && companyMatch) {
        const companyId = decodeURIComponent(companyMatch[1]);
        if (request.method === 'DELETE') {
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            await client.query('DELETE FROM reporte_metricas_mensuales WHERE reporte_id IN (SELECT id FROM reportes WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM campana_evidencias WHERE campana_id IN (SELECT id FROM campanas_audiencia WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM segmento_campanas_anteriores WHERE campana_id IN (SELECT id FROM campanas_audiencia WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM campana_segmentos WHERE campana_id IN (SELECT id FROM campanas_audiencia WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM campana_canales WHERE campana_id IN (SELECT id FROM campanas_audiencia WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM evidencias WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM campanas_audiencia WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM compromisos WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM acuerdo_activos WHERE activo_id IN (SELECT id FROM activos WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM acuerdos WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM reportes WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM oportunidad_activos WHERE activo_id IN (SELECT id FROM activos WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM actividades_oportunidad WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM oportunidades WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM activo_audiencias WHERE activo_id IN (SELECT id FROM activos WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM capacidad_activos WHERE activo_id IN (SELECT id FROM activos WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM segmento_activos WHERE activo_id IN (SELECT id FROM activos WHERE compania_id = $1)', [companyId]);
            await client.query('DELETE FROM activos WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM auth_credentials WHERE compania_id = $1', [companyId]);
            await client.query('DELETE FROM companias WHERE id = $1', [companyId]);
            await client.query('COMMIT');
            client.release();
          } catch (error) {
            await client.query('ROLLBACK');
            client.release();
            console.error('Delete company error:', error);
            throw error;
          }
        }
        else {
          const body = await readJson(request) as { nombre?: string; sector?: string; nombreContacto?: string; telefonoContacto?: string; telefono2Contacto?: string; mailContacto?: string; mail2Contacto?: string; logoUrl?: string };
          await pool.query(`UPDATE companias SET nombre = COALESCE($2, nombre), sector = COALESCE($3, sector), nombre_contacto = COALESCE($4, nombre_contacto), telefono_contacto = COALESCE($5, telefono_contacto), telefono2_contacto = $6, mail_contacto = COALESCE($7, mail_contacto), mail2_contacto = $8, logo_url = $9, updated_at = NOW() WHERE id = $1`, [companyId, body.nombre?.trim() || null, body.sector?.trim() || null, body.nombreContacto?.trim() || null, body.telefonoContacto?.trim() || null, body.telefono2Contacto?.trim() || null, body.mailContacto?.trim().toLowerCase() || null, body.mail2Contacto?.trim().toLowerCase() || null, body.logoUrl?.trim() || null]);
        }
        sendJson(response, 200, await getAdminConfiguration());
        return;
      }
      if (request.method === 'POST' && request.url === '/api/admin/sectores') {
        const body = await readJson(request) as { nombre?: string; descripcion?: string };
        if (!body.nombre?.trim()) {
          sendJson(response, 400, { error: 'El nombre del sector es obligatorio.' });
          return;
        }
        await pool.query('INSERT INTO sectores (nombre, descripcion) VALUES ($1, $2)', [body.nombre.trim(), body.descripcion?.trim() ?? '']);
        sendJson(response, 201, await getAdminConfiguration());
        return;
      }
      const sectorMatch = request.url?.match(/^\/api\/admin\/sectores\/([^/]+)$/);
      if ((request.method === 'PATCH' || request.method === 'DELETE') && sectorMatch) {
        const sectorId = decodeURIComponent(sectorMatch[1]);
        if (request.method === 'DELETE') await pool.query('DELETE FROM sectores WHERE id = $1', [sectorId]);
        else {
          const body = await readJson(request) as { nombre?: string; descripcion?: string; isActive?: boolean };
          await pool.query('UPDATE sectores SET nombre = COALESCE($2, nombre), descripcion = COALESCE($3, descripcion), is_active = COALESCE($4, is_active), updated_at = NOW() WHERE id = $1', [sectorId, body.nombre?.trim() || null, body.descripcion?.trim() || null, body.isActive ?? null]);
        }
        sendJson(response, 200, await getAdminConfiguration());
        return;
      }
      if (request.method === 'DELETE' && userMatch) {
        const currentUserId = request.headers['x-user-id'];
        const userId = decodeURIComponent(userMatch[1]);
        if (currentUserId === userId) {
          sendJson(response, 400, { error: 'No puedes eliminar el usuario con el que estás conectado.' });
          return;
        }
        await pool.query('DELETE FROM auth_credentials WHERE id = $1', [userId]);
        sendJson(response, 200, { users: await getAdminUsers() });
        return;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        sendJson(response, 409, { error: 'El código ya existe.' });
        return;
      }
      sendJson(response, 500, { error: 'No fue posible actualizar la parametrización.' });
      return;
    }
  }

  // GET /api/activos - Get activos for authenticated user's company (or all if admin)
  if (request.method === 'GET' && request.url === '/api/activos') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const isAdmin = await isAdminRequest(request);
      let query = `SELECT a.id, a.nombre, a.categoria_id AS "categoriaId", ac.nombre AS "categoriaNombre",
                a.canal, a.descripcion, a.valoracion_cop AS "valoracionCOP",
                a.inventario_total AS "inventarioTotal", a.inventario_disponible AS "inventarioDisponible",
                a.alcance_estimado AS "alcanceEstimado", a.estado, a.derechos_incluidos AS "derechosIncluidos",
                a.imagen_color AS "imagenColor", a.documentos_adjuntos AS "documentosAdjuntos", a.created_at AS "createdAt", a.updated_at AS "updatedAt",
                COALESCE(json_agg(aa.acuerdo_id) FILTER (WHERE aa.acuerdo_id IS NOT NULL), '[]'::json) AS "acuerdosAsociadosIds",
                COALESCE(json_agg(json_build_object('id', af.id, 'nombreArchivo', af.nombre_archivo, 'tipoMime', af.tipo_mime, 'tamanioBytes', af.tamanio_bytes, 'principal', af.principal, 'createdAt', af.created_at)) FILTER (WHERE af.id IS NOT NULL), '[]'::json) AS "fotos"
         FROM activos a
         LEFT JOIN activo_categorias ac ON a.categoria_id = ac.id
         LEFT JOIN acuerdo_activos aa ON a.id = aa.activo_id
         LEFT JOIN activo_fotos af ON a.id = af.activo_id`;
      let params: any[] = [];

      if (!isAdmin) {
        const companiaId = await getUserCompaniaId(userId);
        if (!companiaId) {
          sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
          return;
        }
        query += ' WHERE a.compania_id = $1';
        params = [companiaId];
      }

      query += ' GROUP BY a.id, ac.nombre, a.canal, a.descripcion, a.categoria_id, a.valoracion_cop, a.inventario_total, a.inventario_disponible, a.alcance_estimado, a.estado, a.derechos_incluidos, a.imagen_color, a.documentos_adjuntos, a.created_at, a.updated_at ORDER BY a.created_at DESC';
      const result = await pool.query(query, params);
      sendJson(response, 200, result.rows);
      return;
    } catch (error) {
      console.error('Error fetching activos:', error instanceof Error ? error.message : error);
      sendJson(response, 500, { error: 'No fue posible obtener los activos.', details: error instanceof Error ? error.message : String(error) });
      return;
    }
  }

  // POST /api/activos - Create a new activo
  if (request.method === 'POST' && request.url === '/api/activos') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const body = await readJson(request) as any;

      // Validar campos requeridos
      if (!body.nombre || !body.categoriaId || !body.canal || !body.descripcion || !body.estado) {
        sendJson(response, 400, { error: 'Faltan campos requeridos: nombre, categoriaId, canal, descripcion, estado' });
        return;
      }

      // Get category name
      const categoryResult = await pool.query<{ nombre: string }>(
        `SELECT nombre FROM activo_categorias WHERE id = $1`,
        [body.categoriaId]
      );
      if (categoryResult.rowCount === 0) {
        sendJson(response, 400, { error: 'La categoría especificada no existe.' });
        return;
      }
      const categoriaNombre = categoryResult.rows[0].nombre;

      const id = `act-${Date.now()}`;
      const valoracionCOP = Number(body.valoracionCOP) || 0;
      const inventarioTotal = Number(body.inventarioTotal) || 1;
      const inventarioDisponible = Number(body.inventarioDisponible) || 0;

      await pool.query(
        `INSERT INTO activos (id, compania_id, nombre, categoria_id, canal, descripcion, valoracion_cop,
                             inventario_total, inventario_disponible, alcance_estimado, estado, derechos_incluidos, imagen_color, documentos_adjuntos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14::jsonb)`,
        [id, companiaId, body.nombre, body.categoriaId, body.canal, body.descripcion, valoracionCOP,
         inventarioTotal, inventarioDisponible, body.alcanceEstimado || '', body.estado, JSON.stringify(body.derechosIncluidos || []), body.imagenColor, JSON.stringify(body.documentosAdjuntos || [])]
      );

      // Handle photo if present
      if (body.fotoBase64 && typeof body.fotoBase64 === 'string' && body.fotoBase64.startsWith('data:')) {
        try {
          const matches = body.fotoBase64.match(/data:.*?;base64,(.+)/);
          if (matches) {
            const fotoBuffer = Buffer.from(matches[1], 'base64');
            const nombreArchivo = body.fotoNombre || `foto-${Date.now()}.jpg`;
            const tipoMime = body.fotoBase64.split(';')[0].replace('data:', '') || 'image/jpeg';

            await pool.query(
              `INSERT INTO activo_fotos (activo_id, foto_data, nombre_archivo, tipo_mime, tamanio_bytes, principal)
               VALUES ($1, $2, $3, $4, $5, true)`,
              [id, fotoBuffer, nombreArchivo, tipoMime, fotoBuffer.length]
            );
          }
        } catch (fotoError) {
          console.error('Error saving photo:', fotoError);
          // No fallar la creación del activo por error en la foto
        }
      }

      const result = await pool.query(
        `SELECT a.id, a.nombre, a.categoria_id AS "categoriaId", ac.nombre AS "categoriaNombre",
                a.canal, a.descripcion, a.valoracion_cop AS "valoracionCOP",
                a.inventario_total AS "inventarioTotal", a.inventario_disponible AS "inventarioDisponible",
                a.alcance_estimado AS "alcanceEstimado", a.estado, a.derechos_incluidos AS "derechosIncluidos",
                a.imagen_color AS "imagenColor", a.documentos_adjuntos AS "documentosAdjuntos",
                a.created_at AS "createdAt", a.updated_at AS "updatedAt",
                COALESCE(json_agg(aa.acuerdo_id) FILTER (WHERE aa.acuerdo_id IS NOT NULL), '[]'::json) AS "acuerdosAsociadosIds",
                COALESCE(json_agg(json_build_object('id', af.id, 'nombreArchivo', af.nombre_archivo, 'tipoMime', af.tipo_mime, 'tamanioBytes', af.tamanio_bytes, 'principal', af.principal, 'createdAt', af.created_at)) FILTER (WHERE af.id IS NOT NULL), '[]'::json) AS "fotos"
         FROM activos a
         LEFT JOIN activo_categorias ac ON a.categoria_id = ac.id
         LEFT JOIN acuerdo_activos aa ON a.id = aa.activo_id
         LEFT JOIN activo_fotos af ON a.id = af.activo_id
         WHERE a.id = $1 AND a.compania_id = $2
         GROUP BY a.id, ac.nombre, a.documentos_adjuntos`,
        [id, companiaId]
      );
      sendJson(response, 201, result.rows[0]);
      return;
    } catch (error) {
      console.error('Error creating activo:', error);
      sendJson(response, 500, { error: 'No fue posible crear el activo.', details: error instanceof Error ? error.message : String(error) });
      return;
    }
  }

  // GET /api/activos/:id - Get a single activo
  const activoMatch = request.url?.match(/^\/api\/activos\/([^/]+)$/);
  if (request.method === 'GET' && activoMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const activoId = decodeURIComponent(activoMatch[1]);

      const result = await pool.query(
        `SELECT a.id, a.nombre, a.categoria_id AS "categoriaId", ac.nombre AS "categoriaNombre",
                a.canal, a.descripcion, a.valoracion_cop AS "valoracionCOP",
                a.inventario_total AS "inventarioTotal", a.inventario_disponible AS "inventarioDisponible",
                a.alcance_estimado AS "alcanceEstimado", a.estado, a.derechos_incluidos AS "derechosIncluidos",
                a.imagen_color AS "imagenColor", a.documentos_adjuntos AS "documentosAdjuntos",
                a.created_at AS "createdAt", a.updated_at AS "updatedAt",
                COALESCE(json_agg(aa.acuerdo_id) FILTER (WHERE aa.acuerdo_id IS NOT NULL), '[]'::json) AS "acuerdosAsociadosIds",
                COALESCE(json_agg(json_build_object('id', af.id, 'nombreArchivo', af.nombre_archivo, 'tipoMime', af.tipo_mime, 'tamanioBytes', af.tamanio_bytes, 'principal', af.principal, 'createdAt', af.created_at)) FILTER (WHERE af.id IS NOT NULL), '[]'::json) AS "fotos"
         FROM activos a
         LEFT JOIN activo_categorias ac ON a.categoria_id = ac.id
         LEFT JOIN acuerdo_activos aa ON a.id = aa.activo_id
         LEFT JOIN activo_fotos af ON a.id = af.activo_id
         WHERE a.id = $1 AND a.compania_id = $2
         GROUP BY a.id, ac.nombre, a.canal, a.descripcion, a.categoria_id, a.valoracion_cop, a.inventario_total, a.inventario_disponible, a.alcance_estimado, a.estado, a.derechos_incluidos, a.imagen_color, a.documentos_adjuntos, a.created_at, a.updated_at`,
        [activoId, companiaId]
      );

      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Activo no encontrado.' });
        return;
      }

      sendJson(response, 200, result.rows[0]);
      return;
    } catch (error) {
      console.error('Error getting activo:', error);
      sendJson(response, 500, { error: 'No fue posible obtener el activo.' });
      return;
    }
  }

  // PATCH /api/activos/:id - Update an activo
  if (request.method === 'PATCH' && activoMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const activoId = decodeURIComponent(activoMatch[1]);
      const body = await readJson(request) as any;

      const updates: string[] = [];
      const values: any[] = [activoId, companiaId];
      let paramCount = 2;

      if (body.nombre !== undefined) {
        updates.push(`nombre = $${++paramCount}`);
        values.push(body.nombre);
      }
      if (body.categoriaId !== undefined) {
        updates.push(`categoria_id = $${++paramCount}`);
        values.push(body.categoriaId);
      }
      if (body.canal !== undefined) {
        updates.push(`canal = $${++paramCount}`);
        values.push(body.canal);
      }
      if (body.descripcion !== undefined) {
        updates.push(`descripcion = $${++paramCount}`);
        values.push(body.descripcion);
      }
      if (body.valoracionCOP !== undefined) {
        updates.push(`valoracion_cop = $${++paramCount}`);
        values.push(body.valoracionCOP);
      }
      if (body.inventarioTotal !== undefined) {
        updates.push(`inventario_total = $${++paramCount}`);
        values.push(body.inventarioTotal);
      }
      if (body.inventarioDisponible !== undefined) {
        updates.push(`inventario_disponible = $${++paramCount}`);
        values.push(body.inventarioDisponible);
      }
      if (body.alcanceEstimado !== undefined) {
        updates.push(`alcance_estimado = $${++paramCount}`);
        values.push(body.alcanceEstimado);
      }
      if (body.estado !== undefined) {
        updates.push(`estado = $${++paramCount}`);
        values.push(body.estado);
      }
      if (body.derechosIncluidos !== undefined) {
        updates.push(`derechos_incluidos = $${++paramCount}::jsonb`);
        values.push(JSON.stringify(body.derechosIncluidos));
      }
      if (body.imagenColor !== undefined) {
        updates.push(`imagen_color = $${++paramCount}`);
        values.push(body.imagenColor);
      }
      if (body.documentosAdjuntos !== undefined) {
        updates.push(`documentos_adjuntos = $${++paramCount}::jsonb`);
        values.push(JSON.stringify(body.documentosAdjuntos));
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) {
        sendJson(response, 400, { error: 'No fields to update.' });
        return;
      }

      await pool.query(
        `UPDATE activos SET ${updates.join(', ')} WHERE id = $1 AND compania_id = $2`,
        values
      );

      // Handle photo if present
      if (body.fotoBase64 && typeof body.fotoBase64 === 'string' && body.fotoBase64.startsWith('data:')) {
        try {
          const matches = body.fotoBase64.match(/data:.*?;base64,(.+)/);
          if (matches) {
            const fotoBuffer = Buffer.from(matches[1], 'base64');
            const nombreArchivo = body.fotoNombre || `foto-${Date.now()}.jpg`;
            const tipoMime = body.fotoBase64.split(';')[0].replace('data:', '') || 'image/jpeg';

            // Delete existing principal photo
            await pool.query('DELETE FROM activo_fotos WHERE activo_id = $1 AND principal = true', [activoId]);

            // Insert new principal photo
            await pool.query(
              `INSERT INTO activo_fotos (activo_id, foto_data, nombre_archivo, tipo_mime, tamanio_bytes, principal)
               VALUES ($1, $2, $3, $4, $5, true)`,
              [activoId, fotoBuffer, nombreArchivo, tipoMime, fotoBuffer.length]
            );
          }
        } catch (fotoError) {
          console.error('Error updating photo:', fotoError);
          // No fallar la actualización por error en la foto
        }
      }

      const result = await pool.query(
        `SELECT a.id, a.nombre, a.categoria_id AS "categoriaId", ac.nombre AS "categoriaNombre",
                a.canal, a.descripcion, a.valoracion_cop AS "valoracionCOP",
                a.inventario_total AS "inventarioTotal", a.inventario_disponible AS "inventarioDisponible",
                a.alcance_estimado AS "alcanceEstimado", a.estado, a.derechos_incluidos AS "derechosIncluidos",
                a.imagen_color AS "imagenColor", a.documentos_adjuntos AS "documentosAdjuntos",
                a.created_at AS "createdAt", a.updated_at AS "updatedAt",
                COALESCE(json_agg(aa.acuerdo_id) FILTER (WHERE aa.acuerdo_id IS NOT NULL), '[]'::json) AS "acuerdosAsociadosIds",
                COALESCE(json_agg(json_build_object('id', af.id, 'nombreArchivo', af.nombre_archivo, 'tipoMime', af.tipo_mime, 'tamanioBytes', af.tamanio_bytes, 'principal', af.principal, 'createdAt', af.created_at)) FILTER (WHERE af.id IS NOT NULL), '[]'::json) AS "fotos"
         FROM activos a
         LEFT JOIN activo_categorias ac ON a.categoria_id = ac.id
         LEFT JOIN acuerdo_activos aa ON a.id = aa.activo_id
         LEFT JOIN activo_fotos af ON a.id = af.activo_id
         WHERE a.id = $1 AND a.compania_id = $2
         GROUP BY a.id, ac.nombre, a.documentos_adjuntos`,
        [activoId, companiaId]
      );

      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Activo not found' });
        return;
      }

      sendJson(response, 200, result.rows[0]);
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible actualizar el activo.' });
      return;
    }
  }

  // ADMIN: POST /api/admin/migrations/027 - Apply migration 027 (add documentos_adjuntos to activos)
  if (request.method === 'POST' && request.url === '/api/admin/migrations/027') {
    try {
      if (!(await isAdminRequest(request))) {
        sendJson(response, 403, { error: 'Admin only' });
        return;
      }
      await pool.query('ALTER TABLE activos ADD COLUMN IF NOT EXISTS documentos_adjuntos JSONB DEFAULT \'[]\'::jsonb');
      sendJson(response, 200, { message: 'Migration 027 applied successfully' });
      return;
    } catch (error) {
      console.error('Error applying migration 027:', error);
      sendJson(response, 500, { error: 'Failed to apply migration', details: error instanceof Error ? error.message : String(error) });
      return;
    }
  }

  // DELETE /api/activos/:id - Delete an activo
  if (request.method === 'DELETE' && activoMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const activoId = decodeURIComponent(activoMatch[1]);

      await pool.query('DELETE FROM activos WHERE id = $1 AND compania_id = $2', [activoId, companiaId]);

      sendJson(response, 200, { message: 'Activo deleted successfully' });
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible eliminar el activo.' });
      return;
    }
  }

  // POST /api/activos/:id/fotos - Upload a photo for an activo
  const activoFotoUploadMatch = request.url?.match(/^\/api\/activos\/([^/]+)\/fotos$/);
  if (request.method === 'POST' && activoFotoUploadMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const activoId = decodeURIComponent(activoFotoUploadMatch[1]);

      // Verify activo belongs to company
      const activoCheck = await pool.query('SELECT id FROM activos WHERE id = $1 AND compania_id = $2', [activoId, companiaId]);
      if (activoCheck.rowCount === 0) {
        sendJson(response, 404, { error: 'Activo no encontrado.' });
        return;
      }

      const { fields, files } = await parseMultipartFormData(request);
      const fotoBuffer = files.foto;

      if (!fotoBuffer) {
        sendJson(response, 400, { error: 'No se encontró archivo de foto.' });
        return;
      }

      // Validate image size (max 5MB)
      if (fotoBuffer.length > 5 * 1024 * 1024) {
        sendJson(response, 400, { error: 'La foto no debe superar 5MB.' });
        return;
      }

      const nombreArchivo = fields.nombreArchivo || `foto-${Date.now()}.jpg`;
      const tipoMime = fields.tipoMime || 'image/jpeg';

      const result = await pool.query(
        `INSERT INTO activo_fotos (activo_id, foto_data, nombre_archivo, tipo_mime, tamanio_bytes, principal)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, activo_id AS "activoId", nombre_archivo AS "nombreArchivo", tipo_mime AS "tipoMime", tamanio_bytes AS "tamanioBytes", principal, created_at AS "createdAt"`,
        [activoId, fotoBuffer, nombreArchivo, tipoMime, fotoBuffer.length, fields.principal === 'true' || false]
      );

      sendJson(response, 201, result.rows[0]);
      return;
    } catch (error) {
      console.error('Error uploading photo:', error);
      sendJson(response, 500, { error: 'No fue posible subir la foto.' });
      return;
    }
  }

  // GET /api/activos/:id/fotos/:fotoId - Download a photo
  const activoFotoDownloadMatch = request.url?.match(/^\/api\/activos\/([^/]+)\/fotos\/([^/]+)$/);
  if (request.method === 'GET' && activoFotoDownloadMatch) {
    try {
      const activoId = decodeURIComponent(activoFotoDownloadMatch[1]);
      const fotoId = decodeURIComponent(activoFotoDownloadMatch[2]);

      const result = await pool.query<{ foto_data: Buffer; tipo_mime: string; nombre_archivo: string }>(
        `SELECT foto_data, tipo_mime, nombre_archivo FROM activo_fotos
         WHERE id = $1 AND activo_id = $2`,
        [fotoId, activoId]
      );

      if (result.rowCount === 0) {
        sendJson(response, 404, { error: 'Foto no encontrada.' });
        return;
      }

      const foto = result.rows[0];
      response.writeHead(200, {
        'Content-Type': foto.tipo_mime,
        'Content-Disposition': `inline; filename="${foto.nombre_archivo}"`,
        'Cache-Control': 'public, max-age=31536000',
      });
      response.end(foto.foto_data);
      return;
    } catch (error) {
      console.error('Error downloading photo:', error);
      sendJson(response, 500, { error: 'No fue posible descargar la foto.' });
      return;
    }
  }

  // DELETE /api/activos/:id/fotos/:fotoId - Delete a photo
  if (request.method === 'DELETE' && activoFotoDownloadMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const activoId = decodeURIComponent(activoFotoDownloadMatch[1]);
      const fotoId = decodeURIComponent(activoFotoDownloadMatch[2]);

      // Verify activo belongs to company
      const activoCheck = await pool.query('SELECT id FROM activos WHERE id = $1 AND compania_id = $2', [activoId, companiaId]);
      if (activoCheck.rowCount === 0) {
        sendJson(response, 404, { error: 'Activo no encontrado.' });
        return;
      }

      await pool.query('DELETE FROM activo_fotos WHERE id = $1 AND activo_id = $2', [fotoId, activoId]);

      sendJson(response, 200, { message: 'Foto eliminada correctamente.' });
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible eliminar la foto.' });
      return;
    }
  }

  // GET /api/activos/:id/documentos/:index - Download a document attachment
  const activoDocumentDownloadMatch = request.url?.match(/^\/api\/activos\/([^/]+)\/documentos\/(\d+)$/);
  if (request.method === 'GET' && activoDocumentDownloadMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const activoId = decodeURIComponent(activoDocumentDownloadMatch[1]);
      const documentIndex = parseInt(activoDocumentDownloadMatch[2], 10);

      const result = await pool.query<{ documentos_adjuntos: any }>(
        `SELECT documentos_adjuntos FROM activos WHERE id = $1 AND compania_id = $2`,
        [activoId, companiaId]
      );

      if (result.rowCount === 0 || !result.rows[0].documentos_adjuntos) {
        sendJson(response, 404, { error: 'Documento no encontrado.' });
        return;
      }

      const documentos = result.rows[0].documentos_adjuntos;
      if (!Array.isArray(documentos) || documentIndex < 0 || documentIndex >= documentos.length) {
        sendJson(response, 404, { error: 'Documento no encontrado.' });
        return;
      }

      const documento = documentos[documentIndex];
      if (!documento || !documento.base64 || !documento.nombre) {
        sendJson(response, 404, { error: 'Documento inválido.' });
        return;
      }

      // Extract base64 data (handle both data URL format and pure base64)
      let base64Data = documento.base64;
      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/data:.*?;base64,(.+)/);
        if (matches) {
          base64Data = matches[1];
        }
      }

      const buffer = Buffer.from(base64Data, 'base64');
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${documento.nombre}"`,
        'Cache-Control': 'public, max-age=31536000',
      });
      response.end(buffer);
      return;
    } catch (error) {
      console.error('Error downloading document:', error);
      sendJson(response, 500, { error: 'No fue posible descargar el documento.' });
      return;
    }
  }

  // GET /api/oportunidades/:id/contratos/:index - Download a contract attachment
  const oportunidadContratoDownloadMatch = request.url?.match(/^\/api\/oportunidades\/([^/]+)\/contratos\/(\d+)$/);
  if (request.method === 'GET' && oportunidadContratoDownloadMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const oportunidadId = decodeURIComponent(oportunidadContratoDownloadMatch[1]);
      const contratoIndex = parseInt(oportunidadContratoDownloadMatch[2], 10);

      const result = await pool.query<{ contratos_adjuntos: any }>(
        `SELECT contratos_adjuntos FROM oportunidades WHERE id = $1 AND compania_id = $2`,
        [oportunidadId, companiaId]
      );

      if (result.rowCount === 0 || !result.rows[0].contratos_adjuntos) {
        sendJson(response, 404, { error: 'Contrato no encontrado.' });
        return;
      }

      const contratos = result.rows[0].contratos_adjuntos;
      if (!Array.isArray(contratos) || contratoIndex < 0 || contratoIndex >= contratos.length) {
        sendJson(response, 404, { error: 'Contrato no encontrado.' });
        return;
      }

      const contrato = contratos[contratoIndex];
      if (!contrato || !contrato.base64 || !contrato.nombre) {
        sendJson(response, 404, { error: 'Contrato inválido.' });
        return;
      }

      let base64Data = contrato.base64;
      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/data:.*?;base64,(.+)/);
        if (matches) {
          base64Data = matches[1];
        }
      }

      const buffer = Buffer.from(base64Data, 'base64');
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${contrato.nombre}"`,
        'Cache-Control': 'public, max-age=31536000',
      });
      response.end(buffer);
      return;
    } catch (error) {
      console.error('Error downloading contract:', error);
      sendJson(response, 500, { error: 'No fue posible descargar el contrato.' });
      return;
    }
  }

  // GET /api/oportunidades/:id/documentos/:index - Download a document attachment
  const oportunidadDocumentoDownloadMatch = request.url?.match(/^\/api\/oportunidades\/([^/]+)\/documentos\/(\d+)$/);
  if (request.method === 'GET' && oportunidadDocumentoDownloadMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const oportunidadId = decodeURIComponent(oportunidadDocumentoDownloadMatch[1]);
      const documentoIndex = parseInt(oportunidadDocumentoDownloadMatch[2], 10);

      const result = await pool.query<{ documentos_adjuntos: any }>(
        `SELECT documentos_adjuntos FROM oportunidades WHERE id = $1 AND compania_id = $2`,
        [oportunidadId, companiaId]
      );

      if (result.rowCount === 0 || !result.rows[0].documentos_adjuntos) {
        sendJson(response, 404, { error: 'Documento no encontrado.' });
        return;
      }

      const documentos = result.rows[0].documentos_adjuntos;
      if (!Array.isArray(documentos) || documentoIndex < 0 || documentoIndex >= documentos.length) {
        sendJson(response, 404, { error: 'Documento no encontrado.' });
        return;
      }

      const documento = documentos[documentoIndex];
      if (!documento || !documento.base64 || !documento.nombre) {
        sendJson(response, 404, { error: 'Documento inválido.' });
        return;
      }

      let base64Data = documento.base64;
      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/data:.*?;base64,(.+)/);
        if (matches) {
          base64Data = matches[1];
        }
      }

      const buffer = Buffer.from(base64Data, 'base64');
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${documento.nombre}"`,
        'Cache-Control': 'public, max-age=31536000',
      });
      response.end(buffer);
      return;
    } catch (error) {
      console.error('Error downloading document:', error);
      sendJson(response, 500, { error: 'No fue posible descargar el documento.' });
      return;
    }
  }

  // GET /api/activo-categorias - Get all active activo categories
  if (request.method === 'GET' && request.url === '/api/activo-categorias') {
    try {
      const result = await pool.query(
        `SELECT id, nombre, descripcion, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM activo_categorias
         ORDER BY nombre`
      );
      sendJson(response, 200, result.rows);
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible obtener las categorías.' });
      return;
    }
  }

  // POST /api/activo-categorias - Create a new category (admin only)
  if (request.method === 'POST' && request.url === '/api/activo-categorias') {
    try {
      if (!(await isAdminRequest(request))) {
        sendJson(response, 403, { error: 'Se requiere permiso de administrador.' });
        return;
      }
      const body = await readJson(request) as any;
      if (!body.nombre) {
        sendJson(response, 400, { error: 'El nombre es requerido.' });
        return;
      }
      const result = await pool.query(
        `INSERT INTO activo_categorias (nombre, descripcion, is_active)
         VALUES ($1, $2, true)
         RETURNING id, nombre, descripcion, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"`,
        [body.nombre, body.descripcion || '']
      );
      sendJson(response, 201, result.rows[0]);
      return;
    } catch (error) {
      if ((error as any).code === '23505') {
        sendJson(response, 409, { error: 'Esta categoría ya existe.' });
      } else {
        sendJson(response, 500, { error: 'No fue posible crear la categoría.' });
      }
      return;
    }
  }

  // PATCH /api/activo-categorias/:id - Update a category (admin only)
  const categMatch = request.url?.match(/^\/api\/activo-categorias\/([^/]+)$/);
  if (request.method === 'PATCH' && categMatch) {
    try {
      if (!(await isAdminRequest(request))) {
        sendJson(response, 403, { error: 'Se requiere permiso de administrador.' });
        return;
      }
      const categId = decodeURIComponent(categMatch[1]);
      const body = await readJson(request) as any;

      const updates: string[] = [];
      const values: any[] = [categId];
      let paramCount = 1;

      if (body.nombre !== undefined) {
        updates.push(`nombre = $${++paramCount}`);
        values.push(body.nombre);
      }
      if (body.descripcion !== undefined) {
        updates.push(`descripcion = $${++paramCount}`);
        values.push(body.descripcion);
      }
      if (body.isActive !== undefined) {
        updates.push(`is_active = $${++paramCount}`);
        values.push(body.isActive);
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) {
        sendJson(response, 400, { error: 'No fields to update.' });
        return;
      }

      await pool.query(
        `UPDATE activo_categorias SET ${updates.join(', ')} WHERE id = $1`,
        values
      );

      const result = await pool.query(
        `SELECT id, nombre, descripcion, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM activo_categorias WHERE id = $1`,
        [categId]
      );

      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Categoría no encontrada.' });
        return;
      }

      sendJson(response, 200, result.rows[0]);
      return;
    } catch (error) {
      if ((error as any).code === '23505') {
        sendJson(response, 409, { error: 'Esta categoría ya existe.' });
      } else {
        sendJson(response, 500, { error: 'No fue posible actualizar la categoría.' });
      }
      return;
    }
  }

  // DELETE /api/activo-categorias/:id - Delete a category (admin only)
  if (request.method === 'DELETE' && categMatch) {
    try {
      if (!(await isAdminRequest(request))) {
        sendJson(response, 403, { error: 'Se requiere permiso de administrador.' });
        return;
      }
      const categId = decodeURIComponent(categMatch[1]);

      await pool.query('DELETE FROM activo_categorias WHERE id = $1', [categId]);
      sendJson(response, 200, { message: 'Categoría eliminada exitosamente.' });
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible eliminar la categoría.' });
      return;
    }
  }

  // GET /api/marcas - Get marcas for authenticated user's company
  if (request.method === 'GET' && request.url === '/api/marcas') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const result = await pool.query(
        `SELECT id, nombre, tipo_identificacion AS "tipoIdentificacion", identificacion,
                rut_nombre_archivo AS "rutNombre", sector_id AS "sectorId", persona_contacto_1 AS "personaContacto1",
                telefono_contacto_1 AS "telefonoContacto1", correo_contacto_1 AS "correoContacto1", cargo_contacto_1 AS "cargoContacto1",
                persona_contacto_2 AS "personaContacto2", telefono_contacto_2 AS "telefonoContacto2",
                correo_contacto_2 AS "correoContacto2", cargo_contacto_2 AS "cargoContacto2", persona_contacto_3 AS "personaContacto3",
                telefono_contacto_3 AS "telefonoContacto3", correo_contacto_3 AS "correoContacto3", cargo_contacto_3 AS "cargoContacto3",
                contactar_por_whatsapp AS "contactarPorWhatsapp", contactar_por_correo AS "contactarPorCorreo",
                creado_por AS "creadoPor", actualizado_por AS "actualizadoPor",
                created_at AS "createdAt", updated_at AS "updatedAt", compania_id AS "companiaId"
         FROM marcas WHERE compania_id = $1 ORDER BY created_at DESC`,
        [companiaId]
      );
      sendJson(response, 200, result.rows);
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible obtener las marcas.' });
      return;
    }
  }

  // POST /api/marcas - Create a new marca
  if (request.method === 'POST' && request.url === '/api/marcas') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const body = await readJson(request) as any;

      // Convert base64 to Buffer for storage
      let rutBuffer: Buffer | null = null;
      let rutNombre: string | null = null;
      if (body.rutUrl && typeof body.rutUrl === 'string' && body.rutUrl.startsWith('data:')) {
        const matches = body.rutUrl.match(/data:.*?;base64,(.+)/);
        if (matches) {
          rutBuffer = Buffer.from(matches[1], 'base64');
          rutNombre = body.rutNombre || 'rut.pdf';
        }
      }

      const marcaId = randomUUID();
      const logoInicial = body.nombre?.substring(0, 2)?.toUpperCase() || 'MA';
      const result = await pool.query(
        `INSERT INTO marcas (id, compania_id, nombre, tipo_identificacion, identificacion,
                rut_data, rut_nombre_archivo, sector_id, persona_contacto_1, telefono_contacto_1, correo_contacto_1, cargo_contacto_1,
                persona_contacto_2, telefono_contacto_2, correo_contacto_2, cargo_contacto_2,
                persona_contacto_3, telefono_contacto_3, correo_contacto_3, cargo_contacto_3,
                logo_iniciales, color_marca, contacto_nombre, contacto_cargo, contacto_email, contacto_telefono,
                contactar_por_whatsapp, contactar_por_correo, creado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
         RETURNING id, nombre, tipo_identificacion AS "tipoIdentificacion", identificacion,
                rut_nombre_archivo AS "rutNombre", sector_id AS "sectorId", persona_contacto_1 AS "personaContacto1",
                telefono_contacto_1 AS "telefonoContacto1", correo_contacto_1 AS "correoContacto1", cargo_contacto_1 AS "cargoContacto1",
                persona_contacto_2 AS "personaContacto2", telefono_contacto_2 AS "telefonoContacto2",
                correo_contacto_2 AS "correoContacto2", cargo_contacto_2 AS "cargoContacto2", persona_contacto_3 AS "personaContacto3",
                telefono_contacto_3 AS "telefonoContacto3", correo_contacto_3 AS "correoContacto3", cargo_contacto_3 AS "cargoContacto3",
                contactar_por_whatsapp AS "contactarPorWhatsapp", contactar_por_correo AS "contactarPorCorreo",
                creado_por AS "creadoPor", actualizado_por AS "actualizadoPor",
                created_at AS "createdAt", updated_at AS "updatedAt", compania_id AS "companiaId"`,
        [marcaId, companiaId, body.nombre, body.tipoIdentificacion, body.identificacion,
         rutBuffer, rutNombre, body.sectorId || null, body.personaContacto1 || null, body.telefonoContacto1 || null,
         body.correoContacto1 || null, body.cargoContacto1 || null, body.personaContacto2 || null, body.telefonoContacto2 || null,
         body.correoContacto2 || null, body.cargoContacto2 || null, body.personaContacto3 || null, body.telefonoContacto3 || null,
         body.correoContacto3 || null, body.cargoContacto3 || null, logoInicial, '#000000', body.personaContacto1 || '', body.cargoContacto1 || '', body.correoContacto1 || '', body.telefonoContacto1 || '', body.contactarPorWhatsapp || false, body.contactarPorCorreo || false, userId]
      );
      sendJson(response, 201, result.rows[0]);
      return;
    } catch (error) {
      console.error('Error creating marca:', error instanceof Error ? error.message : error, '\n', error);
      sendJson(response, 500, { error: 'No fue posible crear la marca.' });
      return;
    }
  }

  // PATCH /api/marcas/:id - Update a marca
  const marcaMatch = request.url?.match(/^\/api\/marcas\/([^/]+)$/);
  if (request.method === 'PATCH' && marcaMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const marcaId = decodeURIComponent(marcaMatch[1]);
      const body = await readJson(request) as any;

      const updates: string[] = [];
      const values: any[] = [marcaId, companiaId];
      let paramCount = 2;

      if (body.nombre !== undefined) {
        updates.push(`nombre = $${++paramCount}`);
        values.push(body.nombre);
      }
      if (body.tipoIdentificacion !== undefined) {
        updates.push(`tipo_identificacion = $${++paramCount}`);
        values.push(body.tipoIdentificacion);
      }
      if (body.identificacion !== undefined) {
        updates.push(`identificacion = $${++paramCount}`);
        values.push(body.identificacion);
      }
      if (body.rutUrl !== undefined) {
        if (body.rutUrl && typeof body.rutUrl === 'string' && body.rutUrl.startsWith('data:')) {
          const matches = body.rutUrl.match(/data:.*?;base64,(.+)/);
          if (matches) {
            const rutBuffer = Buffer.from(matches[1], 'base64');
            updates.push(`rut_data = $${++paramCount}`);
            values.push(rutBuffer);
            updates.push(`rut_nombre_archivo = $${++paramCount}`);
            values.push(body.rutNombre || 'rut.pdf');
          }
        } else if (body.rutUrl === null) {
          updates.push(`rut_data = NULL`);
          updates.push(`rut_nombre_archivo = NULL`);
        }
      }
      if (body.sectorId !== undefined) {
        updates.push(`sector_id = $${++paramCount}`);
        values.push(body.sectorId);
      }
      if (body.personaContacto1 !== undefined) {
        updates.push(`persona_contacto_1 = $${++paramCount}`);
        values.push(body.personaContacto1);
      }
      if (body.telefonoContacto1 !== undefined) {
        updates.push(`telefono_contacto_1 = $${++paramCount}`);
        values.push(body.telefonoContacto1);
      }
      if (body.correoContacto1 !== undefined) {
        updates.push(`correo_contacto_1 = $${++paramCount}`);
        values.push(body.correoContacto1);
      }
      if (body.personaContacto2 !== undefined) {
        updates.push(`persona_contacto_2 = $${++paramCount}`);
        values.push(body.personaContacto2);
      }
      if (body.telefonoContacto2 !== undefined) {
        updates.push(`telefono_contacto_2 = $${++paramCount}`);
        values.push(body.telefonoContacto2);
      }
      if (body.correoContacto2 !== undefined) {
        updates.push(`correo_contacto_2 = $${++paramCount}`);
        values.push(body.correoContacto2);
      }
      if (body.personaContacto3 !== undefined) {
        updates.push(`persona_contacto_3 = $${++paramCount}`);
        values.push(body.personaContacto3);
      }
      if (body.telefonoContacto3 !== undefined) {
        updates.push(`telefono_contacto_3 = $${++paramCount}`);
        values.push(body.telefonoContacto3);
      }
      if (body.correoContacto3 !== undefined) {
        updates.push(`correo_contacto_3 = $${++paramCount}`);
        values.push(body.correoContacto3);
      }
      if (body.cargoContacto1 !== undefined) {
        updates.push(`cargo_contacto_1 = $${++paramCount}`);
        values.push(body.cargoContacto1);
      }
      if (body.cargoContacto2 !== undefined) {
        updates.push(`cargo_contacto_2 = $${++paramCount}`);
        values.push(body.cargoContacto2);
      }
      if (body.cargoContacto3 !== undefined) {
        updates.push(`cargo_contacto_3 = $${++paramCount}`);
        values.push(body.cargoContacto3);
      }
      if (body.contactarPorWhatsapp !== undefined) {
        updates.push(`contactar_por_whatsapp = $${++paramCount}`);
        values.push(body.contactarPorWhatsapp);
      }
      if (body.contactarPorCorreo !== undefined) {
        updates.push(`contactar_por_correo = $${++paramCount}`);
        values.push(body.contactarPorCorreo);
      }

      updates.push(`actualizado_por = $${++paramCount}`);
      values.push(userId);
      updates.push(`updated_at = NOW()`);

      if (updates.length === 2) {
        sendJson(response, 400, { error: 'No fields to update.' });
        return;
      }

      await pool.query(
        `UPDATE marcas SET ${updates.join(', ')} WHERE id = $1 AND compania_id = $2`,
        values
      );

      const result = await pool.query(
        `SELECT id, nombre, tipo_identificacion AS "tipoIdentificacion", identificacion,
                rut_nombre_archivo AS "rutNombre", sector_id AS "sectorId", persona_contacto_1 AS "personaContacto1",
                telefono_contacto_1 AS "telefonoContacto1", correo_contacto_1 AS "correoContacto1", cargo_contacto_1 AS "cargoContacto1",
                persona_contacto_2 AS "personaContacto2", telefono_contacto_2 AS "telefonoContacto2",
                correo_contacto_2 AS "correoContacto2", cargo_contacto_2 AS "cargoContacto2", persona_contacto_3 AS "personaContacto3",
                telefono_contacto_3 AS "telefonoContacto3", correo_contacto_3 AS "correoContacto3", cargo_contacto_3 AS "cargoContacto3",
                contactar_por_whatsapp AS "contactarPorWhatsapp", contactar_por_correo AS "contactarPorCorreo",
                creado_por AS "creadoPor", actualizado_por AS "actualizadoPor",
                created_at AS "createdAt", updated_at AS "updatedAt", compania_id AS "companiaId"
         FROM marcas WHERE id = $1 AND compania_id = $2`,
        [marcaId, companiaId]
      );

      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Marca not found' });
        return;
      }

      sendJson(response, 200, result.rows[0]);
      return;
    } catch (error: any) {
      console.error('Error updating marca:', error.message || error);
      sendJson(response, 500, { error: error.message || 'No fue posible actualizar la marca.' });
      return;
    }
  }

  // DELETE /api/marcas/:id - Delete a marca
  if (request.method === 'DELETE' && marcaMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const marcaId = decodeURIComponent(marcaMatch[1]);

      await pool.query('DELETE FROM marcas WHERE id = $1 AND compania_id = $2', [marcaId, companiaId]);

      sendJson(response, 200, { message: 'Marca deleted successfully' });
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible eliminar la marca.' });
      return;
    }
  }

  // GET /api/marcas/:id/rut - Download RUT PDF
  const rutMatch = request.url?.match(/^\/api\/marcas\/([^/]+)\/rut$/);
  if (request.method === 'GET' && rutMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const marcaId = decodeURIComponent(rutMatch[1]);

      const result = await pool.query<{ rut_data: Buffer | null; rut_nombre_archivo: string | null }>(
        'SELECT rut_data, rut_nombre_archivo FROM marcas WHERE id = $1 AND compania_id = $2',
        [marcaId, companiaId]
      );

      if (result.rows.length === 0 || !result.rows[0].rut_data) {
        sendJson(response, 404, { error: 'RUT no encontrado' });
        return;
      }

      const nombre = result.rows[0].rut_nombre_archivo || 'rut.pdf';
      response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombre}"`,
        'Access-Control-Allow-Origin': '*',
      });
      response.end(result.rows[0].rut_data);
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible descargar el RUT.' });
      return;
    }
  }

  // GET /api/oportunidades - Get oportunidades for authenticated user's company
  if (request.method === 'GET' && request.url === '/api/oportunidades') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const result = await pool.query(
        `SELECT id, marca_id AS "marcaId", responsable_id AS "responsableId",
                responsable_interno_nombre AS "responsableInternoNombre",
                responsable_interno_correo AS "responsableInternoCorreo",
                responsable_interno_telefono AS "responsableInternoTelefono",
                etapa,
                valor_estimado_cop AS "valorEstimadoCOP", fecha_estimada_cierre AS "fechaEstimadaCierre",
                activos_propuestos_ids AS "activosPropuestosIds", proximo_paso AS "proximoPaso",
                contratos_adjuntos AS "contratosAdjuntos", documentos_adjuntos AS "documentosAdjuntos",
                created_at AS "fechaCreacion"
         FROM oportunidades WHERE compania_id = $1 ORDER BY created_at DESC`,
        [companiaId]
      );
      sendJson(response, 200, result.rows);
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible obtener las oportunidades.' });
      return;
    }
  }

  // POST /api/oportunidades - Create a new oportunidad
  if (request.method === 'POST' && request.url === '/api/oportunidades') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const body = await readJson(request) as any;

      if (!body.marcaId || !body.marcaId.trim()) {
        sendJson(response, 400, { error: 'Marca es requerida.' });
        return;
      }
      if (!body.responsableId || !String(body.responsableId).trim()) {
        sendJson(response, 400, { error: 'Responsable/Contacto es requerido.' });
        return;
      }

      // Verificar si es un contacto de marca o un responsable de la organización
      const isContactoMarca = String(body.responsableId).includes('-contacto');
      if (!isContactoMarca) {
        // Si no es contacto de marca, verificar que el responsable exista
        const responsableExists = (await pool.query('SELECT id FROM responsables WHERE id = $1', [body.responsableId])).rows.length > 0;
        if (!responsableExists) {
          sendJson(response, 400, { error: 'Responsable no encontrado.' });
          return;
        }
      }
      if (!body.etapa || !body.etapa.trim()) {
        sendJson(response, 400, { error: 'Etapa es requerida.' });
        return;
      }
      if (!body.fechaEstimadaCierre) {
        sendJson(response, 400, { error: 'Fecha estimada de cierre es requerida.' });
        return;
      }
      if (!body.proximoPaso || !String(body.proximoPaso).trim()) {
        sendJson(response, 400, { error: 'Próximo paso es requerido.' });
        return;
      }
      if (!body.responsableInternoNombre || !String(body.responsableInternoNombre).trim()) {
        sendJson(response, 400, { error: 'Nombre responsable interno es requerido.' });
        return;
      }
      if (!body.responsableInternoCorreo || !String(body.responsableInternoCorreo).trim()) {
        sendJson(response, 400, { error: 'Correo responsable interno es requerido.' });
        return;
      }
      if (!body.responsableInternoTelefono || !String(body.responsableInternoTelefono).trim()) {
        sendJson(response, 400, { error: 'Teléfono responsable interno es requerido.' });
        return;
      }

      const oportunidadId = `opp-${Date.now()}`;
      const result = await pool.query(
        `INSERT INTO oportunidades (
          id, compania_id, marca_id, responsable_id, etapa, valor_estimado_cop,
          fecha_estimada_cierre, activos_propuestos_ids, proximo_paso,
          responsable_interno_nombre, responsable_interno_correo, responsable_interno_telefono,
          fecha_creacion, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE, NOW(), NOW())
         RETURNING id, marca_id AS "marcaId", responsable_id AS "responsableId", etapa,
                   valor_estimado_cop AS "valorEstimadoCOP",
                   fecha_estimada_cierre AS "fechaEstimadaCierre",
                   activos_propuestos_ids AS "activosPropuestosIds", proximo_paso AS "proximoPaso",
                   responsable_interno_nombre AS "responsableInternoNombre",
                   responsable_interno_correo AS "responsableInternoCorreo",
                   responsable_interno_telefono AS "responsableInternoTelefono",
                   contratos_adjuntos AS "contratosAdjuntos", documentos_adjuntos AS "documentosAdjuntos",
                   created_at AS "fechaCreacion"`,
        [
          oportunidadId,
          companiaId,
          body.marcaId,
          body.responsableId,
          body.etapa,
          body.valorEstimadoCOP || 0,
          body.fechaEstimadaCierre || null,
          JSON.stringify(body.activosPropuestosIds || []),
          body.proximoPaso || '',
          body.responsableInternoNombre,
          body.responsableInternoCorreo,
          body.responsableInternoTelefono,
        ]
      );
      sendJson(response, 201, result.rows[0]);
      return;
    } catch (error: any) {
      console.error('Error creating oportunidad:', error.message || error);
      sendJson(response, 500, { error: error.message || 'No fue posible crear la oportunidad.' });
      return;
    }
  }

  // GET /api/oportunidades/:id - Get a specific oportunidad
  const oportunidadGetMatch = request.url?.match(/^\/api\/oportunidades\/([^/]+)$/);
  if (request.method === 'GET' && oportunidadGetMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const oportunidadId = decodeURIComponent(oportunidadGetMatch[1]);

      const result = await pool.query(
        `SELECT id, marca_id AS "marcaId", responsable_id AS "responsableId", etapa,
                valor_estimado_cop AS "valorEstimadoCOP",
                fecha_estimada_cierre AS "fechaEstimadaCierre",
                activos_propuestos_ids AS "activosPropuestosIds", proximo_paso AS "proximoPaso",
                responsable_interno_nombre AS "responsableInternoNombre",
                responsable_interno_correo AS "responsableInternoCorreo",
                responsable_interno_telefono AS "responsableInternoTelefono",
                contratos_adjuntos AS "contratosAdjuntos", documentos_adjuntos AS "documentosAdjuntos",
                created_at AS "fechaCreacion"
         FROM oportunidades WHERE id = $1 AND compania_id = $2`,
        [oportunidadId, companiaId]
      );

      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Oportunidad no encontrada.' });
        return;
      }

      sendJson(response, 200, result.rows[0]);
      return;
    } catch (error) {
      console.error('Error fetching oportunidad:', error);
      sendJson(response, 500, { error: 'Error al obtener la oportunidad.' });
      return;
    }
  }

  // PATCH /api/oportunidades/:id - Update an oportunidad
  const oportunidadMatch = request.url?.match(/^\/api\/oportunidades\/([^/]+)$/);
  if (request.method === 'PATCH' && oportunidadMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const oportunidadId = decodeURIComponent(oportunidadMatch[1]);
      const body = await readJson(request) as any;

      console.log('🔄 Actualizando oportunidad:', { oportunidadId, body });

      // Get current oportunidad data to check if etapa is being changed
      const currentOportunidad = await pool.query(
        `SELECT marca_id AS "marcaId", etapa FROM oportunidades WHERE id = $1 AND compania_id = $2`,
        [oportunidadId, companiaId]
      );
      const etapaChanged = body.etapa !== undefined && currentOportunidad.rows[0]?.etapa !== body.etapa;
      console.log('📊 Cambio de etapa:', { etapaAnterior: currentOportunidad.rows[0]?.etapa, etapaNueva: body.etapa, etapaChanged });

      const updates: string[] = [];
      const values: any[] = [oportunidadId, companiaId];
      let paramCount = 2;

      if (body.marcaId !== undefined) {
        updates.push(`marca_id = $${++paramCount}`);
        values.push(body.marcaId);
      }
      if (body.responsableId !== undefined) {
        updates.push(`responsable_id = $${++paramCount}`);
        values.push(body.responsableId);
      }
      if (body.etapa !== undefined) {
        updates.push(`etapa = $${++paramCount}`);
        values.push(body.etapa);
      }
      if (body.valorEstimadoCOP !== undefined) {
        updates.push(`valor_estimado_cop = $${++paramCount}`);
        values.push(body.valorEstimadoCOP);
      }
      if (body.fechaEstimadaCierre !== undefined) {
        updates.push(`fecha_estimada_cierre = $${++paramCount}`);
        values.push(body.fechaEstimadaCierre);
      }
      if (body.activosPropuestosIds !== undefined) {
        updates.push(`activos_propuestos_ids = $${++paramCount}`);
        values.push(JSON.stringify(body.activosPropuestosIds));
      }
      if (body.proximoPaso !== undefined) {
        updates.push(`proximo_paso = $${++paramCount}`);
        values.push(body.proximoPaso);
      }
      if (body.contratosAdjuntos !== undefined) {
        updates.push(`contratos_adjuntos = $${++paramCount}`);
        values.push(JSON.stringify(body.contratosAdjuntos || []));
      }
      if (body.documentosAdjuntos !== undefined) {
        updates.push(`documentos_adjuntos = $${++paramCount}`);
        values.push(JSON.stringify(body.documentosAdjuntos || []));
      }
      if (body.responsableInternoNombre !== undefined) {
        updates.push(`responsable_interno_nombre = $${++paramCount}`);
        values.push(body.responsableInternoNombre);
      }
      if (body.responsableInternoCorreo !== undefined) {
        updates.push(`responsable_interno_correo = $${++paramCount}`);
        values.push(body.responsableInternoCorreo);
      }
      if (body.responsableInternoTelefono !== undefined) {
        updates.push(`responsable_interno_telefono = $${++paramCount}`);
        values.push(body.responsableInternoTelefono);
      }

      if (updates.length === 0) {
        sendJson(response, 400, { error: 'No fields to update.' });
        return;
      }

      updates.push(`updated_at = NOW()`);

      const updateResult = await pool.query(
        `UPDATE oportunidades SET ${updates.join(', ')} WHERE id = $1 AND compania_id = $2`,
        values
      );

      if (updateResult.rowCount === 0) {
        sendJson(response, 404, { error: 'Oportunidad no encontrada.' });
        return;
      }

      const result = await pool.query(
        `SELECT id, marca_id AS "marcaId", responsable_id AS "responsableId", etapa,
                valor_estimado_cop AS "valorEstimadoCOP",
                fecha_estimada_cierre AS "fechaEstimadaCierre",
                activos_propuestos_ids AS "activosPropuestosIds", proximo_paso AS "proximoPaso",
                responsable_interno_nombre AS "responsableInternoNombre",
                responsable_interno_correo AS "responsableInternoCorreo",
                responsable_interno_telefono AS "responsableInternoTelefono",
                contratos_adjuntos AS "contratosAdjuntos", documentos_adjuntos AS "documentosAdjuntos",
                created_at AS "fechaCreacion"
         FROM oportunidades WHERE id = $1 AND compania_id = $2`,
        [oportunidadId, companiaId]
      );

      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Oportunidad no encontrada.' });
        return;
      }

      // Send email notification if etapa changed
      if (etapaChanged && body.etapa) {
        const oportunidadFull = await pool.query(
          `SELECT id, marca_id, responsable_id, valor_estimado_cop FROM oportunidades WHERE id = $1 AND compania_id = $2`,
          [oportunidadId, companiaId]
        );

        if (oportunidadFull.rows.length > 0) {
          const opp = oportunidadFull.rows[0];
          // Extract contact number from responsable_id (format: "uuid-contacto1", "uuid-contacto2", etc.)
          const contactMatch = opp.responsable_id?.match(/contacto(\d)/);
          const numeroContacto = contactMatch ? parseInt(contactMatch[1]) : 1;

          const marcaData = await pool.query(
            `SELECT id, nombre, correo_contacto_1, correo_contacto_2, correo_contacto_3 FROM marcas WHERE id = $1`,
            [opp.marca_id]
          );

          if (marcaData.rows.length > 0) {
            const marca = marcaData.rows[0];
            const emailField = `correo_contacto_${numeroContacto}`;
            const email = marca[emailField];

            console.log('📧 Datos de marca para notificación:', {
              nombre: marca.nombre,
              numeroContacto,
              emailField,
              email,
              responsableId: opp.responsable_id
            });

            if (email) {
              // Send email asynchronously (don't wait for it)
              sendOportunidadStatusEmail(
                { nombre: marca.nombre, contacto: { email } },
                { valorEstimadoCOP: opp.valor_estimado_cop || 0, etapa: body.etapa }
              ).catch(err => console.error('Error enviando notificación:', err));
            } else {
              console.warn('⚠️ Correo de contacto no disponible:', {
                nombre: marca.nombre,
                numeroContacto,
                emailField,
                responsableId: opp.responsable_id
              });
            }
          }
        }
      }

      sendJson(response, 200, result.rows[0]);
      return;
    } catch (error) {
      console.error('Error updating oportunidad:', error instanceof Error ? error.message : error);
      sendJson(response, 500, { error: error instanceof Error ? error.message : 'No fue posible actualizar la oportunidad.' });
      return;
    }
  }

  // DELETE /api/oportunidades/:id - Delete an oportunidad
  const oportunidadDeleteMatch = request.url?.match(/^\/api\/oportunidades\/([^/]+)$/);
  if (request.method === 'DELETE' && oportunidadDeleteMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const oportunidadId = decodeURIComponent(oportunidadDeleteMatch[1]);

      const deleteResult = await pool.query(
        'DELETE FROM oportunidades WHERE id = $1 AND compania_id = $2',
        [oportunidadId, companiaId]
      );

      if (deleteResult.rowCount === 0) {
        sendJson(response, 404, { error: 'Oportunidad no encontrada.' });
        return;
      }

      sendJson(response, 200, { message: 'Oportunidad eliminada correctamente.' });
      return;
    } catch (error) {
      console.error('Error deleting oportunidad:', error);
      sendJson(response, 500, { error: 'No fue posible eliminar la oportunidad.' });
      return;
    }
  }

  // POST /api/acuerdos - Create a new acuerdo
  if (request.method === 'POST' && request.url === '/api/acuerdos') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const body = await readJson(request) as any;

      // Remove all foreign key constraints from acuerdos to allow flexible data storage
      try {
        await pool.query(`ALTER TABLE acuerdos DROP CONSTRAINT IF EXISTS acuerdos_responsable_id_fkey`);
        await pool.query(`ALTER TABLE acuerdos DROP CONSTRAINT IF EXISTS acuerdos_oportunidad_origen_id_fkey`);
        await pool.query(`ALTER TABLE acuerdos DROP CONSTRAINT IF EXISTS acuerdos_marca_id_fkey`);
      } catch (e) {
        // Constraints might already be removed
      }

      const acuerdoId = `acuerdo-${Date.now()}`;
      const result = await pool.query(
        `INSERT INTO acuerdos (id, nombre, marca_id, oportunidad_origen_id, responsable_id, responsable_correo, responsable_telefono, valor_cop, fecha_inicio, fecha_fin, estado, notas_renovacion, interes_renovacion, activos_incluidos_ids, compania_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id, nombre, marca_id AS "marcaId", oportunidad_origen_id AS "oportunidadOrigenId", responsable_id AS "responsableId", responsable_correo AS "responsableCorreo", responsable_telefono AS "responsableTelefono", valor_cop AS "valorCOP", TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS "fechaInicio", TO_CHAR(fecha_fin, 'YYYY-MM-DD') AS "fechaFin", estado, notas_renovacion AS "notasRenovacion", interes_renovacion AS "interesRenovacion", activos_incluidos_ids AS "activosIncluidosIds"`,
        [acuerdoId, body.nombre, body.marcaId, body.oportunidadOrigenId, body.responsableId, body.responsableCorreo || null, body.responsableTelefono || null, body.valorCOP, body.fechaInicio, body.fechaFin, body.estado, body.notasRenovacion, body.interesRenovacion, JSON.stringify(body.activosIncluidosIds || []), companiaId]
      );

      sendJson(response, 201, normalizeAcuerdo(result.rows[0]));
      return;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error creating acuerdo:', errorMsg);
      sendJson(response, 500, { error: errorMsg || 'No fue posible crear el acuerdo.' });
      return;
    }
  }

  // GET /api/acuerdos - Get all acuerdos for authenticated user's company
  if (request.method === 'GET' && request.url === '/api/acuerdos') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }

      const result = await pool.query(
        `SELECT a.id, a.nombre, a.marca_id AS "marcaId", a.oportunidad_origen_id AS "oportunidadOrigenId",
                a.responsable_id AS "responsableId", COALESCE(ac.username, ac.email) AS "responsableNombre",
                a.responsable_correo AS "responsableCorreo", a.responsable_telefono AS "responsableTelefono",
                a.valor_cop AS "valorCOP",
                TO_CHAR(a.fecha_inicio, 'YYYY-MM-DD') AS "fechaInicio", TO_CHAR(a.fecha_fin, 'YYYY-MM-DD') AS "fechaFin", a.estado,
                a.notas_renovacion AS "notasRenovacion", a.interes_renovacion AS "interesRenovacion",
                a.activos_incluidos_ids AS "activosIncluidosIds"
         FROM acuerdos a
         LEFT JOIN auth_credentials ac ON a.responsable_id::text = ac.id::text
         WHERE a.compania_id = $1 ORDER BY a.created_at DESC`,
        [companiaId]
      );

      sendJson(response, 200, result.rows.map(normalizeAcuerdo));
      return;
    } catch (error) {
      console.error('Error fetching acuerdos:', error instanceof Error ? error.message : error);
      sendJson(response, 500, { error: 'No fue posible obtener los acuerdos.' });
      return;
    }
  }

  // GET /api/oportunidades/:id/acuerdo - Get acuerdo for a specific oportunidad
  const oportunidadAcuerdoMatch = request.url?.match(/^\/api\/oportunidades\/([^/]+)\/acuerdo$/);
  if (request.method === 'GET' && oportunidadAcuerdoMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const oportunidadId = decodeURIComponent(oportunidadAcuerdoMatch[1]);

      const result = await pool.query(
        `SELECT a.id, a.nombre, a.marca_id AS "marcaId", a.oportunidad_origen_id AS "oportunidadOrigenId",
                a.responsable_id AS "responsableId", COALESCE(ac.username, ac.email) AS "responsableNombre",
                a.responsable_correo AS "responsableCorreo", a.responsable_telefono AS "responsableTelefono",
                a.valor_cop AS "valorCOP",
                TO_CHAR(a.fecha_inicio, 'YYYY-MM-DD') AS "fechaInicio", TO_CHAR(a.fecha_fin, 'YYYY-MM-DD') AS "fechaFin", a.estado,
                a.notas_renovacion AS "notasRenovacion", a.interes_renovacion AS "interesRenovacion",
                a.activos_incluidos_ids AS "activosIncluidosIds"
         FROM acuerdos a
         LEFT JOIN auth_credentials ac ON a.responsable_id::text = ac.id::text
         WHERE a.oportunidad_origen_id = $1 AND a.compania_id = $2 LIMIT 1`,
        [oportunidadId, companiaId]
      );

      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Acuerdo no encontrado.' });
        return;
      }

      sendJson(response, 200, normalizeAcuerdo(result.rows[0]));
      return;
    } catch (error) {
      sendJson(response, 500, { error: 'No fue posible obtener el acuerdo.' });
      return;
    }
  }

  // PATCH /api/acuerdos/:id - Update an acuerdo
  const acuerdoMatch = request.url?.match(/^\/api\/acuerdos\/([^/]+)$/);
  if (request.method === 'PATCH' && acuerdoMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const acuerdoId = decodeURIComponent(acuerdoMatch[1]);
      const body = await readJson(request) as any;

      const updates: string[] = [];
      const values: any[] = [acuerdoId, companiaId];
      let paramCount = 2;

      if (body.nombre !== undefined) {
        updates.push(`nombre = $${++paramCount}`);
        values.push(body.nombre);
      }
      if (body.responsableId !== undefined) {
        updates.push(`responsable_id = $${++paramCount}`);
        values.push(body.responsableId);
      }
      if (body.responsableCorreo !== undefined) {
        updates.push(`responsable_correo = $${++paramCount}`);
        values.push(body.responsableCorreo || null);
      }
      if (body.responsableTelefono !== undefined) {
        updates.push(`responsable_telefono = $${++paramCount}`);
        values.push(body.responsableTelefono || null);
      }
      if (body.valorCOP !== undefined) {
        updates.push(`valor_cop = $${++paramCount}`);
        values.push(body.valorCOP);
      }
      if (body.fechaInicio !== undefined) {
        updates.push(`fecha_inicio = $${++paramCount}`);
        values.push(body.fechaInicio);
      }
      if (body.fechaFin !== undefined) {
        updates.push(`fecha_fin = $${++paramCount}`);
        values.push(body.fechaFin);
      }
      if (body.estado !== undefined) {
        updates.push(`estado = $${++paramCount}`);
        values.push(body.estado);
      }
      if (body.notasRenovacion !== undefined) {
        updates.push(`notas_renovacion = $${++paramCount}`);
        values.push(body.notasRenovacion);
      }
      if (body.interesRenovacion !== undefined) {
        updates.push(`interes_renovacion = $${++paramCount}`);
        values.push(body.interesRenovacion);
      }
      if (body.activosIncluidosIds !== undefined) {
        updates.push(`activos_incluidos_ids = $${++paramCount}`);
        values.push(JSON.stringify(body.activosIncluidosIds || []));
      }

      updates.push('updated_at = NOW()');

      if (updates.length === 1) {
        sendJson(response, 400, { error: 'No fields to update.' });
        return;
      }

      const result = await pool.query(
        `UPDATE acuerdos SET ${updates.join(', ')} WHERE id = $1 AND compania_id = $2
         RETURNING id, nombre, marca_id AS "marcaId", oportunidad_origen_id AS "oportunidadOrigenId", responsable_id AS "responsableId", responsable_correo AS "responsableCorreo", responsable_telefono AS "responsableTelefono", valor_cop AS "valorCOP", TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS "fechaInicio", TO_CHAR(fecha_fin, 'YYYY-MM-DD') AS "fechaFin", estado, notas_renovacion AS "notasRenovacion", interes_renovacion AS "interesRenovacion", activos_incluidos_ids AS "activosIncluidosIds"`,
        values
      );

      if (result.rows.length === 0) {
        sendJson(response, 404, { error: 'Acuerdo no encontrado.' });
        return;
      }

      sendJson(response, 200, normalizeAcuerdo(result.rows[0]));
      return;
    } catch (error) {
      console.error('Error updating acuerdo:', error);
      sendJson(response, 500, { error: 'No fue posible actualizar el acuerdo.' });
      return;
    }
  }

  // DELETE /api/acuerdos/:id - Delete an acuerdo
  if (request.method === 'DELETE' && acuerdoMatch) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const acuerdoId = decodeURIComponent(acuerdoMatch[1]);

      await pool.query('DELETE FROM acuerdos WHERE id = $1 AND compania_id = $2', [acuerdoId, companiaId]);

      sendJson(response, 200, { message: 'Acuerdo eliminado correctamente.' });
      return;
    } catch (error) {
      console.error('Error deleting acuerdo:', error);
      sendJson(response, 500, { error: 'No fue posible eliminar el acuerdo.' });
      return;
    }
  }

  // POST /api/compromisos - Create a new compromiso
  if (request.method === 'POST' && request.url === '/api/compromisos') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const body = await readJson(request) as any;

      // Remove all foreign key constraints from compromisos to allow flexible data storage
      try {
        await pool.query(`ALTER TABLE compromisos DROP CONSTRAINT IF EXISTS compromisos_acuerdo_id_fkey`);
        await pool.query(`ALTER TABLE compromisos DROP CONSTRAINT IF EXISTS compromisos_responsable_id_fkey`);
      } catch (e) {
        // Constraints might already be removed
      }

      const compromisoId = `compromiso-${Date.now()}`;

      // Get marca_id from the associated acuerdo
      const acuerdoResult = await pool.query(
        `SELECT marca_id FROM acuerdos WHERE id = $1`,
        [body.acuerdoId]
      );
      const marcaIdFromAcuerdo = acuerdoResult.rows[0]?.marca_id || body.marcaId;

      const result = await pool.query(
        `INSERT INTO compromisos (id, acuerdo_id, marca_id, entregable, categoria, responsable_id, fecha_limite, prioridad, estado, progreso, evidencias_requeridas, observaciones, compania_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, acuerdo_id AS "acuerdoId", marca_id AS "marcaId", entregable, categoria, responsable_id AS "responsableId", fecha_limite AS "fechaLimite", prioridad, estado, progreso, evidencias_requeridas AS "evidenciasRequeridas", observaciones`,
        [compromisoId, body.acuerdoId, marcaIdFromAcuerdo, body.entregable, body.categoria, body.responsableId, body.fechaLimite, body.prioridad, body.estado, body.progreso, body.evidenciasRequeridas, body.observaciones, companiaId]
      );

      sendJson(response, 201, result.rows[0]);
      return;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error creating compromiso:', errorMsg);
      sendJson(response, 500, { error: errorMsg || 'No fue posible crear el compromiso.' });
      return;
    }
  }

  // GET /api/compromisos - Get all compromisos for a company
  if (request.method === 'GET' && request.url === '/api/compromisos') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }

      const result = await pool.query(
        `SELECT id, acuerdo_id AS "acuerdoId", marca_id AS "marcaId", entregable, categoria, responsable_id AS "responsableId",
                TO_CHAR(fecha_limite, 'YYYY-MM-DD') AS "fechaLimite", prioridad, estado, progreso,
                evidencias_requeridas AS "evidenciasRequeridas", observaciones
         FROM compromisos WHERE compania_id = $1 ORDER BY fecha_limite ASC`,
        [companiaId]
      );

      sendJson(response, 200, result.rows);
      return;
    } catch (error) {
      console.error('Error getting compromisos:', error);
      sendJson(response, 500, { error: 'No fue posible obtener los compromisos.' });
      return;
    }
  }

  // PATCH /api/compromisos/:id - Update a compromiso
  if (request.method === 'PATCH' && request.url?.startsWith('/api/compromisos/')) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const id = request.url.split('/')[3];
      const body = await readJson(request) as any;

      const updateFields: string[] = [];
      const updateValues: any[] = [id, companiaId];
      let paramIndex = 3;

      if (body.entregable !== undefined) {
        updateFields.push(`entregable = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.entregable);
      }
      if (body.categoria !== undefined) {
        updateFields.push(`categoria = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.categoria);
      }
      if (body.responsableId !== undefined) {
        updateFields.push(`responsable_id = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.responsableId);
      }
      if (body.fechaLimite !== undefined) {
        updateFields.push(`fecha_limite = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.fechaLimite);
      }
      if (body.prioridad !== undefined) {
        updateFields.push(`prioridad = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.prioridad);
      }
      if (body.estado !== undefined) {
        updateFields.push(`estado = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.estado);
      }
      if (body.progreso !== undefined) {
        updateFields.push(`progreso = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.progreso);
      }
      if (body.evidenciasRequeridas !== undefined) {
        updateFields.push(`evidencias_requeridas = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.evidenciasRequeridas);
      }
      if (body.observaciones !== undefined) {
        updateFields.push(`observaciones = $${paramIndex++}`);
        updateValues.splice(-1, 0, body.observaciones);
      }

      // If acuerdoId is being updated, fetch the new marca_id from that acuerdo
      if (body.acuerdoId !== undefined) {
        const acuerdoResult = await pool.query(
          `SELECT marca_id FROM acuerdos WHERE id = $1`,
          [body.acuerdoId]
        );
        if (acuerdoResult.rows[0]) {
          const newMarcaId = acuerdoResult.rows[0].marca_id;
          updateFields.push(`acuerdo_id = $${paramIndex++}`);
          updateValues.splice(-1, 0, body.acuerdoId);
          updateFields.push(`marca_id = $${paramIndex++}`);
          updateValues.splice(-1, 0, newMarcaId);
        }
      }

      if (updateFields.length === 0) {
        sendJson(response, 400, { error: 'No hay cambios para actualizar.' });
        return;
      }

      const result = await pool.query(
        `UPDATE compromisos SET ${updateFields.join(', ')}
         WHERE id = $1 AND compania_id = $2
         RETURNING id, acuerdo_id AS "acuerdoId", marca_id AS "marcaId", entregable, categoria, responsable_id AS "responsableId",
                   TO_CHAR(fecha_limite, 'YYYY-MM-DD') AS "fechaLimite", prioridad, estado, progreso,
                   evidencias_requeridas AS "evidenciasRequeridas", observaciones`,
        updateValues
      );

      if (result.rowCount === 0) {
        sendJson(response, 404, { error: 'Compromiso no encontrado.' });
        return;
      }

      sendJson(response, 200, result.rows[0]);
      return;
    } catch (error) {
      console.error('Error updating compromiso:', error);
      sendJson(response, 500, { error: 'No fue posible actualizar el compromiso.' });
      return;
    }
  }

  // DELETE /api/compromisos/:id - Delete a compromiso
  if (request.method === 'DELETE' && request.url?.startsWith('/api/compromisos/')) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const id = request.url.split('/')[3];

      const result = await pool.query(
        `DELETE FROM compromisos WHERE id = $1 AND compania_id = $2 RETURNING id`,
        [id, companiaId]
      );

      if (result.rowCount === 0) {
        sendJson(response, 404, { error: 'Compromiso no encontrado.' });
        return;
      }

      sendJson(response, 200, { message: 'Compromiso eliminado correctamente.' });
      return;
    } catch (error) {
      console.error('Error deleting compromiso:', error);
      sendJson(response, 500, { error: 'No fue posible eliminar el compromiso.' });
      return;
    }
  }

  // Servir archivos estáticos del frontend (pero NO para /api requests)
  if (request.method === 'GET' && !request.url?.startsWith('/api')) {
    (async () => {
      let filePath = decodeURIComponent(request.url?.split('?')[0] || '/');
      if (filePath === '/') filePath = '/index.html';

      const fullPath = join(__dirname, '..', 'dist', filePath);

      try {
        const content = await readFile(fullPath);
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
        };
        const ext = filePath.slice(filePath.lastIndexOf('.')) || '.html';
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content);
      } catch {
        // Si no encuentra el archivo, intenta servir index.html para React Router
        try {
          const indexContent = await readFile(join(__dirname, '..', 'dist', 'index.html'));
          response.writeHead(200, { 'Content-Type': 'text/html' });
          response.end(indexContent);
        } catch {
          // Si tampoco encuentra index.html, devuelve 404
          sendJson(response, 404, { error: 'Not found' });
        }
      }
    })();
    return;
  }

  // GET /api/evidencias - Get all evidencias for a company
  if (request.method === 'GET' && request.url === '/api/evidencias') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }

      const result = await pool.query(
        `SELECT id, compromiso_id AS "compromisoId", acuerdo_id AS "acuerdoId", tipo, titulo, descripcion,
                TO_CHAR(fecha_ejecucion, 'YYYY-MM-DD') AS "fechaEjecucion", ubicacion_canal AS "ubicacionCanal",
                responsable_id AS "responsableId", estado, color_preview AS "colorPreview", archivos
         FROM evidencias WHERE compania_id = $1 ORDER BY fecha_ejecucion DESC`,
        [companiaId]
      );

      sendJson(response, 200, result.rows);
      return;
    } catch (error) {
      console.error('Error getting evidencias:', error);
      sendJson(response, 500, { error: 'No fue posible obtener las evidencias.' });
      return;
    }
  }

  // POST /api/evidencias - Create a new evidencia
  if (request.method === 'POST' && request.url === '/api/evidencias') {
    try {
      console.log('POST /api/evidencias received');
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        console.log('No user ID');
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        console.log('No compania ID for user:', userId);
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const body = await readJson(request) as any;
      console.log('Request body:', JSON.stringify(body, null, 2));

      const evidenciaId = `evidencia-${Date.now()}`;
      const archivos = body.archivos ? JSON.stringify(body.archivos) : JSON.stringify([]);

      console.log('Inserting evidencia with ID:', evidenciaId);
      const result = await pool.query(
        `INSERT INTO evidencias (id, compromiso_id, acuerdo_id, tipo, titulo, descripcion, fecha_ejecucion, ubicacion_canal, responsable_id, compania_id, archivos, estado, color_preview)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::uuid, $11, $12, $13)
         RETURNING id, compromiso_id AS "compromisoId", acuerdo_id AS "acuerdoId", tipo, titulo, descripcion,
                   TO_CHAR(fecha_ejecucion, 'YYYY-MM-DD') AS "fechaEjecucion", ubicacion_canal AS "ubicacionCanal",
                   responsable_id AS "responsableId", estado, color_preview AS "colorPreview", archivos`,
        [evidenciaId, body.compromisoId, body.acuerdoId, body.tipo, body.titulo, body.descripcion, body.fechaEjecucion, body.ubicacionCanal, body.responsableId, companiaId, archivos, 'En revisión', body.colorPreview]
      );

      console.log('Evidencia created successfully:', evidenciaId);
      sendJson(response, 201, result.rows[0]);
      return;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error creating evidencia:', errorMsg);
      sendJson(response, 500, { error: errorMsg || 'No fue posible crear la evidencia.' });
      return;
    }
  }

  // PATCH /api/evidencias/:id - Update evidencia
  if (request.method === 'PATCH' && request.url?.startsWith('/api/evidencias/')) {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }
      const id = request.url.split('/')[3];
      const body = await readJson(request) as any;

      // Build dynamic UPDATE query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (body.tipo !== undefined) {
        updates.push(`tipo = $${paramIndex}`);
        values.push(body.tipo);
        paramIndex++;
      }
      if (body.titulo !== undefined) {
        updates.push(`titulo = $${paramIndex}`);
        values.push(body.titulo);
        paramIndex++;
      }
      if (body.descripcion !== undefined) {
        updates.push(`descripcion = $${paramIndex}`);
        values.push(body.descripcion);
        paramIndex++;
      }
      if (body.fechaEjecucion !== undefined) {
        updates.push(`fecha_ejecucion = $${paramIndex}`);
        values.push(body.fechaEjecucion);
        paramIndex++;
      }
      if (body.ubicacionCanal !== undefined) {
        updates.push(`ubicacion_canal = $${paramIndex}`);
        values.push(body.ubicacionCanal);
        paramIndex++;
      }
      if (body.archivos !== undefined) {
        updates.push(`archivos = $${paramIndex}`);
        values.push(JSON.stringify(body.archivos));
        paramIndex++;
      }
      if (body.estado !== undefined) {
        updates.push(`estado = $${paramIndex}`);
        values.push(body.estado);
        paramIndex++;
      }

      if (updates.length === 0) {
        sendJson(response, 400, { error: 'No fields to update.' });
        return;
      }

      values.push(id);
      values.push(companiaId);

      const result = await pool.query(
        `UPDATE evidencias SET ${updates.join(', ')} WHERE id = $${paramIndex} AND compania_id = $${paramIndex + 1}
         RETURNING id, compromiso_id AS "compromisoId", acuerdo_id AS "acuerdoId", tipo, titulo, descripcion,
                   TO_CHAR(fecha_ejecucion, 'YYYY-MM-DD') AS "fechaEjecucion", ubicacion_canal AS "ubicacionCanal",
                   responsable_id AS "responsableId", estado, color_preview AS "colorPreview", archivos`,
        values
      );

      if (result.rowCount === 0) {
        sendJson(response, 404, { error: 'Evidencia no encontrada.' });
        return;
      }

      sendJson(response, 200, result.rows[0]);
      return;
    } catch (error) {
      console.error('Error updating evidencia:', error);
      sendJson(response, 500, { error: 'No fue posible actualizar la evidencia.' });
      return;
    }
  }

  // POST /api/asistente/pregunta - AI Assistant question handler
  if (request.method === 'POST' && request.url === '/api/asistente/pregunta') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }

      const body = await readJson(request) as any;
      const pregunta = body.pregunta;

      if (!pregunta || typeof pregunta !== 'string') {
        sendJson(response, 400, { error: 'Se requiere una pregunta.' });
        return;
      }

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        sendJson(response, 500, { error: 'Configuración de OpenAI no disponible.' });
        return;
      }

      // Get relevant data from database for context
      const [marcasResult, acuerdosResult, compromisosResult, oportunidadesResult] = await Promise.all([
        pool.query(`SELECT id, nombre, persona_contacto_1, correo_contacto_1 FROM marcas WHERE compania_id = $1 LIMIT 10`, [companiaId]),
        pool.query(`SELECT id, nombre, marca_id, estado FROM acuerdos WHERE compania_id = $1 LIMIT 10`, [companiaId]),
        pool.query(`SELECT id, acuerdo_id, entregable, estado, progreso FROM compromisos WHERE compania_id = $1 LIMIT 10`, [companiaId]),
        pool.query(`SELECT id, marca_id, etapa FROM oportunidades WHERE compania_id = $1 LIMIT 10`, [companiaId]),
      ]);

      const contexto = `
Eres un asistente experto en gestión de patrocinios deportivos. Tienes acceso a los siguientes datos:

MARCAS (Patrocinadores):
${marcasResult.rows.map(m => `- ${m.nombre}`).join('\n')}

ACUERDOS (Patrocinios cerrados):
${acuerdosResult.rows.map(a => `- ${a.nombre} (${a.estado})`).join('\n')}

COMPROMISOS (Entregas pactadas):
${compromisosResult.rows.map(c => `- ${c.entregable} (${c.estado})`).join('\n')}

OPORTUNIDADES (Pipeline comercial):
${oportunidadesResult.rows.map(o => `- Etapa: ${o.etapa}`).join('\n')}

IMPORTANTE - INSTRUCCIONES PARA GENERAR ARCHIVOS:
Si el usuario pide un reporte, archivo, o cualquier tipo de descarga (ej: "dame un reporte", "genérame un archivo", "quiero un Excel", etc.),
debes responder COMENZANDO con una de estas líneas (sin el símbolo #):
- #GENERAR_ACUERDOS# si pide un archivo sobre acuerdos
- #GENERAR_COMPROMISOS# si pide un archivo sobre compromisos
- #GENERAR_OPORTUNIDADES# si pide un archivo sobre oportunidades
- #GENERAR_MARCAS# si pide un archivo sobre marcas

Luego continúa con tu respuesta normal en español.

Ejemplo: Si te piden "Dame un reporte de acuerdos", responde:
"#GENERAR_ACUERDOS# Aquí está el reporte de todos los acuerdos activos..."

Responde a la siguiente pregunta en español de forma clara y concisa:
      `;

      const messages = [
        {
          role: 'system' as const,
          content: contexto,
        },
        {
          role: 'user' as const,
          content: pregunta,
        },
      ];

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        sendJson(response, 500, { error: 'Error al procesar la pregunta con IA.' });
        return;
      }

      const openaiData = await openaiResponse.json();
      let respuesta = openaiData.choices?.[0]?.message?.content || 'No pude generar una respuesta.';

      let datosRespuesta: any = { respuesta };

      // Detectar marcadores de archivo en la respuesta
      const marcadoresArchivo = [
        { marcador: '#GENERAR_ACUERDOS#', tipo: 'acuerdos' },
        { marcador: '#GENERAR_COMPROMISOS#', tipo: 'compromisos' },
        { marcador: '#GENERAR_OPORTUNIDADES#', tipo: 'oportunidades' },
        { marcador: '#GENERAR_MARCAS#', tipo: 'marcas' },
      ];

      let tipoArchivoDetectado: string | null = null;

      for (const { marcador, tipo } of marcadoresArchivo) {
        if (respuesta.includes(marcador)) {
          tipoArchivoDetectado = tipo;
          // Remover el marcador de la respuesta que se muestra al usuario
          respuesta = respuesta.replace(marcador, '').trim();
          break;
        }
      }

      datosRespuesta.respuesta = respuesta;

      // Si se detectó un marcador, generar el archivo
      if (tipoArchivoDetectado) {
        let datos: any[] = [];

        if (tipoArchivoDetectado === 'acuerdos') {
          const resultado = await pool.query(
            `SELECT id, nombre, marca_id, estado FROM acuerdos WHERE compania_id = $1 ORDER BY nombre`,
            [companiaId]
          );
          datos = resultado.rows;
        } else if (tipoArchivoDetectado === 'compromisos') {
          const resultado = await pool.query(
            `SELECT id, acuerdo_id, entregable, estado, progreso FROM compromisos WHERE compania_id = $1 ORDER BY entregable`,
            [companiaId]
          );
          datos = resultado.rows;
        } else if (tipoArchivoDetectado === 'oportunidades') {
          const resultado = await pool.query(
            `SELECT id, marca_id, etapa FROM oportunidades WHERE compania_id = $1 ORDER BY etapa`,
            [companiaId]
          );
          datos = resultado.rows;
        } else if (tipoArchivoDetectado === 'marcas') {
          const resultado = await pool.query(
            `SELECT id, nombre, persona_contacto_1, correo_contacto_1 FROM marcas WHERE compania_id = $1 ORDER BY nombre`,
            [companiaId]
          );
          datos = resultado.rows;
        }

        // Generar Excel
        if (datos.length > 0) {
          const ws = XLSX.utils.json_to_sheet(datos);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Datos');
          const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
          const base64 = buffer.toString('base64');

          datosRespuesta.archivo = base64;
          datosRespuesta.nombreArchivo = `${tipoArchivoDetectado.charAt(0).toUpperCase() + tipoArchivoDetectado.slice(1)}.xlsx`;
          datosRespuesta.tipoArchivo = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
      }

      sendJson(response, 200, datosRespuesta);
      return;
    } catch (error) {
      console.error('Error in assistant endpoint:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      sendJson(response, 500, { error: 'Error interno al procesar la pregunta.' });
      return;
    }
  }

  // POST /api/asistente/generar-reporte - Generate Excel report
  if (request.method === 'POST' && request.url === '/api/asistente/generar-reporte') {
    try {
      const userId = request.headers['x-user-id'];
      if (typeof userId !== 'string' || !userId) {
        sendJson(response, 401, { error: 'Se requiere autenticación.' });
        return;
      }
      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 403, { error: 'Usuario sin compañía asignada.' });
        return;
      }

      const body = await readJson(request) as any;
      const tipo = body.tipo || 'acuerdos'; // acuerdos, compromisos, oportunidades

      let datos: any[] = [];
      let nombreArchivo = '';

      if (tipo === 'acuerdos') {
        const resultado = await pool.query(
          `SELECT id, nombre, marca_id, estado FROM acuerdos WHERE compania_id = $1 ORDER BY nombre`,
          [companiaId]
        );
        datos = resultado.rows;
        nombreArchivo = 'Acuerdos.xlsx';
      } else if (tipo === 'compromisos') {
        const resultado = await pool.query(
          `SELECT id, acuerdo_id, entregable, estado, progreso FROM compromisos WHERE compania_id = $1 ORDER BY entregable`,
          [companiaId]
        );
        datos = resultado.rows;
        nombreArchivo = 'Compromisos.xlsx';
      } else if (tipo === 'oportunidades') {
        const resultado = await pool.query(
          `SELECT id, marca_id, etapa FROM oportunidades WHERE compania_id = $1 ORDER BY etapa`,
          [companiaId]
        );
        datos = resultado.rows;
        nombreArchivo = 'Oportunidades.xlsx';
      }

      // Crear workbook
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Datos');

      // Generar buffer
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

      // Convertir a base64
      const base64 = buffer.toString('base64');

      sendJson(response, 200, {
        archivo: base64,
        nombre: nombreArchivo,
        tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      return;
    } catch (error) {
      console.error('Error generating report:', error);
      sendJson(response, 500, { error: 'Error al generar el reporte.' });
      return;
    }
  }

  // Zoho OAuth Callback
  if (request.method === 'GET' && request.url?.startsWith('/callback')) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const code = url.searchParams.get('code');

      if (!code) {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Error - OAuth</title>
              <style>
                body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
                h1 { color: #d32f2f; }
                p { color: #666; margin: 20px 0; }
                .code { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>❌ Error en OAuth</h1>
                <p>No se recibió el código de autorización.</p>
              </div>
            </body>
          </html>
        `);
        return;
      }

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Código de Autorización - Zoho</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px; }
              h1 { color: #1976d2; margin-top: 0; }
              p { color: #666; line-height: 1.6; }
              .code-box { background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 20px 0; border: 1px solid #ddd; }
              .instruction { margin: 20px 0; padding: 15px; background: #e3f2fd; border-left: 4px solid #1976d2; border-radius: 4px; }
              .env-var { background: #fff3e0; padding: 10px; border-radius: 4px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Autorización Completada</h1>
              <p>Tu código de autorización está listo. Cópialo exactamente y pégalo en la terminal:</p>

              <div class="code-box">${code}</div>

              <div class="instruction">
                <strong>Próximos pasos:</strong>
                <ol>
                  <li>Copia el código de arriba</li>
                  <li>Vuelve a la terminal</li>
                  <li>Pégalo cuando se te solicite el "Código de autorización"</li>
                  <li>Recibirás tu Access Token</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      sendJson(response, 500, { error: 'Error procesando callback' });
    }
    return;
  }

  // POST /api/acuerdos/:id/enviar-alerta - Enviar alerta de acuerdo manualmente
  if (request.method === 'POST' && request.url?.match(/^\/api\/acuerdos\/[^/]+\/enviar-alerta/)) {
    try {
      const acuerdoId = request.url.split('/')[3];
      const userId = request.headers['x-user-id'] as string;

      if (!userId) {
        sendJson(response, 401, { error: 'No autorizado' });
        return;
      }

      const companiaId = await getUserCompaniaId(userId);
      if (!companiaId) {
        sendJson(response, 401, { error: 'No autorizado' });
        return;
      }

      // Get acuerdo data
      const acuerdoResult = await pool.query(
        `SELECT id, nombre, valor_cop, fecha_fin, marca_id, responsable_correo
        FROM acuerdos WHERE id = $1 AND compania_id = $2`,
        [acuerdoId, companiaId]
      );

      if (acuerdoResult.rows.length === 0) {
        console.error(`❌ Acuerdo ${acuerdoId} no encontrado`);
        sendJson(response, 404, { error: 'Acuerdo no encontrado' });
        return;
      }

      const acuerdo = acuerdoResult.rows[0];

      // Get marca data
      const marcaResult = await pool.query(
        `SELECT id, nombre, persona_contacto_1, correo_contacto_1
        FROM marcas WHERE id = $1`,
        [acuerdo.marca_id]
      );

      if (marcaResult.rows.length === 0) {
        console.error(`❌ Marca no encontrada para acuerdo ${acuerdoId}`);
        sendJson(response, 404, { error: 'Marca no encontrada' });
        return;
      }

      const marca = marcaResult.rows[0];

      // Enviar email al contacto de la marca
      if (marca.correo_contacto_1) {
        sendAcuerdoProximoAVencerEmail(
          { nombre: marca.nombre, contacto: { email: marca.correo_contacto_1 } },
          {
            nombre: acuerdo.nombre,
            valor: acuerdo.valor_cop || 0,
            vigenciaHasta: new Date(acuerdo.fecha_fin).toLocaleDateString('es-CO')
          }
        ).catch(err => console.error('❌ Error enviando alerta a marca:', err));
      }

      // Enviar email al responsable interno
      if (acuerdo.responsable_correo) {
        sendAcuerdoProximoAVencerEmail(
          { nombre: marca.nombre, contacto: { email: acuerdo.responsable_correo } },
          {
            nombre: acuerdo.nombre,
            valor: acuerdo.valor_cop || 0,
            vigenciaHasta: new Date(acuerdo.fecha_fin).toLocaleDateString('es-CO')
          }
        ).catch(err => console.error('❌ Error enviando alerta a responsable interno:', err));
      }

      console.log(`✅ Alertas enviadas para acuerdo: ${acuerdo.nombre}`);
      sendJson(response, 200, { success: true, message: 'Alerta enviada correctamente.' });
      return;
    } catch (error) {
      console.error('Error enviando alerta:', error);
      sendJson(response, 500, { error: 'Error al enviar la alerta.' });
      return;
    }
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(port, async () => {
  console.log(`Sports Act Hub API listening on http://localhost:${port}`);
  await ensureAcuerdoAlertaFields();
  await scheduleAcuerdoAlerts();
});