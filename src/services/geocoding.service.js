const { config } = require('../config/config');

/**
 * Geocodifica um endereço em texto livre usando a Google Geocoding API.
 * Retorna { latitude, longitude, place_id, endereco_formatado } ou null se não encontrado.
 */
async function geocodificarEndereco(enderecoTexto) {
  if (!config.google.apiKey) {
    const erro = new Error('GOOGLE_MAPS_API_KEY não configurada no servidor.');
    erro.status = 500;
    throw erro;
  }

  const url = new URL(config.google.geocodingUrl);
  url.searchParams.set('address', enderecoTexto);
  url.searchParams.set('region', 'br');
  url.searchParams.set('key', config.google.apiKey);

  const resposta = await fetch(url.toString());
  const dados = await resposta.json();

  if (dados.status === 'ZERO_RESULTS') {
    return null;
  }

  if (dados.status !== 'OK') {
    const erro = new Error(`Geocoding API retornou status ${dados.status}: ${dados.error_message || ''}`);
    erro.status = 502;
    throw erro;
  }

  const resultado = dados.results[0];
  return {
    latitude: resultado.geometry.location.lat,
    longitude: resultado.geometry.location.lng,
    place_id: resultado.place_id,
    endereco_formatado: resultado.formatted_address,
  };
}

module.exports = { geocodificarEndereco };
