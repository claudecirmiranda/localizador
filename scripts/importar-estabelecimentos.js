#!/usr/bin/env node
/**
 * Importa estabelecimentos de data/estabelecimentos.json para o SQLite.
 *
 * Comportamento (conforme spec, item 3):
 * - Se o registro já tem latitude/longitude no JSON fonte, usa como está.
 * - Se não tem, salva sem geolocalização e sinaliza que precisa rodar
 *   `npm run geocodificar` em seguida.
 *
 * Uso: npm run importar
 */
const fs = require('fs');
const path = require('path');
const { upsert } = require('../src/repositories/estabelecimento.repository');
require('../src/database/database'); // garante schema criado antes do upsert

const CAMINHO_JSON = path.join(__dirname, '..', 'data', 'estabelecimentos.json');

function validarRegistro(registro, indice) {
  const erros = [];
  if (!registro.codigo) erros.push('campo "codigo" ausente');
  if (!registro.apelido) erros.push('campo "apelido" ausente');
  if (!registro.endereco) {
    erros.push('campo "endereco" ausente');
  } else {
    if (!registro.endereco.logradouro) erros.push('endereco.logradouro ausente');
    if (!registro.endereco.cidade) erros.push('endereco.cidade ausente');
    if (!registro.endereco.uf) erros.push('endereco.uf ausente');
  }
  if (erros.length > 0) {
    return `Registro #${indice} (codigo=${registro.codigo ?? '?'}): ${erros.join('; ')}`;
  }
  return null;
}

function main() {
  if (!fs.existsSync(CAMINHO_JSON)) {
    console.error(`[importar] Arquivo não encontrado: ${CAMINHO_JSON}`);
    process.exit(1);
  }

  const bruto = fs.readFileSync(CAMINHO_JSON, 'utf-8');
  let conteudo;
  try {
    conteudo = JSON.parse(bruto);
  } catch (e) {
    console.error('[importar] JSON inválido:', e.message);
    process.exit(1);
  }

  // Aceita tanto um array simples [...] quanto { "estabelecimentos": [...] }
  const registros = Array.isArray(conteudo) ? conteudo : conteudo.estabelecimentos;

  if (!Array.isArray(registros)) {
    console.error(
      '[importar] O JSON deve ser um array de estabelecimentos, ou um objeto com a chave "estabelecimentos".'
    );
    process.exit(1);
  }

  let ok = 0;
  let invalidos = 0;
  let comGeolocalizacao = 0;
  let semGeolocalizacao = 0;
  const errosValidacao = [];

  registros.forEach((registro, indice) => {
    const erro = validarRegistro(registro, indice);
    if (erro) {
      invalidos++;
      errosValidacao.push(erro);
      return;
    }

    upsert(registro);
    ok++;

    if (registro.geolocalizacao?.latitude != null) {
      comGeolocalizacao++;
    } else {
      semGeolocalizacao++;
    }
  });

  console.log('--- Relatório de importação ---');
  console.log(`Total no arquivo: ${registros.length}`);
  console.log(`Importados com sucesso: ${ok}`);
  console.log(`  - já geolocalizados: ${comGeolocalizacao}`);
  console.log(`  - pendentes de geocodificação: ${semGeolocalizacao}`);
  console.log(`Inválidos (não importados): ${invalidos}`);

  if (errosValidacao.length > 0) {
    console.log('\nDetalhes dos inválidos:');
    errosValidacao.forEach((e) => console.log(`  - ${e}`));
  }

  if (semGeolocalizacao > 0) {
    console.log(
      `\n[próximo passo] Rode "npm run geocodificar" para obter lat/lng dos ${semGeolocalizacao} registro(s) pendente(s).`
    );
  }
}

main();
