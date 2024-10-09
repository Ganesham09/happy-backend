import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

/* GENERATING ACCESS AND REFRESH TOKEN*/
const generateAccessAndRefreshToken = async (userId) => {
  try {
    console.log('Fetching user by ID:', userId);
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    console.log('User found, generating tokens...');
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    if (!accessToken || !refreshToken) {
      console.error('Access token or refresh token is undefined');
      throw new ApiError(500, 'Token generation failed');
    }

    console.log('Tokens generated:', { accessToken, refreshToken });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error in token generation:', error);
    throw new ApiError(
      500,
      ' Somthing went wrong while generating refresh and access token'
    );
  }
};

/* REGISTER USER*/

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
  console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLoaclPath = req.files?.coverImage[0]?.path;

  let coverImageLoaclPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

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

/* lOGIN USER*/

const loginUser = asyncHandler(async (req, res) => {
  // req.body
  //username and email
  // find user
  //password check
  //access and refersh token
  //send cookies

  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, 'username or password is required');
  }
  console.log('Finding user...');
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, 'user not found');
  }
  console.log('User found, checking password...');
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'passowrd is not correct');
  }

  console.log('Password is valid, generating tokens...');
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  console.log('Tokens generated, sending response...');
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User Logged in Successfully'
      )
    );
});

/* LOGOUT USER*/

const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json(new ApiResponse(401, {}, 'User not authenticated'));
  }
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User Logged out Successfully'));
});
export { registerUser, loginUser, logoutUser };
