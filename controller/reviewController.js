/* eslint-disable prettier/prettier */
const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync')
const factory = require('./handleController')



exports.setTourUserIds = (req, res, next) => {
    console.log(req.params.tourId)
    // Allow Nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    console.log(req.params.tourId)

    if(!req.body.user) req.body.user = req.user.id
    next()
}

exports.getAllReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)