#!/usr/bin/env node
/**
 * Geocodifica todos os estabelecimentos ativos que ainda não têm lat/lng.
 * Roda DEPOIS de `npm run importar`.
 *
 * Uso: npm run geocodificar
 */
const { geocodificarEndereco } = require('../src/services/geocoding.service');
const {
  buscarPendentesDeGeocodificacao,
  atualizarGeolocalizacao,
} = require('../src/repositories/estabelecimento.repository');
require('../src/database/database');

// Pequeno atraso entre chamadas para não estourar rate limit da API
const ATRASO_MS = 150;
const aguardar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const pendentes = buscarPendentesDeGeocodificacao();

  if (pendentes.length === 0) {
    console.log('[geocodificar] Nenhum estabelecimento pendente. Tudo já geolocalizado.');
    return;
  }

  console.log(`[geocodificar] ${pendentes.length} estabelecimento(s) pendente(s).`);

  let sucesso = 0;
  const falhas = [];

  for (const est of pendentes) {
    const enderecoTexto = `${est.logradouro}, ${est.numero || ''} - ${est.bairro || ''}, ${est.cidade} - ${est.uf}, ${est.cep || ''}, Brasil`;

    try {
      const resultado = await geocodificarEndereco(enderecoTexto);

      if (!resultado) {
        falhas.push({ codigo: est.codigo, apelido: est.apelido, motivo: 'Endereço não encontrado (ZERO_RESULTS)' });
        continue;
      }

      atualizarGeolocalizacao(est.codigo, resultado);
      sucesso++;
      console.log(`  ✓ [${est.codigo}] ${est.apelido} -> ${resultado.latitude}, ${resultado.longitude}`);
    } catch (erro) {
      falhas.push({ codigo: est.codigo, apelido: est.apelido, motivo: erro.message });
      console.log(`  ✗ [${est.codigo}] ${est.apelido} -> ERRO: ${erro.message}`);
    }

    await aguardar(ATRASO_MS);
  }

  console.log('\n--- Relatório de geocodificação ---');
  console.log(`Sucesso: ${sucesso}/${pendentes.length}`);

  if (falhas.length > 0) {
    console.log(`\nRequerem VALIDAÇÃO MANUAL (${falhas.length}):`);
    falhas.forEach((f) => console.log(`  - [${f.codigo}] ${f.apelido}: ${f.motivo}`));
    process.exitCode = 1;
  }
}

main();
