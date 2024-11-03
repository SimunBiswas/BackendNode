/* eslint-disable prettier/prettier */
const express = require('express');

const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// POST /tour/12432133/reviews
// POST /:tourId/123456/reviews

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;
