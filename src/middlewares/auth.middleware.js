import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Autorization')?.replace('Bearer', '');

    if (!token) {
      throw new ApiError(401, 'Unauthorized request');
    }

    const decodedToken = jwt.verify(token, Process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findByID(decodedToken?._id).select(
      '-password -refreshToken'
    );

    if (!user) {
      // TODO: discuss about frontend
      throw new ApiError(401, 'Invalid access Token');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
});