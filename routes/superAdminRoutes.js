const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const superAdminAuth = require('../middleware/superAdminAuth');

router.post('/login', superAdminController.login);

router.use(superAdminAuth);
router.get('/tenants', superAdminController.getAllTenants);
router.put('/tenants/:id/approve', superAdminController.approveTenant);

module.exports = router;
