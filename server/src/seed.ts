import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const projectRoot = resolve(__dirname, '../..');
import { responsables } from '../../src/data/responsables.js';
import { marcas } from '../../src/data/marcas.js';
import { activos } from '../../src/data/activos.js';
import { oportunidades } from '../../src/data/oportunidades.js';
import { acuerdos } from '../../src/data/acuerdos.js';
import { compromisos } from '../../src/data/compromisos.js';
import { evidencias } from '../../src/data/evidencias.js';
import { reportes } from '../../src/data/reportes.js';
import { capacidadesActivacion, campanasAudiencia, canalesAudiencia, evolucionContactosPropios, segmentosAudiencia } from '../../src/data/audiencia.js';

const client = await pool.connect();
const json = (value: unknown) => JSON.stringify(value);
const insert = async (table: string, columns: string[], values: unknown[]) => {
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  await client.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, values);
};
const monthDate = (month: string) => {
  const months: Record<string, string> = { Ene: '01', Enero: '01', Feb: '02', Febrero: '02', Mar: '03', Marzo: '03', Abr: '04', Abril: '04', May: '05', Mayo: '05', Jun: '06', Junio: '06', Jul: '07', Julio: '07', Ago: '08', Agosto: '08', Sep: '09', Septiembre: '09', Oct: '10', Octubre: '10', Nov: '11', Noviembre: '11', Dic: '12', Diciembre: '12' };
  return `2026-${months[month] ?? '01'}-01`;
};

async function applyMigrations() {
  const baseMigrations = ['001_initial_schema.sql', '002_audience_relationships.sql', '003_auth_credentials.sql', '004_subscriptions.sql', '005_roles_menu_access.sql', '006_admin_subscription_parametrizacion.sql', '007_companias.sql', '008_sectores.sql', '009_remove_roles.sql', '010_subscription_access_defaults.sql', '011_auth_compania.sql', '012_reportes_admin.sql', '013_password_reset.sql', '014_multi_tenant_compania_id.sql', '015_marcas_detalladas.sql', '016_marcas_sector.sql', '017_marcas_rut_bytea.sql', '018_marcas_cargo_contacto.sql', '019_update_menu_order.sql', '020_activo_categorias_table.sql', '021_oportunidades_adjuntos.sql', '022_remove_categoria_column_from_activos.sql'];
  const serverMigrations = ['022_activo_fotos_table.sql', '023_update_marcas_table.sql', '024_add_marketplace_menu_option.sql', '025_add_marketplace_to_subscriptions.sql', '026_add_contrato_to_oportunidades.sql', '027_add_documentos_to_activos.sql', '028_update_oportunidades_etapa_check.sql', '029_add_contratos_to_oportunidades.sql', '030_add_activos_ids_to_acuerdos.sql', '031_add_responsable_contact_to_acuerdos.sql', '032_remove_responsable_fkey_from_acuerdos.sql', '033_add_marcas_menu_option.sql', '034_fix_menu_order.sql', '035_add_activos_propuestos_to_oportunidades.sql', '036_remove_responsable_fkey_from_oportunidades.sql', '037_add_responsable_interno_to_oportunidades.sql'];
  const migrationFiles = baseMigrations.concat(serverMigrations);

  for (const filename of migrationFiles) {
    const isServerMigration = serverMigrations.includes(filename);
    const migrationDir = isServerMigration ? resolve(projectRoot, 'server/db/migrations') : resolve(projectRoot, 'database/migrations');

    const alreadyApplied = filename.startsWith('001')
      ? (await client.query(`SELECT to_regclass('public.responsables') IS NOT NULL AND to_regclass('public.marcas') IS NOT NULL AS exists`)).rows[0].exists
      : filename.startsWith('006')
      ? (await client.query(`SELECT EXISTS (SELECT 1 FROM menu_options WHERE code = 'parametrizacion') AS exists`)).rows[0].exists
      : filename.startsWith('009')
        ? !(await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_credentials' AND column_name = 'role_code') AS exists`)).rows[0].exists
        : filename.startsWith('010')
          ? (await client.query(`SELECT EXISTS (SELECT 1 FROM subscription_menu_access WHERE subscription_type = 'FREE' AND menu_option_code = 'dashboard') AND NOT EXISTS (SELECT 1 FROM subscription_menu_access WHERE subscription_type = 'FREE' AND menu_option_code = 'reportes') AS exists`)).rows[0].exists
          : filename.startsWith('011')
            ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_credentials' AND column_name = 'compania_id') AS exists`)).rows[0].exists
            : filename.startsWith('012')
              ? (await client.query(`SELECT EXISTS (SELECT 1 FROM menu_options WHERE code = 'reportes_admin') AS exists`)).rows[0].exists
              : filename.startsWith('013')
                ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_credentials' AND column_name = 'reset_token') AS exists`)).rows[0].exists
                : filename.startsWith('014')
                  ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activos' AND column_name = 'compania_id') AS exists`)).rows[0].exists
                  : filename.startsWith('015')
                    ? (await client.query(`SELECT to_regclass('public.marcas_detalladas') IS NOT NULL AS exists`)).rows[0].exists
                    : filename.startsWith('020')
                      ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activos' AND column_name = 'categoria_id') AS exists`)).rows[0].exists
                      : filename.startsWith('021')
                      ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oportunidades' AND column_name = 'documentos_adjuntos') AS exists`)).rows[0].exists
                      : filename.startsWith('022') && filename.includes('remove_categoria')
                        ? !(await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activos' AND column_name = 'categoria') AS exists`)).rows[0].exists
                        : filename.startsWith('022') && filename.includes('fotos')
                          ? (await client.query(`SELECT to_regclass('public.activo_fotos') IS NOT NULL AS exists`)).rows[0].exists
                          : filename.startsWith('024')
                          ? (await client.query(`SELECT EXISTS (SELECT 1 FROM menu_options WHERE code = 'marketplace') AS exists`)).rows[0].exists
                          : filename.startsWith('025')
                            ? (await client.query(`SELECT EXISTS (SELECT 1 FROM subscription_menu_access WHERE menu_option_code = 'marketplace') AS exists`)).rows[0].exists
                            : filename.startsWith('023')
                              ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marcas' AND column_name = 'compania_id') AS exists`)).rows[0].exists
                              : filename.startsWith('027')
                              ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activos' AND column_name = 'documentos_adjuntos') AS exists`)).rows[0].exists
                              : filename.startsWith('037')
                              ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oportunidades' AND column_name = 'responsable_interno_nombre') AS exists`)).rows[0].exists
                              : filename.startsWith('036')
                              ? !(await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'oportunidades' AND constraint_name = 'oportunidades_responsable_id_fkey') AS exists`)).rows[0].exists
                              : filename.startsWith('035')
                              ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oportunidades' AND column_name = 'activos_propuestos_ids') AS exists`)).rows[0].exists
                              : filename.startsWith('033')
                                ? (await client.query(`SELECT EXISTS (SELECT 1 FROM menu_options WHERE code = 'marcas') AS exists`)).rows[0].exists
                                : filename.startsWith('030')
                        ? (await client.query(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acuerdos' AND column_name = 'activos_incluidos_ids') AS exists`)).rows[0].exists
                        : (await client.query(`SELECT to_regclass('public.${filename.startsWith('002') ? 'activo_audiencias' : filename.startsWith('003') ? 'auth_credentials' : filename.startsWith('004') ? 'subscriptions' : filename.startsWith('005') ? 'menu_options' : filename.startsWith('007') ? 'companias' : 'sectores'}') IS NOT NULL AS exists`)).rows[0].exists;
    if (alreadyApplied) continue;
    try {
      const migration = await readFile(resolve(migrationDir, filename), 'utf8');
      await client.query(migration);
    } catch (e: any) {
      // Skip errors for objects that already exist or duplicate constraints
      if (e.code === '42P07' || e.code === '42P06' || e.code === '42701' || e.code === '25P02') {
        console.log(`Skipping migration ${filename} (${e.code})`);
        // Rollback aborted transaction and continue
        try {
          await client.query('ROLLBACK');
        } catch (rollbackErr) {
          // Transaction might not exist
        }
        continue;
      }
      throw e;
    }
  }
}

async function seed() {
  // Apply migrations BEFORE starting transaction
  await applyMigrations();

  await client.query('BEGIN');

  const adminExists = (await client.query(`SELECT 1 FROM auth_credentials WHERE username = 'admin' LIMIT 1`)).rowCount === 1;

  // Only clear data on first initialization (when admin user doesn't exist)
  if (!adminExists) {
    try {
      await client.query('DELETE FROM auth_credentials');
    } catch (e) {
      // Table might not exist yet
    }
    try {
      await client.query(`TRUNCATE TABLE reporte_metricas_mensuales, reportes, campana_evidencias, evidencias, compromisos, capacidad_activos, segmentos_capacidades, segmento_campanas_anteriores, segmento_activos, segmento_canales, campanas_audiencia, capacidades_activacion, canales_audiencia, activo_audiencias, segmentos_audiencia, acuerdo_activos, acuerdos, actividades_oportunidad, oportunidad_activos, oportunidades, activos, marcas, marcas_detalladas, responsables, evolucion_contactos RESTART IDENTITY CASCADE`);
    } catch (e) {
      // Tables might not exist yet
    }
  }

  await client.query(`INSERT INTO subscriptions (code, name, description, price_cop, max_users, features) VALUES
    ('FREE', 'Gratuita', 'Acceso inicial para explorar la plataforma.', 0, 1, '["Dashboard", "Activos", "Oportunidades"]'::jsonb),
    ('PRO', 'Profesional', 'Herramientas comerciales y operativas para equipos en crecimiento.', 0, 10, '["Dashboard", "Activos", "Oportunidades", "Acuerdos", "Compromisos", "Evidencias", "Reportes"]'::jsonb),
    ('ENTERPRISE', 'Empresarial', 'Configuración ampliada para organizaciones deportivas.', 0, NULL, '["Todos los módulos", "Usuarios ilimitados", "Soporte prioritario"]'::jsonb),
    ('ADMIN', 'Administrador', 'Acceso completo a la plataforma y a la parametrización del sistema.', 0, NULL, '["Todos los módulos", "Parametrización", "Gestión de accesos"]'::jsonb)
    ON CONFLICT (code) DO UPDATE SET updated_at = NOW()`);

  const companyId = '550e8400-e29b-41d4-a716-446655440000';
  const leonesId = '660f9511-f3ac-52e5-b827-557766551111';

  if (!adminExists) {
    for (const x of responsables) await insert('responsables', ['id', 'nombre', 'cargo', 'iniciales', 'avatar_color'], [x.id, x.nombre, x.cargo, x.iniciales, x.avatarColor]);

    await insert('companias', ['id', 'nombre', 'sector', 'nombre_contacto', 'telefono_contacto', 'mail_contacto'], [companyId, 'Club de Prueba', 'Fútbol', 'Juan Pérez', '+57 1 2345678', 'contacto@clubdeprueba.com']);
    await insert('companias', ['id', 'nombre', 'sector', 'nombre_contacto', 'telefono_contacto', 'mail_contacto'], [leonesId, 'Leones FC', 'Fútbol', 'Carlos López', '+57 2 9876543', 'info@leonesfc.com']);
    await insert('auth_credentials', ['email', 'username', 'password_hash', 'subscription_type', 'valid_from', 'valid_until', 'compania_id'], ['admin@sportsacthub.local', 'admin', await bcrypt.hash('Admin123!', 12), 'ADMIN', '2026-01-01T00:00:00Z', '2099-12-31T23:59:59Z', companyId]);

    for (const x of marcas) await insert('marcas', ['id', 'nombre', 'sector', 'logo_iniciales', 'color_marca', 'contacto_nombre', 'contacto_cargo', 'contacto_email', 'contacto_telefono'], [x.id, x.nombre, x.sector, x.logoIniciales, x.colorMarca, x.contacto.nombre, x.contacto.cargo, x.contacto.email, x.contacto.telefono]);
    for (const x of activos) {
      await insert('activos', ['id', 'compania_id', 'nombre', 'categoria_id', 'canal', 'descripcion', 'valoracion_cop', 'inventario_total', 'inventario_disponible', 'alcance_estimado', 'estado', 'derechos_incluidos', 'imagen_color'], [x.id, companyId, x.nombre, x.categoriaId, x.canal, x.descripcion, x.valoracionCOP, x.inventarioTotal, x.inventarioDisponible, x.alcanceEstimado, x.estado, json(x.derechosIncluidos), x.imagenColor]);
      if (x.audiencia) await insert('activo_audiencias', ['activo_id', 'canal_activacion', 'tipo_audiencia', 'alcance_estimado', 'capacidad_segmentacion', 'indicadores_disponibles', 'frecuencia_maxima', 'restricciones', 'requiere_go', 'actualizado_en'], [x.id, x.audiencia.canalActivacion, x.audiencia.tipoAudiencia, x.audiencia.alcanceEstimado, x.audiencia.capacidadSegmentacion, json(x.audiencia.indicadoresDisponibles), x.audiencia.frecuenciaMaxima, x.audiencia.restricciones, x.audiencia.requiereGO, x.audiencia.actualizadoEn]);
    }
    for (const x of segmentosAudiencia) await insert('segmentos_audiencia', ['id', 'nombre', 'descripcion', 'tipo_dato', 'tamano', 'crecimiento', 'canal_principal', 'indicador_destacado_etiqueta', 'indicador_destacado_valor', 'fuente_dato', 'estado', 'intereses', 'caracteristicas', 'canales_disponibles', 'indicadores_disponibles', 'actualizado_en'], [x.id, x.nombre, x.descripcion, x.tipoDato, x.tamano, x.crecimiento, x.canalPrincipal, x.indicadorDestacadoEtiqueta, x.indicadorDestacadoValor, x.fuenteDato, x.estado, json(x.intereses), json(x.caracteristicas), json(x.canalesDisponibles), json(x.indicadoresDisponibles), x.actualizadoEn]);
    for (const x of canalesAudiencia) await insert('canales_audiencia', ['id', 'nombre', 'tipo', 'tamano_audiencia', 'alcance_periodo', 'tasa_interaccion', 'tasa_conversion', 'crecimiento_periodo', 'frecuencia_activacion', 'capacidad_segmentacion', 'indicadores_disponibles', 'estado'], [x.id, x.nombre, x.tipo, x.tamanoAudiencia, x.alcancePeriodo, x.tasaInteraccion ?? null, x.tasaConversion ?? null, x.crecimientoPeriodo ?? null, x.frecuenciaActivacion, x.capacidadSegmentacion, json(x.indicadoresDisponibles), x.estado]);
    for (const x of capacidadesActivacion) await insert('capacidades_activacion', ['id', 'nombre', 'descripcion', 'canal_id', 'alcance_estimado', 'indicadores_medibles', 'estado'], [x.id, x.nombre, x.descripcion, x.canalId, x.alcanceEstimado, json(x.indicadoresMedibles), x.estado]);
    for (const x of oportunidades) {
      await insert('oportunidades', ['id', 'compania_id', 'marca_id', 'responsable_id', 'etapa', 'valor_estimado_cop', 'probabilidad', 'fecha_estimada_cierre', 'proximo_paso', 'fecha_creacion', 'motivo_perdida'], [x.id, companyId, x.marcaId, x.responsableId, x.etapa, x.valorEstimadoCOP, x.probabilidad, x.fechaEstimadaCierre, x.proximoPaso, x.fechaCreacion, x.motivoPerdida ?? null]);
      for (const id of x.activosPropuestosIds) await insert('oportunidad_activos', ['oportunidad_id', 'activo_id'], [x.id, id]);
      for (const a of x.actividad) await insert('actividades_oportunidad', ['id', 'compania_id', 'oportunidad_id', 'fecha', 'descripcion', 'autor'], [a.id, companyId, x.id, a.fecha, a.descripcion, a.autor]);
    }
    for (const x of acuerdos) {
      await insert('acuerdos', ['id', 'compania_id', 'nombre', 'marca_id', 'oportunidad_origen_id', 'responsable_id', 'valor_cop', 'fecha_inicio', 'fecha_fin', 'estado', 'notas_renovacion', 'interes_renovacion', 'activos_incluidos_ids'], [x.id, companyId, x.nombre, x.marcaId, x.oportunidadOrigenId ?? null, x.responsableId, x.valorCOP, x.fechaInicio, x.fechaFin, x.estado, x.notasRenovacion, x.interesRenovacion, json(x.activosIncluidosIds)]);
      for (const id of x.activosIncluidosIds) await insert('acuerdo_activos', ['acuerdo_id', 'activo_id'], [x.id, id]);
    }
    for (const x of campanasAudiencia) {
      await insert('campanas_audiencia', ['id', 'compania_id', 'nombre', 'objetivo', 'patrocinador_id', 'activo_id', 'acuerdo_id', 'periodo_inicio', 'periodo_fin', 'alcance', 'interacciones', 'registros', 'conversiones', 'meta_indicadores', 'resultado_indicadores', 'estado', 'recomendacion_renovacion'], [x.id, companyId, x.nombre, x.objetivo, x.patrocinadorId ?? null, x.activoId ?? null, x.acuerdoId ?? null, x.periodoInicio, x.periodoFin, x.alcance, x.interacciones, x.registros, x.conversiones, json(x.metaIndicadores), json(x.resultadoIndicadores), x.estado, x.recomendacionRenovacion]);
      for (const id of x.segmentosIds) await insert('campana_segmentos', ['campana_id', 'segmento_id'], [x.id, id]);
      for (const id of x.canalesIds) await insert('campana_canales', ['campana_id', 'canal_id'], [x.id, id]);
    }
    for (const x of compromisos) await insert('compromisos', ['id', 'compania_id', 'acuerdo_id', 'entregable', 'categoria', 'responsable_id', 'fecha_limite', 'prioridad', 'estado', 'progreso', 'evidencias_requeridas', 'observaciones', 'segmento_audiencia_id', 'canal_audiencia_id', 'activo_relacionado_id', 'indicador_comprometido', 'meta_indicador', 'periodo_indicador'], [x.id, companyId, x.acuerdoId, x.entregable, x.categoria, x.responsableId, x.fechaLimite, x.prioridad, x.estado, x.progreso, x.evidenciasRequeridas, x.observaciones, x.segmentoAudienciaId ?? null, x.canalAudienciaId ?? null, x.activoRelacionadoId ?? null, x.indicadorComprometido ?? null, x.metaIndicador ?? null, x.periodoIndicador ?? null]);
    for (const x of evidencias) {
      await insert('evidencias', ['id', 'compania_id', 'compromiso_id', 'acuerdo_id', 'tipo', 'titulo', 'descripcion', 'fecha_ejecucion', 'ubicacion_canal', 'responsable_id', 'estado', 'color_preview', 'url', 'campana_audiencia_id'], [x.id, companyId, x.compromisoId, x.acuerdoId, x.tipo, x.titulo, x.descripcion, x.fechaEjecucion, x.ubicacionCanal, x.responsableId, x.estado, x.colorPreview, x.url ?? null, x.campanaAudienciaId ?? null]);
      if (x.campanaAudienciaId) await insert('campana_evidencias', ['campana_id', 'evidencia_id'], [x.campanaAudienciaId, x.id]);
    }
    for (const x of reportes) {
      await insert('reportes', ['id', 'compania_id', 'acuerdo_id', 'periodo_inicio', 'periodo_fin', 'narrativa', 'alcance_total', 'impresiones_totales', 'interacciones', 'valor_mediatico_estimado_cop'], [x.id, companyId, x.acuerdoId, x.periodoInicio, x.periodoFin, x.narrativa, x.alcanceTotal, x.impresionesTotales, x.interacciones, x.valorMediaticoEstimadoCOP]);
      for (const m of x.metricasMensuales) await insert('reporte_metricas_mensuales', ['reporte_id', 'mes', 'alcance', 'impresiones', 'interacciones'], [x.id, monthDate(m.mes), m.alcance, m.impresiones, m.interacciones]);
    }
    for (const x of segmentosAudiencia) {
      for (const id of x.canalesDisponibles) await insert('segmento_canales', ['segmento_id', 'canal_id'], [x.id, id]);
      for (const id of x.activosRelacionadosIds) await insert('segmento_activos', ['segmento_id', 'activo_id'], [x.id, id]);
      for (const id of x.campanasAnterioresIds) await insert('segmento_campanas_anteriores', ['segmento_id', 'campana_id'], [x.id, id]);
    }
    for (const x of capacidadesActivacion) {
      for (const id of x.segmentosIds) await insert('segmentos_capacidades', ['segmento_id', 'capacidad_id'], [id, x.id]);
      for (const id of x.activosRelacionadosIds) await insert('capacidad_activos', ['capacidad_id', 'activo_id'], [x.id, id]);
    }
    for (const x of evolucionContactosPropios) await insert('evolucion_contactos', ['mes', 'contactos'], [x.mes, x.contactos]);
  }
  await client.query('COMMIT');
}

try {
  await seed();
  const { rows } = await client.query(`SELECT 'responsables' tabla, COUNT(*)::int total FROM responsables UNION ALL SELECT 'marcas', COUNT(*)::int FROM marcas UNION ALL SELECT 'activos', COUNT(*)::int FROM activos UNION ALL SELECT 'oportunidades', COUNT(*)::int FROM oportunidades UNION ALL SELECT 'acuerdos', COUNT(*)::int FROM acuerdos UNION ALL SELECT 'compromisos', COUNT(*)::int FROM compromisos UNION ALL SELECT 'evidencias', COUNT(*)::int FROM evidencias UNION ALL SELECT 'reportes', COUNT(*)::int FROM reportes UNION ALL SELECT 'segmentos_audiencia', COUNT(*)::int FROM segmentos_audiencia UNION ALL SELECT 'campanas_audiencia', COUNT(*)::int FROM campanas_audiencia`);
  console.table(rows);
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
