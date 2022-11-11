const express = require('express');
const router = express.Router();
const {validateUrl} = require('../middlewares/commonMiddlewares.js');
const {createShortUrl, urlRedirect, flushw} = require('../controllers/urlController.js');


router.post('/url/shorten', validateUrl, createShortUrl);
router.get('/:urlCode', urlRedirect);

router.put('/clearCache', flushw);


module.exports = router;