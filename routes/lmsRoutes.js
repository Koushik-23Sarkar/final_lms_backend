const express = require('express');
const router = express.Router();
const lmsController = require('../controllers/lmsController');
const tenantMiddleware = require('../middleware/tenant');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/info', tenantMiddleware, lmsController.getTenantInfo);

router.post('/login', tenantMiddleware, lmsController.login);

router.post('/students/bulk', tenantMiddleware, upload.single('csvFile'), lmsController.bulkCreateStudents);
router.post('/students', tenantMiddleware, lmsController.createStudent);
router.get('/students', tenantMiddleware, lmsController.getStudents);
router.delete('/students/:id', tenantMiddleware, lmsController.deleteStudent);

router.get('/teachers', tenantMiddleware, lmsController.getTeachers);
router.post('/teachers', tenantMiddleware, lmsController.createTeacher);
router.delete('/teachers/:id', tenantMiddleware, lmsController.deleteTeacher);

module.exports = router;
