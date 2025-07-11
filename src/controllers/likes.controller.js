import { 
  getLikesByReference,
  getUserLikeStatus,
  addLike,
  removeLike
} from '../models/like.model.js';

// Helper function to validate and convert referenceId
const validateAndConvertReferenceId = (referenceId) => {
  if (referenceId === null || referenceId === undefined) {
    throw new Error('Missing required field: referenceId is required');
  }
  
  const numId = Number(referenceId);
  if (isNaN(numId) || numId <= 0) {
    throw new Error('Invalid referenceId: must be a positive number');
  }
  
  return numId;
};

// Get like count for a reference
export const getLikeCount = async (req, res) => {
  try {
    const { referenceId, referenceType } = req.body;

    // Input validation
    if (!referenceType) {
      return res.status(400).json({ 
        message: 'Missing required field: referenceType is required' 
      });
    }

    if (typeof referenceType !== 'string' || !referenceType.trim()) {
      return res.status(400).json({ 
        message: 'Invalid referenceType: must be a non-empty string' 
      });
    }

    const validatedReferenceId = validateAndConvertReferenceId(referenceId);
    const count = await getLikesByReference(validatedReferenceId, referenceType);
    res.json({ count });
  } catch (error) {
    console.error('Error getting like count:', error);
    if (error.message.includes('Missing required field') || error.message.includes('Invalid referenceId')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error getting like count' });
  }
};

// Get user's like status for a reference
export const getLikeStatus = async (req, res) => {
  try {
    const { referenceId, referenceType } = req.body;
    const userId = req.user.sub;
    // Input validation
    if (!referenceType) {
      return res.status(400).json({ 
        message: 'Missing required field: referenceType is required' 
      });
    }

    if (typeof referenceType !== 'string' || !referenceType.trim()) {
      return res.status(400).json({ 
        message: 'Invalid referenceType: must be a non-empty string' 
      });
    }

    const validatedReferenceId = validateAndConvertReferenceId(referenceId);
    const isLiked = await getUserLikeStatus(userId, validatedReferenceId, referenceType);
    res.json({ isLiked });
  } catch (error) {
    console.error('Error getting like status:', error);
    if (error.message.includes('Missing required field') || error.message.includes('Invalid referenceId')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error getting like status' });
  }
};

// Add a like
export const addLikeToReference = async (req, res) => {
  try {
    const { referenceId, referenceType } = req.body;
    const userId = req.user.sub;

    // Input validation
    if (!referenceType) {
      return res.status(400).json({ 
        message: 'Missing required field: referenceType is required' 
      });
    }

    if (typeof referenceType !== 'string' || !referenceType.trim()) {
      return res.status(400).json({ 
        message: 'Invalid referenceType: must be a non-empty string' 
      });
    }

    const validatedReferenceId = validateAndConvertReferenceId(referenceId);

    // Check if user already liked
    const alreadyLiked = await getUserLikeStatus(userId, validatedReferenceId, referenceType);
    if (alreadyLiked) {
      return res.status(400).json({ message: 'User has already liked this reference' });
    }

    const success = await addLike(userId, validatedReferenceId, referenceType);
    if (success) {
      res.json({ message: 'Like added successfully' });
    } else {
      res.status(400).json({ message: 'Failed to add like' });
    }
  } catch (error) {
    console.error('Error adding like:', error);
    if (error.message.includes('Missing required field') || error.message.includes('Invalid referenceId')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error adding like' });
  }
};

// Remove a like
export const removeLikeFromReference = async (req, res) => {
  try {
    const { referenceId, referenceType } = req.body;
    const userId = req.user.sub;

    // Input validation
    if (!referenceType) {
      return res.status(400).json({ 
        message: 'Missing required field: referenceType is required' 
      });
    }

    if (typeof referenceType !== 'string' || !referenceType.trim()) {
      return res.status(400).json({ 
        message: 'Invalid referenceType: must be a non-empty string' 
      });
    }

    const validatedReferenceId = validateAndConvertReferenceId(referenceId);

    // Check if user has liked
    const hasLiked = await getUserLikeStatus(userId, validatedReferenceId, referenceType);
    if (!hasLiked) {
      return res.status(400).json({ message: 'User has not liked this reference' });
    }

    const success = await removeLike(userId, validatedReferenceId, referenceType);
    if (success) {
      res.json({ message: 'Like removed successfully' });
    } else {
      res.status(400).json({ message: 'Failed to remove like' });
    }
  } catch (error) {
    console.error('Error removing like:', error);
    if (error.message.includes('Missing required field') || error.message.includes('Invalid referenceId')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error removing like' });
  }
}; 