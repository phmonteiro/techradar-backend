import {
  getAllTechnologies,
  getTechnologyByGeneratedID,
  getTechnologiesPaginated,
  getTechnologiesCount,
  getTechnologyDropdownList,
  getTechnologyById,
  createTechnology,
  updateTechnology,
  deleteTechnology,
  likeTechnologyByGeneratedID,
  getUserLikeStatusByTechnologyGeneratedID,
  getLikesByTechnologyGeneratedID,
  updateTechnologyStage
} from '../models/technology.model.js';

// Get all technologies
export const getAllTechnologiesHandler = async (req, res) => {
  try {
    const technologies = await getAllTechnologies();
    res.status(200).json({
      success: true,
      count: technologies ? technologies.length : 0,
      data: technologies || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get technologies count
export const getTechnologiesCountHandler = async (req, res) => {
  try {
    const count = await getTechnologiesCount();
    if (count === 0) {
      return res.status(404).json({
        success: false,
        message: 'No technologies found'
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

// Get technology by ID
export const getTechnologyByIdHandler = async (req, res) => {
  try {
    const technology = await getTechnologyById(req.params.id);
    
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }

    res.status(200).json({
      success: true,
      data: technology
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get technology by label
export const getTechnologyByGeneratedIDHandler = async (req, res) => {
  try {
    const technology = await getTechnologyByGeneratedID(req.params.generatedId);
    
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }

    res.status(200).json({
      success: true,
      data: technology
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Like technology by label
export const likeTechnologyByGeneratedIDHandler = async (req, res) => {
  try {
    // Get user ID from JWT token payload
    const userId = req.user.sub;
    const { generatedId } = req.params;
    const result = await likeTechnologyByGeneratedID(userId, generatedId);

    if (result === null || result === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error liking technology:', error); 
    res.status(500).json({
      success: false,
      message: 'Server Error',  
      error: error.message
    });
  }
};

// Get likes by technology label
export const getLikesByTechnologyGeneratedIDHandler = async (req, res) => {
  try {  
    const { generatedId } = req.params;
    const result = await getLikesByTechnologyGeneratedID(generatedId);
    
    if (result === null || result === undefined) {
      return res.status(404).json({
        success: false,
        message: 'No likes found for this technology'
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

// Get user like status by technology label
export const getUserLikeStatusByTechnologyGeneratedIDHandler = async (req, res) => {
  try {
    // Get user ID from JWT token payload
    const userId = parseInt(req.user.sub);
    const { generatedId } = req.params;

    // Check like status in TechnologyLikes table
    const result = await getUserLikeStatusByTechnologyGeneratedID(userId, generatedId);

    const hasLiked = result.recordset.length > 0;

    res.status(200).json({
      success: true,
      data: {
        userId,
        technologyGeneratedID: generatedId,
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

// Get paginated technologies with optional search
export const getTechnologiesPaginatedHandler = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await getTechnologiesPaginated(page, limit, search);
    
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

// Get technology count
export const getTechnologyCountHandler = async (req, res) => {
  try {
    const count = await getTechnologyCount();
    
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

// Get technologies dropdown list
export const getTechnologyDropdownListHandler = async (req, res) => {
  try {
    const technologies = await getTechnologyDropdownList();
    
    res.status(200).json({
      success: true,
      data: technologies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Create technology
export const createTechnologyHandler = async (req, res) => {
  try {
    const technology = await createTechnology(req.body);
    
    res.status(201).json({
      success: true,
      data: technology
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update technology
export const updateTechnologyHandler = async (req, res) => {
  try {
    const technology = await updateTechnology(req.params.id, req.body);
    
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: technology
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Delete technology
export const deleteTechnologyHandler = async (req, res) => {
  try {
    const technology = await deleteTechnology(req.params.generatedId);
    
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get technologies by quadrant
export const getTechnologiesByQuadrantHandler = async (req, res) => {
  try {
    // Assuming Technology model doesn't have this method yet, 
    // this would need to be implemented in the model
    res.status(501).json({
      success: false,
      message: 'Not implemented'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get technologies by ring
export const getTechnologiesByRingHandler = async (req, res) => {
  try {
    // Assuming Technology model doesn't have this method yet,
    // this would need to be implemented in the model
    res.status(501).json({
      success: false,
      message: 'Not implemented'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update technology stage
export const updateTechnologyStageHandler = async (req, res) => {
  try {
    const { generatedId } = req.params;
    const { stage } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - Admin access required'
      });
    }
    
    // Validate stage
    const validStages = ['In Place', 'Proofing', 'Planned', 'Possible'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage value'
      });
    }
    
    const technology = await updateTechnologyStage(generatedId, stage);
    
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: technology
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
