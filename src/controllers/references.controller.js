import {
  getReferencesByTechnology,
  getReferencesByTrend,
  getReferencesCount
} from '../models/reference.model.js';

export const getReferencesByTrendHandler = async (req, res) => {
  try {
    const { generatedId } = req.params;
    const references = await getReferencesByTrend(generatedId);
    
    // Return success even with empty array - this is not an error condition
    res.status(200).json({
      success: true,
      count: references ? references.length : 0,
      data: references || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

export const getReferencesByTechnologyHandler = async (req, res) => {
  try {
    const { generatedId } = req.params;
    const references = await getReferencesByTechnology(generatedId);
    
    // Return success even with empty array - this is not an error condition
    res.status(200).json({
      success: true,
      count: references ? references.length : 0,
      data: references || []
    });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

export const getReferencesCountHandler = async (req, res) => {
  try {
    const count = await getReferencesCount();
    
    // Return success even with count 0 - this is valid data
    res.status(200).json({
      success: true,
      message: "Count fetched successfully",
      count: count || 0
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    })
  }
}