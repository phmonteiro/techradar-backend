import {
  getReferencesByTechnology,
  getReferencesByTrend,
  getReferencesCount
} from '../models/reference.model.js';

export const getReferencesByTrendHandler = async (req, res) => {
  try {
    const { label } = req.params;
    const references = await getReferencesByTrend(label);
    if (!references || references.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No references found for this trend'
      });
    }

    res.status(200).json({
      success: true,
      count: references.length,
      data: references
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

    const { label } = req.params;
    const references = await getReferencesByTechnology(label);
    if (!references || references.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No references found for this technology'
      });
    }
    res.status(200).json({
      success: true,
      count: references.length,
      data: references
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
    if (count === 0) {
      return res.status(404).json({
        sucess: false,
        message: 'No messages found'
      })
    }
    
    res.status(220).json({
      sucess: true,
      message: "Count fetched successfully",
      data: count
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    })
  }
}