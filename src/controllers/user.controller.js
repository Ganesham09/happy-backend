import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
  // Steps for register usere are =>
  // get user details from frontend
  // validation - not empty
  // check if user already exits : username, email
  // check for images, check for avatar
  // uplode them for cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  // console.log('email:', email);
  // if(fullName === ""){
  //   throw new ApiError(400, "fullname is required")
  // }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'all feilds are required');
  }
  if (!email.includes('@')) {
    throw new ApiError(409, 'email seems to be not correct');
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      'OOps!! user already existed with same user name and email'
    );
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLoaclPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'avatar file is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLoaclPath);

  if (!avatar) {
    throw new ApiError(400, 'avatar is required');
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );
  // .select means withowt password and refreshtoken DB send user creation details

  if (!createdUser) {
    throw new ApiError(500, 'Something went worng while registring the user');
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, 'User Register Sucsessfully'));
});

export { registerUser };
