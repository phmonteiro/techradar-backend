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
    const comments = await getCommentsByType(type, label);
    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get comments by type' });
  }
}

export const getCommentsByTechnologyHandler = async (req, res) => {
  try {
    const { label } = req.params;
    const comments = await getCommentsByTechnology(label);
    if (!comments || comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No comments found for this technology'
      });
    }

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
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
    const comments = await getCommentsByTrend(label);
    if (!comments || comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No comments found for this trend'
      });
    }
    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
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
      technologyLabel: req.body.technologyLabel,
      author: req.user?.displayName || 'Anonymous'  // Fallback if displayName is undefined
    };

    if (!commentData || !commentData.text || !commentData.technologyLabel) {
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