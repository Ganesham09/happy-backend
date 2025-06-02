import mongoose from 'mongoose';
import { Comment } from '../models/comment.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/video.model.js'; // Assuming you have a Video model

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 }, // Sort by newest first
  };

  const commentsAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDetails',
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'comment',
        as: 'likes',
      },
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ['$ownerDetails', 0] },
        likesCount: { $size: '$likes' },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, '$likes.likedBy'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  const comments = await Comment.aggregatePaginate(commentsAggregate, options);

  if (!comments || comments.docs.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], 'No comments found for this video'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, 'Comments retrieved successfully'));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Comment content cannot be empty');
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, 'Failed to add comment, please try again');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, 'Comment added successfully'));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Comment content cannot be empty');
  }

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment ID');
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this comment');
  }

  comment.content = content;
  const updatedComment = await comment.save();

  if (!updatedComment) {
    throw new ApiError(500, 'Failed to update comment, please try again');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, 'Comment updated successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment ID');
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this comment');
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, 'Failed to delete comment, please try again');
  }
  // Also delete likes associated with this comment
  // await Like.deleteMany({ comment: commentId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { deletedComment }, 'Comment deleted successfully')
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
// In the comment.controller.js file, we have defined four functions: getVideoComments, addComment, updateComment, and deleteComment. These functions will be responsible for handling the CRUD operations for comments on videos. We will implement the logic for these functions in the upcoming sections.
