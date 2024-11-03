/* eslint-disable prettier/prettier */
const express = require('express');
// const fs = require('fs');

const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
// const reviewController = require('../controller/reviewController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// POST /tour/12432133/reviews
// GET /tour/12432133/reviews
// GET /tour/12432133/reviews/2343543

router.use('/:tourId/reviews', reviewRouter);

// router.param('id', (req, res, next, val) => {
//   console.log(`the id is ${val}`);
//   next();
// })

// router.param('id', tourController.checkID)

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyplan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
router
  .route('/:distances/:latlng/unit/:unit')
  .get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
