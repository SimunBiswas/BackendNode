/* eslint-disable prettier/prettier */

const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
  const message = `Invalid ${err.status} : ${err.value}`
  return new AppError(message, 400);
}

const handleDublicateDataCodeDB = err => {
  const message = `Dublicate Value " ${err.keyValue.name} "`
  return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
  // console.log(err.errors, "Hello World")
  const errors = Object.values(err.errors).map(el => el.message)
  console.log(errors)

  const message =   `Invalid input Data : ${errors.join('. ')}`
  return new AppError(message, 400)
}

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error : err,
        message: err.message,
        stack: err.stack
      });
}

// eslint-disable-next-line no-unused-vars
const handleJwtError = () => new AppError('Invalid Token, Please login again', 401)

// eslint-disable-next-line no-unused-vars
const handleTokenExpired = () => new AppError('Your Token is expired, Please Login again', 401)

const sendErrProd = (err, res) => {

    //Operational, trusted errors: send message to the client
    if(err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
          });
    } 
    // Programming or any unknown Error : Don't leak error to the client
    else  {
        // 1. log error
        console.error('Error 💥', err);

        // 2. Semd a generic message
        res.status(500).json({
            status: 'error',
            message: 'Something Went Very Wrong !',
          });
    }

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
}

/* eslint-disable prettier/prettier */
module.exports = (err, req, res, next) => {
    // console.log(err);
    // console.log('Error name:', err.name); 

  
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // console.log(process.env.NODE_ENV)

    if(process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {

      let error = { ...err, errorCode: err.name};
      console.log('Error name:', error.errorCode); // Log the error name
      // console.log(error.errors.name)

      // console.log(error.CastError)

      if (error.errorCode === "CastError" ) error = handleCastErrorDB(error)
      if (error.code === 11000) error = handleDublicateDataCodeDB(error)
      if (error.errorCode === "ValidationError") error = handleValidationErrorDB(error)
      if (error.errorCode === "JsonWebTokenError") error = handleJwtError()
      if (error.errorCode === "TokenExpiredError") error = handleTokenExpired()

       sendErrProd(error, res)
    }

  }