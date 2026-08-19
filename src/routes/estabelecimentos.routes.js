const { Router } = require('express');
const { buscarEstabelecimentosProximos } = require('../controllers/estabelecimentos.controller');

const router = Router();

router.get('/estabelecimentos', buscarEstabelecimentosProximos);

module.exports = router;
