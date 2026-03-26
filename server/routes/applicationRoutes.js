const express = require('express');
const { body, param } = require('express-validator');
const ApplicationController = require('../controllers/applicationController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const upload = require('../config/multer');

const router = express.Router();

router.use(authenticateToken);
router.use(apiLimiter);

router.get('/', ApplicationController.getAll);

router.get('/:id', 
  param('id').isInt().withMessage('Invalid application ID'),
  ApplicationController.getById
);

router.post('/',
  upload.single('cv_file'),
  [
    body('company_name').notEmpty().withMessage('Company name is required'),
    body('job_title').notEmpty().withMessage('Job title is required'),
    body('application_date').isISO8601().withMessage('Valid application date is required'),
    body('status').optional().isIn(['Applied', 'Interview', 'Rejected', 'Offer'])
  ],
  ApplicationController.create
);

router.put('/:id',
  upload.single('cv_file'),
  [
    param('id').isInt().withMessage('Invalid application ID'),
    body('company_name').notEmpty().withMessage('Company name is required'),
    body('job_title').notEmpty().withMessage('Job title is required'),
    body('application_date').isISO8601().withMessage('Valid application date is required'),
    body('status').optional().isIn(['Applied', 'Interview', 'Rejected', 'Offer'])
  ],
  ApplicationController.update
);

router.delete('/:id',
  param('id').isInt().withMessage('Invalid application ID'),
  ApplicationController.delete
);

router.get('/:id/download',
  param('id').isInt().withMessage('Invalid application ID'),
  ApplicationController.downloadCV
);

module.exports = router;