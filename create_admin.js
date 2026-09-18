import bcrypt from 'bcryptjs';

const password = 'Admin123!';
const hash = await bcrypt.hash(password, 10);

console.log(`Password hash: ${hash}`);
console.log(`\nInsert query:\nINSERT INTO auth_credentials (id, email, username, password_hash, compania_id, created_at, updated_at, subscription_type) VALUES (gen_random_uuid(), 'admin@sportsact.co', 'admin', '${hash}', 'd0a80428-a3ee-4919-af8c-2bf609ccbcd6', NOW(), NOW(), 'Admin');`);
