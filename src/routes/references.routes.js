import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { deleteReferenceAdmin } from '../controllers/admin.controller.js';
import {  getReferencesByTechnologyHandler,
          getReferencesCountHandler,
          getReferencesByTrendHandler
        } from '../controllers/references.controller.js';

// Create a router object
const router = express.Router();

// GET references count
router.get('/count', getReferencesCountHandler);

// GET all references for a specific technology
router.get('/technology/:generatedId', getReferencesByTechnologyHandler);

// GET all references for a specific trend
router.get('/trend/:generatedId', getReferencesByTrendHandler);

// GET a specific reference
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // This is a placeholder for actual controller logic
    res.status(200).json({ message: 'Reference retrieved successfully', id });
  } catch (error) {
    next(error);
  }
});

// PUT a new reference with label
router.put('/label/:label', verifyToken, async (req, res, next) => {
  try {
    const referenceData = req.body;
    console.log("Creating reference with label:", referenceData);
    // TODO: Implement actual controller logic with createReference
    // const createdReference = await createReference(referenceData);

    res.status(201).json({ message: 'Reference created successfully' });
  } catch (error) {
    next(error);
  }
});

// POST a new reference
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const referenceData = req.body;
    console.log("Creating reference:", referenceData);
    // TODO: Implement actual controller logic with createReference
    // const createdReference = await createReference(referenceData);

    res.status(201).json({ message: 'Reference created successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT update a reference
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const referenceData = req.body;
    // This is a placeholder for actual controller logic
    res.status(200).json({ message: 'Reference updated successfully', id, data: referenceData });
  } catch (error) {
    next(error);
  }
});

// DELETE a reference
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement actual controller logic
    const response = await deleteReferenceAdmin(id);
    if (!response) {
      return res.status(404).json({ message: 'Reference not found' });
    }
    res.status(200).json({ message: 'Reference deleted successfully', id });
  } catch (error) {
    next(error);
  }
});

export { router as referencesRoutes };
