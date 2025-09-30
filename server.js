import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { connectToDatabase } from './src/config/database.js';
import { authRoutes } from './src/routes/auth.routes.js';
import { adminRoutes } from './src/routes/admin.routes.js'; 
import { usersRoutes } from './src/routes/users.routes.js';
import { technologiesRoutes } from './src/routes/technologies.routes.js';
import { trendsRoutes } from './src/routes/trends.routes.js';
import { commentsRoutes } from './src/routes/comments.routes.js';
import { referencesRoutes } from './src/routes/references.routes.js';
import { likesRoutes } from './src/routes/likes.routes.js';
import { errorHandler } from './src/middleware/error.middleware.js';
import { getTechnologyRadarConfig } from './src/controllers/radarConfig.controller.js';
import { getTrendRadarConfig } from './src/controllers/radarConfig.controller.js';
import { sendEmail } from './src/services/email.service.js';
import { verifyToken } from './src/middleware/auth.middleware.js';
import { sendAdminNotification } from './src/services/email.service.js';

// Load environment variables
// In development, load from .env.development file
// In production (Azure), environment variables are set via the Azure portal
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' });
} else {
  // In production, Azure will provide environment variables directly
  // dotenv.config() will only load from .env if it exists, but is not required
  dotenv.config();
}

// Initialize express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Connect to database before setting up routes
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Routes
    app.get("/", (req, res) => {
      res.send("Hello, Azure!");
    });
    
    app.get("/api/technology-radar-config", getTechnologyRadarConfig);
    app.get("/api/trend-radar-config", getTrendRadarConfig);
    app.post("/api/contact-admin", verifyToken, async (req, res) => {
      try {
        const { subject, text } = req.body;

        if ( !subject || !text) {
          return res.status(400).json({
            success: false,
            message: 'Subject, and text are required'
          });
        }

        // Validate that ADMIN_EMAIL is configured
        if (!process.env.ADMIN_EMAIL) {
          console.error('ADMIN_EMAIL environment variable is not set');
          return res.status(500).json({
            success: false,
            message: 'Admin email configuration is missing'
          });
        }
        
        const result = await sendAdminNotification({
          subject,
          message: text
        });
        
        res.status(200).json({
          success: true,
          message: 'Email sent successfully',
          data: result
        });
      } catch (error) {
        console.error('Error in contact-admin endpoint:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to send email'
        });
      }
    });
    
    // Authentication routes
    app.use('/api/auth', authRoutes);
    
    // Public API routes
    app.use('/api/technologies', technologiesRoutes);
    app.use('/api/comments', commentsRoutes);
    app.use('/api/references', referencesRoutes);
    app.use('/api/users', usersRoutes); 
    app.use('/api/trends', trendsRoutes);
    app.use('/api/likes', likesRoutes);
    
    // Admin routes (all protected with middleware)
    app.use('/api/admin', adminRoutes);
    
    // Error handling middleware (should be last)
    app.use(errorHandler);
    
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;