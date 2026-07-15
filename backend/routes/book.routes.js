const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const validate = require('../middleware/validate.middleware');
const { bookSchemas } = require('../utils/validators');

router.route('/')
  .post(validate(bookSchemas.create), bookController.addBook)
  .get(bookController.getAllBooks);

router.route('/:id')
  .get(bookController.getBookById)
  .put(validate(bookSchemas.update), bookController.updateBook)
  .delete(bookController.deleteBook);

module.exports = router;
