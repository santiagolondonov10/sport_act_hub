import { config } from 'dotenv';
import nodemailer from 'nodemailer';

config();

async function testEmail() {
  console.log('🧪 Iniciando prueba de correo...');
  console.log('📧 Configuración:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD ? '***' : 'NO CONFIGURADA',
  });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('🔗 Verificando conexión...');
    await transporter.verify();
    console.log('✅ Conexión verificada');

    console.log('📤 Enviando correo de prueba...');
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'info@sportsact.co',
      to: 'santiagolondonov@gmail.com',
      subject: '🧪 Prueba de Correo - Sports Act Hub',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0066cc;">✅ Prueba de Correo Exitosa</h2>
            <p>Este es un correo de prueba para verificar que el sistema de notificaciones funciona correctamente.</p>
            <p><strong>Hora de envío:</strong> ${new Date().toLocaleString('es-CO')}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Sports Act Hub</p>
          </div>
        </div>
      `,
    });

    console.log('✅ ¡Correo enviado exitosamente!');
    console.log('📨 Detalles:', result);
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    process.exit(1);
  }
}

testEmail();
