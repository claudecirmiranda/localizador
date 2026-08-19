# localizador

Backend: localizador das unidades mais próximas de um CEP, com distância e
tempo reais de deslocamento via Google Routes API.

## Como funciona (visão geral)

```
Browser → digita CEP
   ↓
API Node.js (Express)
   ↓
CEP → lat/lng (Google Geocoding API)
   ↓
lat/lng → N candidatos mais próximos em linha reta (cálculo local, sem custo)
   ↓
candidatos → distância/tempo reais (Google Routes API, 1 chamada em lote)
   ↓
JSON ordenado por tempo real → front-end
```

A chave do Google **nunca** é exposta ao navegador — todas as chamadas ao
Google acontecem no backend.

## Setup local

```bash
npm install
cp .env.example .env        # ajuste GOOGLE_MAPS_API_KEY
npm run db:init              # cria o banco SQLite com o schema
```

### 1. Dados dos estabelecimentos

Edite `data/estabelecimentos.json` com os estabelecimentos (formato
`{ "estabelecimentos": [...] }` ou um array direto). Cada registro precisa
no mínimo de `codigo`, `apelido` e `endereco` (`logradouro`, `cidade`, `uf`;
`numero`, `bairro`, `cep` são recomendados, mas opcionais). Se o registro já
vier com `geolocalizacao.latitude/longitude`, ela é aproveitada; caso
contrário, fica pendente de geocodificação.

### 2. Importar

```bash
npm run importar
```

Valida os registros, faz upsert no SQLite (por `codigo`) e mostra quantos
ficaram pendentes de geocodificação.

### 3. Geocodificar

Configure `GOOGLE_MAPS_API_KEY` no `.env` (Geocoding API + Routes API
habilitadas no Google Cloud Console, com billing vinculado ao projeto) e
rode:

```bash
npm run geocodificar
```

Busca lat/lng de todos os estabelecimentos pendentes. Ao final, lista os que
precisam de **validação manual** (endereço não encontrado pelo Google).

### 4. Rodar o servidor

```bash
npm start          # produção
npm run dev         # desenvolvimento (reinicia sozinho ao salvar)
```

Acesse `http://localhost:3000`.

## Fluxo para uma nova loja

Basta adicionar o registro (com ou sem lat/lng) em
`data/estabelecimentos.json` e rodar novamente `npm run importar` +
`npm run geocodificar`. A API de consulta só considera estabelecimentos
ativos e já geolocalizados.

## Estrutura do projeto

```
src/
  server.js                    entrada da aplicação (app.listen)
  app.js                       criação do app Express (rotas, middlewares)
  config/config.js             leitura centralizada do .env
  routes/                      definição de rotas HTTP
  controllers/                 orquestra o fluxo de uma requisição
  services/
    cep.service.js             CEP → lat/lng
    geocoding.service.js       chamada à Google Geocoding API
    proximidade.service.js     Haversine + seleção de candidatos
    routes.service.js          chamada à Google Routes API (matrix)
  repositories/                acesso ao SQLite
  database/                    conexão + schema.sql
scripts/
  importar-estabelecimentos.js
  geocodificar-estabelecimentos.js
data/
  estabelecimentos.json        arquivo fonte (editar aqui)
  estabelecimentos.db          gerado automaticamente (git-ignored)
public/                        front-end estático de demo (HTML/CSS/JS puro)
```

## API

### `GET /api/health`
```json
{ "status": "UP", "service": "localizador", "version": "1.0.0" }
```

### `GET /api/estabelecimentos?cep=30575-500`
Retorna o CEP consultado (com lat/lng) e a lista das unidades mais
próximas, já ordenadas por tempo real de deslocamento (carro), com
`distancia_km`, `tempo_minutos` e `maps_url` pronto para "Como chegar".

## Deploy na VPS Hostinger

### 1. Clone e configure

```bash
git clone https://github.com/claudecirmiranda/localizador.git
cd localizador
npm install --omit=dev
cp .env.example .env
# edite .env: GOOGLE_MAPS_API_KEY, CORS_ORIGIN (domínio do front-end), PORT
```

### 2. Gere o banco direto na VPS

```bash
npm run db:init
npm run importar
npm run geocodificar
```

### 3. Suba com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Configure o Nginx como proxy reverso

Veja `nginx.conf.example`. Depois:

```bash
sudo certbot --nginx -d localizador.seudominio.com.br
```

### 5. Teste

```bash
curl https://localizador.seudominio.com.br/api/health
curl "https://localizador.seudominio.com.br/api/estabelecimentos?cep=30575-500"
```

### Atualizando dados (novas lojas)

```bash
# edite data/estabelecimentos.json localmente, teste, depois:
git add data/estabelecimentos.json
git commit -m "Adiciona novas unidades"
git push

# na VPS:
git pull
npm run importar
npm run geocodificar
pm2 restart localizador
```

## Integração com o front-end (site separado)

Se o front-end estiver em outro domínio (ex: site JESD no Vercel), aponte a
constante `API_BASE_URL` do script do front-end para a URL desta API, e
garanta que `CORS_ORIGIN` no `.env` inclui o domínio do front-end.

## Decisões que fogem levemente de uma spec "padrão"

- **`better-sqlite3` em vez de `sqlite3`**: API síncrona, sem callbacks/promises
  manuais, mais simples para o volume do MVP (dezenas de estabelecimentos,
  poucas escritas).
- **CEP do usuário geocodificado via Google Geocoding API** (endereço
  `"CEP, Brasil"`) em vez de uma API brasileira de CEP dedicada (ex: ViaCEP).
  Mantém uma única integração externa; se o volume de consultas crescer,
  vale avaliar trocar por ViaCEP/BrasilAPI + Geocoding só do endereço
  retornado, para reduzir custo de chamadas ao Google.

## Próximos passos sugeridos (pós-MVP)

- Mapa com marcadores.
- Cache de CEP → lat/lng consultado recentemente, para reduzir chamadas à
  Geocoding API em CEPs repetidos.
- Se a base crescer muito, avaliar migração da busca de candidatos para
  PostGIS.
