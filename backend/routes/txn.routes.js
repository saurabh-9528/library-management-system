const express = require('express');
const router = Router = express.Router();
const txnController = require('../controllers/txn.controller');
const validate = require('../middleware/validate.middleware');
const { txnSchemas } = require('../utils/validators');

router.post('/borrow', validate(txnSchemas.borrow), txnController.borrowBook);
router.post('/return', validate(txnSchemas.returnBook), txnController.returnBook);
router.get('/history', txnController.getTransactionHistory);

module.exports = router;
