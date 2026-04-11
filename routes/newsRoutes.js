const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const requireRole = require('../middleware/requireRole');
const tenantMiddleware = require('../middleware/tenant');

router.use(tenantMiddleware);

router.post('/news', requireRole('SCHOOL_ADMIN'), newsController.createPost);
router.get('/news', requireRole('SCHOOL_ADMIN'), newsController.getAllPosts);

router.put('/news/:id', requireRole('SCHOOL_ADMIN'), newsController.updatePost);
router.patch('/news/:id/publish', requireRole('SCHOOL_ADMIN'), newsController.publishPost);
router.patch('/news/:id/pin', requireRole('SCHOOL_ADMIN'), newsController.togglePin);
router.delete('/news/:id', requireRole('SCHOOL_ADMIN'), newsController.deletePost);

router.get('/news/feed', newsController.getFeed);
router.get('/news/:id', newsController.getPostById);

module.exports = router;