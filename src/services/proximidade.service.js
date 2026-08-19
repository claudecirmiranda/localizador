const RAIO_TERRA_KM = 6371;

/** Converte graus em radianos. */
function paraRadianos(graus) {
  return (graus * Math.PI) / 180;
}

/**
 * Distância em linha reta (fórmula de Haversine), em km,
 * entre dois pontos lat/lng.
 */
function distanciaHaversineKm(origem, destino) {
  const dLat = paraRadianos(destino.latitude - origem.latitude);
  const dLng = paraRadianos(destino.longitude - origem.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(origem.latitude)) *
      Math.cos(paraRadianos(destino.latitude)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAIO_TERRA_KM * c;
}

/**
 * Recebe a origem (lat/lng do CEP do usuário) e uma lista de estabelecimentos
 * (cada um com latitude/longitude), calcula a distância em linha reta de cada um,
 * ordena do mais próximo para o mais distante e retorna os `limite` primeiros.
 *
 * Essa é a etapa de pré-filtro antes de chamar a Routes API — evita mandar
 * todos os estabelecimentos para o Google a cada consulta.
 */
function selecionarCandidatosMaisProximos(origem, estabelecimentos, limite) {
  return estabelecimentos
    .map((e) => ({
      ...e,
      distancia_linha_reta_km: distanciaHaversineKm(origem, {
        latitude: e.latitude,
        longitude: e.longitude,
      }),
    }))
    .sort((a, b) => a.distancia_linha_reta_km - b.distancia_linha_reta_km)
    .slice(0, limite);
}

module.exports = { distanciaHaversineKm, selecionarCandidatosMaisProximos };
