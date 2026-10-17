const express = require('express');
const rateLimit = require('express-rate-limit');
const samples = require('../controllers/sampleController');
const { protect, teacherOnly } = require('../middleware/auth');

// Mounted at /api/settings/samples (public) and /api/teacher/samples (teacher)
const publicRouter = express.Router();
const leadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false, message: { status: 'error', message: 'Too many attempts. Please try again later.' } });
const eventLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
publicRouter.get('/', samples.publicList);
publicRouter.post('/lead', leadLimiter, samples.submitLead);
publicRouter.post('/event', eventLimiter, samples.trackEvent);

const teacherRouter = express.Router();
teacherRouter.use(protect, teacherOnly);
teacherRouter.get('/', samples.teacherList);
teacherRouter.post('/', samples.create);
teacherRouter.put('/test', samples.setTest);
teacherRouter.get('/leads', samples.leads);
teacherRouter.patch('/leads/:id', samples.updateLead);
teacherRouter.delete('/leads/:id', samples.removeLead);
teacherRouter.put('/:id', samples.update);
teacherRouter.delete('/:id', samples.remove);

module.exports = { publicRouter, teacherRouter };
