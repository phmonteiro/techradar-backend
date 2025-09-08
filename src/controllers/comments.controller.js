import {
  getCommentsByTechnology,
  getCommentsCount,
  createComment,
  getCommentsByTrend,
  getCommentsByType
} from '../models/comment.model.js';

export const getCommentsByTypeHandler = async (req, res) => {
  try {
    const { type, label } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await getCommentsByType(type, label, page, limit);
    
    res.status(200).json({
      success: true,
      data: result.comments,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('Error in getCommentsByTypeHandler:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get comments by type' 
    });
  }
}

export const getCommentsByTechnologyHandler = async (req, res) => {
  try {
    const { label } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await getCommentsByTechnology(label, page, limit);
    
    if (!result || result.comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No comments found for this technology'
      });
    }

    res.status(200).json({
      success: true,
      ...result
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

export const getCommentsByTrendHandler = async (req, res) => {
  try {
    const { label } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const result = await getCommentsByTrend(label, page, limit);
    
    if (!result || result.comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No comments found for this trend'
      });
    }
    res.status(200).json({
      success: true,
      ...result
    });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error getCommentsByTrendHandler',
      error: error.message
    });
  }
}

export const getCommentsCountHandler = async (req, res) => {
  try {
    const count = await getCommentsCount();
    if ( count === 0 ) {
      return res.status(404).json({
        sucess: false,
        message: 'No messages found'
      })
    }

    res.status(200).json({
      success: true,
      message: "Comments count fetched successfully",
      data: count
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comments count',
      error: err.message
    })
  }
}

export const createCommentHandler = async (req, res) => {
  try {
    const commentData = {
      text: req.body.text,
      type: req.body.type,
      label: req.body.label,
      author: req.user?.displayName || 'Anonymous'  // Fallback if displayName is undefined
    };

    console.log("commentData");
    console.log(commentData);

    if (!commentData || !commentData.text || !commentData.type || !commentData.label) {
      res.status(400).json({
        success: false,
        message: 'Invalid comment data'
      });
      return;
    }
    const createdComment = await createComment(commentData);

    if (!createdComment) {
      res.status(400).json({
        success: false,
        message: 'Failed to create comment'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: createdComment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}