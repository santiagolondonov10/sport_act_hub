import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

async function testEmail() {
  console.log('🧪 Probando configuración de Zoho Mail...');
  console.log('Host:', process.env.EMAIL_HOST);
  console.log('Port:', process.env.EMAIL_PORT);
  console.log('User:', process.env.EMAIL_USER);
  console.log('From:', process.env.EMAIL_FROM);

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

  try {
    console.log('📧 Intentando verificar la conexión...');
    await transporter.verify();
    console.log('✅ Conexión exitosa con Zoho Mail');

    console.log('📤 Enviando email de prueba...');
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'quickdecisionsd@gmail.com',
      subject: '✅ Prueba de Email - Sports Act Hub',
      html: '<h1>¡Prueba exitosa!</h1><p>Este es un email de prueba desde Sports Act Hub</p>',
    });

    console.log('✅ Email enviado exitosamente');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  }

  process.exit(0);
}

testEmail();
