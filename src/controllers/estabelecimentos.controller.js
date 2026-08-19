const { config } = require('../config/config');
const { cepParaCoordenadas } = require('../services/cep.service');
const { selecionarCandidatosMaisProximos } = require('../services/proximidade.service');
const { calcularMatrizDeRotas } = require('../services/routes.service');
const {
  buscarAtivosGeolocalizados,
} = require('../repositories/estabelecimento.repository');

function montarMapsUrl(estabelecimento) {
  const params = new URLSearchParams({
    api: '1',
    destination: `${estabelecimento.apelido}`,
  });
  if (estabelecimento.google_place_id) {
    params.set('destination_place_id', estabelecimento.google_place_id);
  } else {
    // fallback: usa lat/lng como destino se não tivermos place_id
    params.set('destination', `${estabelecimento.latitude},${estabelecimento.longitude}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * GET /api/estabelecimentos?cep=00000-000
 *
 * Fluxo:
 * 1. CEP -> lat/lng (Geocoding API)
 * 2. lat/lng -> N candidatos mais próximos em linha reta (cálculo local, sem chamar Google)
 * 3. candidatos -> distância/tempo reais (Routes API, uma única chamada em lote)
 * 4. ordena pelo tempo real e retorna os top resultados
 */
async function buscarEstabelecimentosProximos(req, res, next) {
  try {
    const { cep } = req.query;
    if (!cep) {
      return res.status(400).json({ erro: 'Parâmetro "cep" é obrigatório.' });
    }

    const origem = await cepParaCoordenadas(cep);

    const todosGeolocalizados = buscarAtivosGeolocalizados();
    if (todosGeolocalizados.length === 0) {
      return res.json({
        consulta: { cep: origem.cep, latitude: origem.latitude, longitude: origem.longitude },
        resultados: [],
      });
    }

    const candidatos = selecionarCandidatosMaisProximos(
      origem,
      todosGeolocalizados,
      config.proximidade.candidatos
    );

    const matrizRotas = await calcularMatrizDeRotas(origem, candidatos);

    const resultados = candidatos
      .map((c) => {
        const rota = matrizRotas.get(c.codigo);
        if (!rota) return null; // sem rota possível (ex: sem estrada), descarta
        return {
          codigo: c.codigo,
          apelido: c.apelido,
          logo: c.logo_url,
          endereco: c.endereco_completo,
          cep: c.cep,
          latitude: c.latitude,
          longitude: c.longitude,
          distancia_km: Math.round((rota.distancia_metros / 1000) * 10) / 10,
          tempo_minutos: Math.round(rota.duracao_segundos / 60),
          maps_url: montarMapsUrl(c),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.tempo_minutos - b.tempo_minutos)
      .slice(0, config.proximidade.resultados);

    res.json({
      consulta: { cep: origem.cep, latitude: origem.latitude, longitude: origem.longitude },
      resultados,
    });
  } catch (erro) {
    next(erro);
  }
}

module.exports = { buscarEstabelecimentosProximos };
