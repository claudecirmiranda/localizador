const { getDatabase } = require('../database/database');

/**
 * Insere ou atualiza um estabelecimento (upsert por `codigo`).
 * Usado pela rotina de importação.
 */
function upsert(estabelecimento) {
  const db = getDatabase();
  const agora = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO estabelecimentos (
      codigo, apelido,
      logradouro, numero, bairro, cidade, uf, cep,
      endereco_completo,
      latitude, longitude, google_place_id,
      logo_url, ativo,
      geocodificado_em, atualizado_em
    ) VALUES (
      @codigo, @apelido,
      @logradouro, @numero, @bairro, @cidade, @uf, @cep,
      @endereco_completo,
      @latitude, @longitude, @google_place_id,
      @logo_url, @ativo,
      @geocodificado_em, @atualizado_em
    )
    ON CONFLICT(codigo) DO UPDATE SET
      apelido = excluded.apelido,
      logradouro = excluded.logradouro,
      numero = excluded.numero,
      bairro = excluded.bairro,
      cidade = excluded.cidade,
      uf = excluded.uf,
      cep = excluded.cep,
      endereco_completo = excluded.endereco_completo,
      -- só sobrescreve lat/lng/place_id se o novo valor não for nulo
      latitude = COALESCE(excluded.latitude, estabelecimentos.latitude),
      longitude = COALESCE(excluded.longitude, estabelecimentos.longitude),
      google_place_id = COALESCE(excluded.google_place_id, estabelecimentos.google_place_id),
      logo_url = excluded.logo_url,
      ativo = excluded.ativo,
      geocodificado_em = COALESCE(excluded.geocodificado_em, estabelecimentos.geocodificado_em),
      atualizado_em = excluded.atualizado_em
  `);

  stmt.run({
    codigo: estabelecimento.codigo,
    apelido: estabelecimento.apelido,
    logradouro: estabelecimento.endereco.logradouro,
    numero: estabelecimento.endereco.numero || null,
    bairro: estabelecimento.endereco.bairro || null,
    cidade: estabelecimento.endereco.cidade,
    uf: estabelecimento.endereco.uf,
    cep: estabelecimento.endereco.cep || null,
    endereco_completo: montarEnderecoCompleto(estabelecimento.endereco),
    latitude: estabelecimento.geolocalizacao?.latitude ?? null,
    longitude: estabelecimento.geolocalizacao?.longitude ?? null,
    google_place_id: estabelecimento.geolocalizacao?.place_id ?? null,
    logo_url: estabelecimento.logo?.url || null,
    ativo: estabelecimento.ativo === false ? 0 : 1,
    geocodificado_em: estabelecimento.geolocalizacao?.latitude != null ? agora : null,
    atualizado_em: agora,
  });
}

function montarEnderecoCompleto(endereco) {
  const partes = [
    `${endereco.logradouro}${endereco.numero ? ', ' + endereco.numero : ''}`,
    endereco.bairro,
    `${endereco.cidade} - ${endereco.uf}`,
  ].filter(Boolean);
  return partes.join(', ');
}

/** Retorna todos os estabelecimentos ativos que ainda não têm lat/lng. */
function buscarPendentesDeGeocodificacao() {
  const db = getDatabase();
  return db
    .prepare(`SELECT * FROM estabelecimentos WHERE ativo = 1 AND latitude IS NULL`)
    .all();
}

/** Atualiza lat/lng/place_id de um estabelecimento após geocodificação. */
function atualizarGeolocalizacao(codigo, { latitude, longitude, place_id }) {
  const db = getDatabase();
  const agora = new Date().toISOString();
  db.prepare(`
    UPDATE estabelecimentos
    SET latitude = ?, longitude = ?, google_place_id = ?,
        geocodificado_em = ?, atualizado_em = ?
    WHERE codigo = ?
  `).run(latitude, longitude, place_id || null, agora, agora, codigo);
}

/**
 * Retorna todos os estabelecimentos ativos e já geolocalizados.
 * É a base de candidatos para a busca por proximidade.
 */
function buscarAtivosGeolocalizados() {
  const db = getDatabase();
  return db
    .prepare(`
      SELECT * FROM estabelecimentos
      WHERE ativo = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL
    `)
    .all();
}

module.exports = {
  upsert,
  buscarPendentesDeGeocodificacao,
  atualizarGeolocalizacao,
  buscarAtivosGeolocalizados,
};
