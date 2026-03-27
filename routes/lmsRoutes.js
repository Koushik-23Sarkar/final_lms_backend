const express = require('express');
const router = express.Router();
const lmsController = require('../controllers/lmsController');
const tenantMiddleware = require('../middleware/tenant');

router.get('/info', tenantMiddleware, lmsController.getTenantInfo);

router.post('/login', tenantMiddleware, lmsController.login);

router.post('/students', tenantMiddleware, lmsController.createStudent);
router.get('/students', tenantMiddleware, lmsController.getStudents);
router.delete('/students/:id', tenantMiddleware, lmsController.deleteStudent);

module.exports = router;
