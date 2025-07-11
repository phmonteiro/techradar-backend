import express from 'express';
import { getTechnologyRadarConfig, getTrendRadarConfig } from '../controllers/radarconfig.controller.js';

const router = express.Router();

router.get('/technology-radar-config', getTechnologyRadarConfig);
router.get('/trend-radar-config', getTrendRadarConfig);

export default router;
