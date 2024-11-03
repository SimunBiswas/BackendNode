/* eslint-disable prettier/prettier */
/* eslint-disable arrow-body-style */
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
// const { response } = require('express');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRED_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expiresIn : new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure : true,

    // Cookie cannot be cahnge anyway from the browser in order to sav efro cyber ttack
    httpOnly: true
  }

  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions)

  // remmove the passwords from the database output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpiresIn: req.body.passwordResetExpiresIn,
  });

  console.log(req.body);

  createSendToken(newUser, 201, res)

//   const token = signToken(newUser._id);

//   res.status(201).json({
//     status: 'success',
//     token,
//     data: {
//       user: newUser,
//     },
//   });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  // createSendToken(user, 200, res);

  createSendToken(user, 200, res)
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting Token and Check if its there.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not login, please login to get access.', 401),
    );
  }

  // 2. Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded.id, User)

  // 3. Check if user still exists.
  const freshUser = await User.findById(decoded.id);
  console.log(freshUser)
  if (!freshUser) {
    return next(
      new AppError('The user belonging to token no longer exists', 401),
    );
  }

  // 4. Check if the user changed password after the token was created.
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  //GRAND ACCESS TO THE PROTECTED ROUTE

  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(req.user.role)
    // roles ['admin' , 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on posted email.
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2. Generate the random test token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to users email.
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your Password? Submit a PATCH request eith your new password and passwordConform to ${resetURL}.
    \nIf you don't forget your pasword ignore this email.`;

  // 4.
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (Valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There is a error sending an email, please try agin later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get the user based on the token .
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresIn: { $gt: Date.now() },
  });

  // 2. If the the token had expired then there is user, set the new password.
  if(!user){
    return next(new AppError('Token validity is expired', 400))
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresIn = undefined;

  await user.save();

  // 3. Update passwordChangedAt property for the user.
  // 4. log the user in and send JWT.

  createSendToken(user, 200, res)
});


exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1. Get user from the collection

    const user = await User.findById(req.user.id).select('+password')

    // 2. Check if posted current password id correct.
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your current password is incorrect', 401))
    }

    // 3. If so, updatePassword
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.save();

    // user.findbyidandupdate will not work as intended

    // 4. Log user in and send JWT.
   createSendToken(user, 200, res)
})
