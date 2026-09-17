import nodemailer from 'nodemailer';

function formatCurrency(value: number): string {
  const num = Math.round(Number(value));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export async function sendOportunidadStatusEmail(
  marca: { nombre: string; contacto: { email: string } },
  oportunidad: { valorEstimadoCOP: number; etapa: string },
) {
  try {
    const destinatario = marca.contacto.email;

    if (!destinatario) {
      console.error('❌ Email del destinatario vacío');
      return false;
    }

    const valorFormateado = formatCurrency(oportunidad.valorEstimadoCOP);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            Actualización de Propuesta
          </h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Estimados,<br/><br/>
            Le informamos que la propuesta de patrocinio ha cambiado de estado.
          </p>

          <div style="background-color: #f9f9f9; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Marca:</strong> ${marca.nombre}</p>
            <p style="margin: 5px 0;"><strong>Nuevo Estado:</strong> <span style="color: #0066cc; font-weight: bold;">${oportunidad.etapa}</span></p>
            <p style="margin: 5px 0;"><strong>Valor:</strong> $ ${valorFormateado}</p>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Si tiene preguntas sobre este cambio, por favor contáctenos.
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Sports Act Hub<br/>
            info@sportsact.co
          </p>
        </div>
      </div>
    `;

    console.log(`📧 Enviando email a ${destinatario} para ${marca.nombre} (Estado: ${oportunidad.etapa})`);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'info@sportsact.co',
      to: destinatario,
      subject: `Actualización de Propuesta - ${marca.nombre} (${oportunidad.etapa})`,
      html: htmlContent,
    };

    console.log('📤 Enviando a través de SMTP Zoho...');
    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email enviado exitosamente a ${destinatario}`);
    console.log('📨 Message ID:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
}

export async function sendAcuerdoProximoAVencerEmail(
  marca: { nombre: string; contacto: { email: string } },
  acuerdo: { nombre: string; valor: number; vigenciaHasta: string; porcentajeConsumido?: number; umbral?: number },
) {
  try {
    const destinatario = marca.contacto.email;

    if (!destinatario) {
      console.error('❌ Email del destinatario vacío');
      return false;
    }

    const esAlertaPorcentaje = acuerdo.umbral !== undefined;
    const titulo = esAlertaPorcentaje
      ? `⚠️ Alerta: Acuerdo ha alcanzado ${acuerdo.umbral}% de consumo`
      : `⚠️ Alerta: Acuerdo Próximo a Vencerse`;

    const descripcion = esAlertaPorcentaje
      ? `Le informamos que el acuerdo ha alcanzado el ${acuerdo.umbral}% de consumo de tiempo.`
      : `Le informamos que el acuerdo está próximo a vencerse.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            ${titulo}
          </h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Estimados,<br/><br/>
            ${descripcion}
          </p>

          <div style="background-color: #f9f9f9; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Acuerdo:</strong> ${acuerdo.nombre}</p>
            <p style="margin: 5px 0;"><strong>Marca:</strong> ${marca.nombre}</p>
            ${acuerdo.valor > 0 ? `<p style="margin: 5px 0;"><strong>Valor:</strong> $ ${formatCurrency(acuerdo.valor)}</p>` : ''}
            ${acuerdo.porcentajeConsumido !== undefined ? `<p style="margin: 5px 0;"><strong>Consumo Actual:</strong> <span style="color: #0066cc; font-weight: bold;">${acuerdo.porcentajeConsumido}%</span></p>` : ''}
            <p style="margin: 5px 0;"><strong>Vencimiento:</strong> <span style="color: #0066cc; font-weight: bold;">${acuerdo.vigenciaHasta}</span></p>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Por favor, tome las acciones necesarias para la renovación si lo considera.
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Sports Act Hub<br/>
            info@sportsact.co
          </p>
        </div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'info@sportsact.co',
      to: destinatario,
      subject: `Alerta: Acuerdo Próximo a Vencerse - ${acuerdo.nombre}`,
      html: htmlContent,
    };

    console.log(`📧 Enviando alerta de acuerdo a ${destinatario}`);
    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Alerta enviada exitosamente a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando alerta de acuerdo:', error);
    return false;
  }
}

export async function sendEvidenciaAprobacionEmail(
  marca: { nombre: string; contacto: { email: string } },
  evidencia: { titulo: string; descripcion: string; tipo: string; acuerdoNombre: string; evidenciaId: string },
  archivos?: Array<{ nombre: string; tipo: string; datos?: string }>
) {
  try {
    const destinatario = marca.contacto.email;

    if (!destinatario) {
      console.error('❌ Email del destinatario vacío');
      return false;
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const aprobarUrl = `${backendUrl}/api/evidencias/${evidencia.evidenciaId}/aprobar`;
    const rechazarUrl = `${backendUrl}/api/evidencias/${evidencia.evidenciaId}/rechazar`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            📋 Nueva Evidencia para Aprobación
          </h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Estimados,<br/><br/>
            Hemos recibido una nueva evidencia que requiere su aprobación o rechazo.
          </p>

          <div style="background-color: #f9f9f9; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Acuerdo:</strong> ${evidencia.acuerdoNombre}</p>
            <p style="margin: 5px 0;"><strong>Evidencia:</strong> ${evidencia.titulo}</p>
            <p style="margin: 5px 0;"><strong>Tipo:</strong> ${evidencia.tipo}</p>
            ${evidencia.descripcion ? `<p style="margin: 5px 0;"><strong>Descripción:</strong> ${evidencia.descripcion}</p>` : ''}
          </div>

          ${archivos && archivos.length > 0 ? `
            <div style="margin: 20px 0;">
              <p style="color: #333; font-weight: bold; margin-bottom: 10px;">Archivos adjuntos:</p>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${archivos.map((a) => `<li style="padding: 5px 0; color: #666;">📎 ${a.nombre}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="margin: 30px 0; padding: 20px; background-color: #f0f7ff; border-radius: 8px;">
            <p style="color: #333; font-weight: bold; margin-bottom: 15px;">Por favor, indique si aprueba o rechaza esta evidencia:</p>
            <div style="display: flex; gap: 10px;">
              <a href="${aprobarUrl}?action=aprobar" style="flex: 1; padding: 12px 20px; background-color: #12a150; color: white; text-align: center; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                ✓ Aprobar
              </a>
              <a href="${rechazarUrl}?action=rechazar" style="flex: 1; padding: 12px 20px; background-color: #dc2626; color: white; text-align: center; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                ✗ Rechazar
              </a>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 15px; text-align: center;">
              Si rechaza esta evidencia, por favor agregue una observación en el sistema.
            </p>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Sports Act Hub<br/>
            info@sportsact.co
          </p>
        </div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const attachments = (archivos || [])
      .filter((a) => a.datos)
      .map((a) => ({
        filename: a.nombre,
        content: Buffer.from(a.datos!, 'base64'),
      }));

    const mailOptions: any = {
      from: process.env.EMAIL_FROM || 'info@sportsact.co',
      to: destinatario,
      subject: `Aprobación de Evidencia - ${evidencia.titulo}`,
      html: htmlContent,
    };

    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    console.log(`📧 Enviando solicitud de aprobación de evidencia a ${destinatario}${attachments.length > 0 ? ` con ${attachments.length} archivo(s)` : ''}`);
    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email de aprobación enviado exitosamente a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de aprobación:', error);
    return false;
  }
}

export async function sendEvidenciaResultadoEmail(
  responsableInterno: { nombre: string; email: string },
  evidencia: { titulo: string; acuerdoNombre: string; compromisoDatos: string },
  resultado: 'aprobada' | 'rechazada',
) {
  try {
    const destinatario = responsableInterno.email;

    if (!destinatario) {
      console.error('❌ Email del responsable interno vacío');
      return false;
    }

    const esAprobada = resultado === 'aprobada';
    const iconoEstado = esAprobada ? '✅' : '❌';
    const textoEstado = esAprobada ? 'Aprobada' : 'Rechazada';
    const colorEstado = esAprobada ? '#12a150' : '#dc2626';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid ${colorEstado}; padding-bottom: 10px;">
            ${iconoEstado} Evidencia ${textoEstado}
          </h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Estimados,<br/><br/>
            Le informamos que la marca ha ${esAprobada ? 'aprobado' : 'rechazado'} la siguiente evidencia:
          </p>

          <div style="background-color: #f9f9f9; border-left: 4px solid ${colorEstado}; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Acuerdo:</strong> ${evidencia.acuerdoNombre}</p>
            <p style="margin: 5px 0;"><strong>Compromiso:</strong> ${evidencia.compromisoDatos}</p>
            <p style="margin: 5px 0;"><strong>Evidencia:</strong> ${evidencia.titulo}</p>
            <p style="margin: 5px 0;"><strong>Estado:</strong> <span style="color: ${colorEstado}; font-weight: bold;">${textoEstado}</span></p>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            ${esAprobada
              ? 'La marca ha validado y aprobado esta entrega. Por favor, proceda con los siguientes compromisos.'
              : 'La marca ha rechazado esta entrega. Por favor, verifique la observación en el sistema y reenvíe la evidencia corregida.'}
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Sports Act Hub<br/>
            info@sportsact.co
          </p>
        </div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'info@sportsact.co',
      to: destinatario,
      subject: `${textoEstado}: Evidencia - ${evidencia.titulo}`,
      html: htmlContent,
    };

    console.log(`📧 Enviando notificación de evidencia ${resultado} a ${destinatario}`);
    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email de notificación enviado exitosamente a ${destinatario}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando email de evidencia ${resultado}:`, error);
    return false;
  }
}
