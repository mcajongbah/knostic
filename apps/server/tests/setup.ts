import dotenv from 'dotenv';

// Set test environment
process.env.NODE_ENV = 'test';

dotenv.config({ path: '.env.test' });

// Suppress console warnings during tests
process.env.CLOUDFLARE_ACCOUNT_ID = 's36y456357y456';
process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 's36y456357y456';
process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 's36y456357y456';