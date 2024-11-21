import mongoose, { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createTweet = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    throw new ApiError(400, 'Invalid tweet');
  }
  const newTweet = await Tweet.create({
    content,
    userId: req.user.id, // Assuming authentication middleware adds `req.user`
  });

  return res
    .status(201)
    .json(new ApiResponse(200, newTweet, 'Tweet created successfully'));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const tweets = await Tweet.find({
    userId: userId,
  });

  return res.status(200).json(new ApiResponse(200, tweets, 'User tweets'));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet ID');
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, 'Tweet not found');
  }

  if (tweet.userId.toString() !== req.user.id) {
    throw new ApiError(403, 'Unauthorized');
  }

  const { text } = req.body;
  if (!text) {
    throw new ApiError(400, 'Invalid tweet');
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content },
    { new: true }
  );

  tweet.content = text;
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, 'Tweet updated successfully'));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) throw new ApiError(400, 'Invalid tweet ID');

  if (tweet.owner !== req.user._id) {
    throw new ApiError(403, 'You are not allowed to delete this tweet');
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) throw new ApiError(404, 'Tweet not found');

  return res
    .status(200)
    .json(new ApiResponse(200, true, 'Tweet deleted successfully'));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
