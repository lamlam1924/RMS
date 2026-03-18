import express from 'express';
import * as resumeService from '../services/resumeService.js';

const router = express.Router();

/**
 * POST /api/resume - Create a new resume
 * Body: { candidateId: number, data: object }
 */
router.post('/', async (req, res) => {
  try {
    const { candidateId, data } = req.body;
    if (!candidateId || data === undefined) {
      return res.status(400).json({ error: 'candidateId and data are required' });
    }
    const result = await resumeService.createResume(parseInt(candidateId, 10), data);
    res.status(201).json(result);
  } catch (err) {
    console.error('Create resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to create resume' });
  }
});

/**
 * GET /api/resume/:id - Get resume by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resume ID' });
    }
    const resume = await resumeService.getResumeById(id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(resume);
  } catch (err) {
    console.error('Get resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to get resume' });
  }
});

/**
 * PUT /api/resume/:id - Update resume by ID
 * Body: { data: object }
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { data } = req.body;
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resume ID' });
    }
    if (data === undefined) {
      return res.status(400).json({ error: 'data is required' });
    }
    const updated = await resumeService.updateResume(id, data);
    if (!updated) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to update resume' });
  }
});

/**
 * DELETE /api/resume/:id - Delete resume by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resume ID' });
    }
    const deleted = await resumeService.deleteResume(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete resume' });
  }
});

export default router;
