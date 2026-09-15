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
            ${acuerdo.valor > 0 ? `<p style="margin: 5px 0;"><strong>Valor:</strong> $ ${acuerdo.valor.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>` : ''}
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
