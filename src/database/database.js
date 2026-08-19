const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { config } = require('../config/config');

let instancia = null;

function resolverCaminhoDoBanco() {
  const raizDoProjeto = path.join(__dirname, '..', '..');
  return path.resolve(raizDoProjeto, config.database.path);
}

function getDatabase() {
  if (instancia) return instancia;

  const dbPath = resolverCaminhoDoBanco();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  instancia = new Database(dbPath);
  instancia.pragma('journal_mode = WAL');
  instancia.pragma('foreign_keys = ON');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  instancia.exec(schema);

  return instancia;
}

// Permite rodar `npm run db:init` isoladamente
if (require.main === module) {
  getDatabase();
  // eslint-disable-next-line no-console
  console.log(`[database] Banco inicializado em: ${resolverCaminhoDoBanco()}`);
}

module.exports = { getDatabase };
