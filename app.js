/* eslint-disable prettier/prettier */
const path = require('path')
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitie = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes')

const app = express();

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

//Golobal middleware

// Serving statis file
app.use(express.static(path.join(__dirname, 'public')));

// Set HTTP Headers
app.use(helmet());

// DEVELOPMENT LOGGING
// console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit Request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try after an hour',
});

app.use('/api', limiter);

// Body Parser, Reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NOSQL Querry attack
app.use(mongoSanitie());

// Data Sanitization aganist XSS
app.use(xss());

// Http Pollution Protect
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
    ],
  }),
);


// app.use((req, res, next) => {
//   console.log("Hello From the Middleware")
//   next();
// })

// TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)
  next();
});

// app.post('/', (req, res) => {
//     res.send('You can post to the endpoint')
// })
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/starter/dev-data/data/tours-simple.json`)
// );

// app.get("/api/v1/tours", (req, res) => {
//   res.status(200).json({
//     staus: "success",
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// });

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// const tourRouter = express.Router();

// tourRouter
//   .route('/')
//   .get(getAllTours)
//   .post(createTour);
// tourRouter
//   .route('/:id')
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour)

// const userRouter = express.Router();

// userRouter
//   .route('/')
//   .get(getAllUsers)
//   .post(createUser);
// userRouter
//   .route('/:id')
//   .get(getUser)
//   .patch(updatteUser)
//   .delete(deleteUser)

// Routes

app.get('/', (req, res) => {
  res.status(400).render('base')
})

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status : 'fail',
  //   message : `Can't find ${req.originalUrl} on the server.`
  // })

  // const err = new Error(`Can't find ${req.originalUrl} on the server.`)
  // err.status = 'fail';
  // err.statusCode = 404;

  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on the server.`, 404));
});

app.use(globalErrorHandler);

// app.get('/', (req, res ) => {
//   res
//     .status(200)
//     .json({message : 'Hello From the Server side !', app: 'Natours'})
// })

// app.post('/', (req, res ) => {
//   req.post('You can post to this endpoint.')

// })

module.exports = app;
