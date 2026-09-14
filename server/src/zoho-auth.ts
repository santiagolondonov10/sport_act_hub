import { config } from 'dotenv';
import * as readline from 'readline';

config();

const CLIENT_ID = '1000.XT5GXPWP58WZZZUX03D3WH7I7FR40A';
const CLIENT_SECRET = '5feeb4cd0b95f90494ee18be8e38dcb5132499e5f5';
const REDIRECT_URI = 'http://localhost:3001/callback';

async function getAccessToken() {
  console.log('🔑 Generador de Access Token para Zoho Mail\n');

  // URL de autorización
  const authUrl = `https://accounts.zoho.com/oauth/v2/auth?client_id=${CLIENT_ID}&scope=mail.accounts.ALL&response_type=code&redirect_uri=${REDIRECT_URI}&access_type=offline`;

  console.log('1️⃣  Abre esta URL en tu navegador:\n');
  console.log(authUrl);
  console.log('\n2️⃣  Autoriza la aplicación');
  console.log('3️⃣  Serás redirigido a: http://localhost:3001/callback?code=XXXXXX\n');
  console.log('4️⃣  Copia el código (la parte después de code=) y pégalo aquí:\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Código de autorización: ', async (authCode) => {
    rl.close();

    if (!authCode) {
      console.error('❌ Código no proporcionado');
      process.exit(1);
    }

    try {
      console.log('\n⏳ Intercambiando código por Access Token...\n');

      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: authCode,
        }).toString(),
      });

      const data = (await response.json()) as any;

      if (data.error) {
        console.error('❌ Error:', data.error_description || data.error);
        process.exit(1);
      }

      console.log('✅ Access Token generado exitosamente!\n');
      console.log('📋 Copia este token en tu archivo .env:\n');
      console.log(`ZOHO_ACCESS_TOKEN=${data.access_token}\n`);
      console.log('📦 También necesitarás agregar al .env:\n');
      console.log(`ZOHO_ORGANIZATION_ID=907119561`);
      console.log(`ZOHO_ACCOUNT_ID=907116213\n`);
      console.log(`ZOHO_REFRESH_TOKEN=${data.refresh_token}\n`);
    } catch (error) {
      console.error('❌ Error al obtener el token:', error);
      process.exit(1);
    }
  });
}

getAccessToken();
