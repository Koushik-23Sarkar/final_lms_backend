const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const requireRole = require('../middleware/requireRole');
const tenantMiddleware = require('../middleware/tenant');

router.post('/news',
    tenantMiddleware,
    // requireRole('SCHOOL_ADMIN'),
    newsController.createPost
);
router.get('/news',
    tenantMiddleware,
    // requireRole('SCHOOL_ADMIN'),
    newsController.getAllPosts
);
router.get('/news/feed',
    tenantMiddleware,
    newsController.getFeed
);
router.get('/news/:id',
    tenantMiddleware,
    // requireRole('SCHOOL_ADMIN'),
    newsController.getPostById
);
router.put('/news/:id',
    tenantMiddleware,
    // requireRole('SCHOOL_ADMIN'),
    newsController.updatePost
);
router.patch('/news/:id/publish',
    tenantMiddleware,
    // requireRole('SCHOOL_ADMIN'),
    newsController.publishPost
);
router.patch('/news/:id/pin',
    tenantMiddleware,
    // requireRole('SCHOOL_ADMIN'),
    newsController.togglePin
);
router.delete('/news/:id',
    tenantMiddleware,
    // requireRole('SCHOOL_ADMIN'),
    newsController.deletePost
);

module.exports = router;