import {
  getAllTrends,
  getTrendByGeneratedID,
  getTrendsPaginated,
  getTrendsCount,
  getTrendDropdownList,
  getTrendById,
  createTrend,
  updateTrend,
  deleteTrend,
  likeTrendByGeneratedID,
  getUserLikeStatusByTrendGeneratedID,
  getLikesByTrendGeneratedID,
  updateTrendStage
} from '../models/trend.model.js';

// Get all trends
export const getAllTrendsHandler = async (req, res) => {
  try {
    const trends = await getAllTrends();
    if (!trends || trends.length === 0) { 
      return res.status(404).json({
        success: false,
        message: 'No trends found'
      })}
    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get trends count
export const getTrendsCountHandler = async (req, res) => {
  try {
    const count = await getTrendsCount();
    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: 'No trends found'
      });
    }
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get trend by ID
export const getTrendByIdHandler = async (req, res) => {
  try {
    const trend = await getTrendById(req.params.id);
    
    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get trend by label
export const getTrendByGeneratedIDHandler = async (req, res) => {
  try {
    const trend = await getTrendByGeneratedID(req.params.generatedId);
    
    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Like trend by GeneratedID
export const likeTrendByGeneratedIDHandler = async (req, res) => {
  try {
    // Get user ID from JWT token payload
    const userId = req.user.sub;
    const { generatedId } = req.params;
    const result = await likeTrendByGeneratedID(userId, generatedId);

    if (result === null || result === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }
    
    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error liking trend:', error); 
    res.status(500).json({
      success: false,
      message: 'Server Error',  
      error: error.message
    });
  }
};

// Get likes by trend GeneratedID
export const getLikesByTrendGeneratedIDHandler = async (req, res) => {
  try {  
    const { generatedId } = req.params;
    const result = await getLikesByTrendGeneratedID(generatedId);
    
    if (result === null || result === undefined) {
      return res.status(404).json({
        success: false,
        message: 'No likes found for this trend'
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get user like status by trend GeneratedID
export const getUserLikeStatusByTrendGeneratedIDHandler = async (req, res) => {
  try {
    // Get user ID from JWT token payload
    const userId = parseInt(req.user.sub);
    const { generatedId } = req.params;

    // Check like status in TrendLikes table
    const result = await getUserLikeStatusByTrendGeneratedID(userId, generatedId);

    const hasLiked = result.recordset.length > 0;

    res.status(200).json({
      success: true,
      data: {
        userId,
        trendGeneratedID: generatedId,
        likeStatus: hasLiked ? 'liked' : 'not liked'
      }
    });

  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get paginated trends with optional search
export const getTrendsPaginatedHandler = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await getTrendsPaginated(page, limit, search);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get trend count
export const getTrendCountHandler = async (req, res) => {
  try {
    const count = await getTrendCount();
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get trends dropdown list
export const getTrendDropdownListHandler = async (req, res) => {
  try {
    const trends = await getTrendDropdownList();
    
    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Create new trend
export const createTrendHandler = async (req, res) => {
  try {
    const trend = await createTrend(req.body);
    
    res.status(201).json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update trend
export const updateTrendHandler = async (req, res) => {
  try {
    const trend = await updateTrend(req.params.generatedId, req.body);    
    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete trend
export const deleteTrendHandler = async (req, res) => {
  try {
    const result = await deleteTrend(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trend deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get trends by quadrant
export const getTrendsByQuadrantHandler = async (req, res) => {
  try {
    const trends = await getTrendsByQuadrant(req.params.quadrantId);
    
    if (!trends || trends.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No trends found in this quadrant'
      });
    }

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get trends by ring
export const getTrendsByRingHandler = async (req, res) => {
  try {
    const trends = await getTrendsByRing(req.params.ringId);
    
    if (!trends || trends.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No trends found in this ring'
      });
    }

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update trend stage
export const updateTrendStageHandler = async (req, res) => {
  try {
    const { stage } = req.body;
    const { generatedId } = req.params;

    if (!stage) {
      return res.status(400).json({
        success: false,
        message: 'Stage is required'
      });
    }

    const trend = await updateTrendStage(generatedId, stage);
    
    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Trend not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
