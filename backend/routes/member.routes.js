const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const validate = require('../middleware/validate.middleware');
const { memberSchemas } = require('../utils/validators');

router.route('/')
  .post(validate(memberSchemas.create), memberController.addMember)
  .get(memberController.getAllMembers);

router.route('/:id')
  .get(memberController.getMemberById)
  .put(validate(memberSchemas.update), memberController.updateMember)
  .delete(memberController.deleteMember);

module.exports = router;
