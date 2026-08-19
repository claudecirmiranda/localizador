const app = require('./app');
const { config } = require('./config/config');

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] localizador rodando na porta ${config.port} (${config.env})`);
});
