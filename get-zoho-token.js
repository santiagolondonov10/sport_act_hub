import * as readline from 'readline';

const CLIENT_ID = '1000.XT5GXPWP58WZZZUX03D3WH7I7FR40A';
const CLIENT_SECRET = '5feeb4cd0b95f90494ee18be8e38dcb5132499e5f5';
const REDIRECT_URI = 'http://localhost:3001/callback';

async function getAccessToken() {
  console.log('\n🔑 === Generador de Access Token para Zoho Mail ===\n');

  // URL de autorización
  const authUrl = `https://accounts.zoho.com/oauth/v2/auth?client_id=${CLIENT_ID}&scope=ZohoMail.accounts.ALL&response_type=code&redirect_uri=${REDIRECT_URI}&access_type=offline`;

  console.log('📋 PASO 1: Abre esta URL en tu navegador:\n');
  console.log(`${authUrl}\n`);
  console.log('━'.repeat(80) + '\n');

  console.log('✅ PASO 2: Haz click en "Aceptar"\n');
  console.log('━'.repeat(80) + '\n');

  console.log('🔗 PASO 3: Serás redirigido a http://localhost:3001/callback?code=XXXXX\n');
  console.log('   Copia EL CÓDIGO (la parte después de code=)\n');
  console.log('━'.repeat(80) + '\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('📌 Pega el código aquí: ', async (authCode) => {
    rl.close();

    if (!authCode?.trim()) {
      console.error('\n❌ Código no proporcionado');
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
          code: authCode.trim(),
        }).toString(),
      });

      const data = await response.json();

      if (data.error) {
        console.error(`\n❌ Error: ${data.error_description || data.error}\n`);
        process.exit(1);
      }

      console.log('✅ ¡Access Token generado exitosamente!\n');
      console.log('━'.repeat(80) + '\n');

      console.log('📋 COPIA ESTOS VALORES EN TU ARCHIVO .env:\n');
      console.log('───────────────────────────────────────────\n');

      console.log(`ZOHO_ACCESS_TOKEN=${data.access_token}\n`);
      console.log(`ZOHO_REFRESH_TOKEN=${data.refresh_token}\n`);
      console.log('ZOHO_ORGANIZATION_ID=907119561\n');
      console.log('ZOHO_ACCOUNT_ID=907116213\n');

      console.log('───────────────────────────────────────────\n');

      console.log('💾 El .env debe quedar así:\n');
      console.log(`
# Zoho Mail API
ZOHO_ACCESS_TOKEN=${data.access_token}
ZOHO_REFRESH_TOKEN=${data.refresh_token}
ZOHO_ORGANIZATION_ID=907119561
ZOHO_ACCOUNT_ID=907116213
      `);

      console.log('\n✅ ¡Listo! Ahora reinicia los servidores con:\n');
      console.log('npm run server:dev\nnpm run dev\n');
    } catch (error) {
      console.error('\n❌ Error al obtener el token:', error);
      process.exit(1);
    }
  });
}

getAccessToken();
