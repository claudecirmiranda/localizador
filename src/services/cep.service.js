const { geocodificarEndereco } = require('./geocoding.service');

/**
 * Normaliza um CEP para o formato "00000-000".
 * Aceita entrada com ou sem máscara.
 */
function normalizarCep(cepBruto) {
  const digitos = String(cepBruto || '').replace(/\D/g, '');
  if (digitos.length !== 8) {
    return null;
  }
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

/**
 * Converte um CEP em latitude/longitude usando a Geocoding API do Google.
 * Retorna { cep, latitude, longitude, endereco_formatado }.
 */
async function cepParaCoordenadas(cepBruto) {
  const cep = normalizarCep(cepBruto);
  if (!cep) {
    const erro = new Error('CEP inválido. Use o formato 00000-000.');
    erro.status = 400;
    throw erro;
  }

  // Usamos o próprio Geocoding API do Google com "CEP, Brasil" como endereço de busca.
  // Isso evita depender de uma segunda API (ex: ViaCEP) só para achar o endereço,
  // mas pode ser trocado facilmente depois se quisermos reduzir custo de chamadas Google.
  const resultado = await geocodificarEndereco(`${cep}, Brasil`);

  if (!resultado) {
    const erro = new Error('Não foi possível localizar esse CEP.');
    erro.status = 404;
    throw erro;
  }

  return {
    cep,
    latitude: resultado.latitude,
    longitude: resultado.longitude,
    endereco_formatado: resultado.endereco_formatado,
  };
}

module.exports = { normalizarCep, cepParaCoordenadas };
