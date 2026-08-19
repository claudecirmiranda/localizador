const { config } = require('../config/config');

/**
 * Calcula distância (metros) e duração (segundos) reais de rota entre
 * uma origem e múltiplos destinos usando a Google Routes API
 * (Compute Route Matrix), no modo carro (DRIVE).
 *
 * `destinos` é um array de estabelecimentos com { codigo, latitude, longitude }.
 * Retorna um Map<codigo, { distancia_metros, duracao_segundos }>.
 */
async function calcularMatrizDeRotas(origem, destinos) {
  if (!config.google.apiKey) {
    const erro = new Error('GOOGLE_MAPS_API_KEY não configurada no servidor.');
    erro.status = 500;
    throw erro;
  }

  if (destinos.length === 0) {
    return new Map();
  }

  const body = {
    origins: [
      {
        waypoint: {
          location: {
            latLng: { latitude: origem.latitude, longitude: origem.longitude },
          },
        },
      },
    ],
    destinations: destinos.map((d) => ({
      waypoint: {
        location: {
          latLng: { latitude: d.latitude, longitude: d.longitude },
        },
      },
    })),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
  };

  const resposta = await fetch(config.google.routesUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.google.apiKey,
      // FieldMask é obrigatório na Routes API - pedimos só o necessário
      'X-Goog-FieldMask':
        'originIndex,destinationIndex,distanceMeters,duration,condition',
    },
    body: JSON.stringify(body),
  });

  if (!resposta.ok) {
    const textoErro = await resposta.text();
    const erro = new Error(`Routes API retornou ${resposta.status}: ${textoErro}`);
    erro.status = 502;
    throw erro;
  }

  const linhas = await resposta.json();

  const mapaResultados = new Map();
  for (const linha of linhas) {
    if (linha.condition !== 'ROUTE_EXISTS') continue;
    const destino = destinos[linha.destinationIndex];
    mapaResultados.set(destino.codigo, {
      distancia_metros: linha.distanceMeters,
      duracao_segundos: parseInt(String(linha.duration).replace('s', ''), 10),
    });
  }

  return mapaResultados;
}

module.exports = { calcularMatrizDeRotas };
