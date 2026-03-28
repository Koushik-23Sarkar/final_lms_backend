const express = require('express');
const router = express.Router();
const lmsController = require('../controllers/lmsController');
const tenantMiddleware = require('../middleware/tenant');
const requireRole = require('../middleware/requireRole');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/info', tenantMiddleware, lmsController.getTenantInfo);
router.post('/login', tenantMiddleware, lmsController.login);

router.get('/students',
    tenantMiddleware,
    lmsController.getStudents
);
router.post('/students/bulk',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    upload.single('csvFile'),
    lmsController.bulkCreateStudents
);
router.post('/students',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.createStudent
);
router.put('/students/:id',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.updateStudent
);
router.delete('/students/:id',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.deleteStudent
);

router.get('/teachers',
    tenantMiddleware,
    lmsController.getTeachers
);
router.post('/teachers',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.createTeacher
);
router.put('/teachers/:id',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.updateTeacher
);
router.delete('/teachers/:id',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.deleteTeacher
);

router.get('/parents',
    tenantMiddleware,
    lmsController.getParents
);
router.post('/parents',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.createParent
);
router.put('/parents/:id',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.updateParent
);
router.delete('/parents/:id',
    tenantMiddleware, requireRole('SCHOOL_ADMIN'),
    lmsController.deleteParent
);

module.exports = router;

