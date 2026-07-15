const express = require('express');
const router = express.Router();
const resController = require('../controllers/res.controller');
const validate = require('../middleware/validate.middleware');
const { resSchemas } = require('../utils/validators');

router.post('/reserve', validate(resSchemas.reserve), resController.reserveBook);
router.post('/cancel', validate(resSchemas.cancel), resController.cancelReservation);
router.get('/', resController.getReservations);

module.exports = router;
