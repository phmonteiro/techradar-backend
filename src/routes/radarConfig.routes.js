import express from 'express';
import { getTechnologyRadarConfig, getTrendRadarConfig } from '../controllers/radarConfig.controller.js';

const router = express.Router();

router.get('/technology-radar-config', getTechnologyRadarConfig);
router.get('/trend-radar-config', getTrendRadarConfig);

export default router;
