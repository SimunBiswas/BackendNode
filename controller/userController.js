/* eslint-disable prettier/prettier */

const User = require('../models/userModels');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleController')


const filterObj = (obj, ...allowedFields) =>{

  const newObj = {}

  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el] = obj[el]
  })

  return newObj;

}

exports.getMe = (req, res, next) => {
  console.log(req.user.id)
  req.params.id = req.user.id;
  next();
}

exports.getAllUsers = factory.getAll(User)

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error is user POSTs pasword data.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not used for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }
  // 3. Filtered out unwanted fied name that are not allowwed to be updated.
  const filteredBody = filterObj(req.body, 'name', 'email')

  // 2. Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  

  res.status(200).json({
    status: 'success',
    data : {
      user : updatedUser
    }
  });
});

exports.deleteMe = catchAsync( async(req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {active : false})
  res.status(204).json({
    status : 'success',
    data : null
  })
})

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined / Please use sign up instead.',
  });
};
exports.getUser  = factory.getOne(User)

// Do not update password with this
exports.updatteUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
