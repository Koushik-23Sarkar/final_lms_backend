const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const tenantMiddleware = require('../middleware/tenant');

router.use(tenantMiddleware);

router.get('/', studentController.getAllStudents);

router.post('/', studentController.createStudent);
router.get('/:id', studentController.getStudentById);

module.exports = router;
