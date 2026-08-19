require('dotenv').config();

function parseIntEnv(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

const config = {
  port: parseIntEnv(process.env.PORT, 3000),
  env: process.env.NODE_ENV || 'development',

  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : true, // true = libera geral (usar apenas em dev)

  google: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    geocodingUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
    routesUrl: 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',
  },

  proximidade: {
    candidatos: parseIntEnv(process.env.PROXIMIDADE_CANDIDATOS, 5),
    resultados: parseIntEnv(process.env.PROXIMIDADE_RESULTADOS, 5),
  },

  database: {
    // Caminho relativo à raiz do projeto (resolvido via __dirname em database.js).
    path: process.env.DATABASE_PATH || 'data/estabelecimentos.db',
  },
};

function validarConfigCritica() {
  if (!config.google.apiKey || config.google.apiKey === 'coloque_sua_chave_aqui') {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] GOOGLE_MAPS_API_KEY não configurada. ' +
      'Geocodificação e cálculo de rotas vão falhar até você definir a chave no .env.'
    );
  }
}

module.exports = { config, validarConfigCritica };
