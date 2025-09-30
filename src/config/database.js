import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration for Azure SQL Server
const dbConfig = {
  user: process.env.DB_USER || 'sqlroot',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || ':.9Qpc:4KuH6VfH',
  server: process.env.DB_SERVER || 'pettracker.database.windows.net',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'techradarDEV', // Default to dev DB if not set
  options: {
    keepAlive: true,
    encrypt: true,
    enableArithAbort: true
  }
};

console.log(`Using database: ${dbConfig.database}`);

// Global SQL connection pool
let poolPromise;

async function connectToDatabase() {
  try {
    poolPromise = await sql.connect(dbConfig);
    console.log('Connected to the database');
  } catch (err) {
    console.error('Database connection failed: ', err);
    // For production, might want to exit process or retry connection
  }
}

function getDb() {
  if (!poolPromise) {
    throw new Error('Database not initialized');
  }
  return poolPromise;
}

export { connectToDatabase, getDb };
