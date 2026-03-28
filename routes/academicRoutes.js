const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const tenantMiddleware = require('../middleware/tenant');

router.post('/programs', tenantMiddleware, academicController.createProgram);
router.post('/batches', tenantMiddleware, academicController.createBatch);
router.post('/subjects', tenantMiddleware, academicController.createSubject);

router.get('/hierarchy', tenantMiddleware, academicController.getHierarchy);

router.get('/teacher/dashboard', tenantMiddleware, academicController.getTeacherDashboard);
router.get('/student/dashboard', tenantMiddleware, academicController.getStudentDashboard);


router.put('/batches/:id/roster', tenantMiddleware, academicController.updateBatchRoster);
router.put('/subjects/:id/roster', tenantMiddleware, academicController.updateSubjectRoster);

router.delete('/programs/:id', tenantMiddleware, academicController.deleteProgram);
router.delete('/batches/:id', tenantMiddleware, academicController.deleteBatch);
router.delete('/subjects/:id', tenantMiddleware, academicController.deleteSubject);

module.exports = router;
