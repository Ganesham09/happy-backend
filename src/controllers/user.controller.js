import { asyncHandler } from '../utils/asyncHandler.js';

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: 'how are you sar',
  });
});

export { registerUser };
