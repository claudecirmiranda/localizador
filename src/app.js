const express = require('express');
const cors = require('cors');
const path = require('path');

const { config, validarConfigCritica } = require('./config/config');
const estabelecimentosRoutes = require('./routes/estabelecimentos.routes');

validarConfigCritica();

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Front-end estático (public/index.html, css, js, logos) - serve o front-end de demo.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'localizador',
    version: '1.0.0',
  });
});

app.use('/api', estabelecimentosRoutes);

// 404 para rotas de API não encontradas
app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Handler de erro central — nunca vaza stack trace para o cliente
// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  const status = erro.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[erro]', erro);
  }
  res.status(status).json({
    erro: erro.message || 'Erro interno do servidor.',
  });
});

module.exports = app;
