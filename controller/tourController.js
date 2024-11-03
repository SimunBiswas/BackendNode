/* eslint-disable prettier/prettier */
// const fs = require('fs');

// const Review = require('../models/reviewModel');
const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync')
const factory = require('./handleController')


// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// Mongoose model will take care of this Checkbody function
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };
exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour)

exports.getTour = factory.getOne(Tour, { path : 'reviews'})

exports.createTour = factory.createOne(Tour)

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync( async (req, res, next) => {

  // console.log(res.params)
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte : 4.5 } },
      },
      {
        $group: {
          _id: {$toUpper : '$difficulty'},
          // _id: '$difficulty',
          numTours : { $sum : 1 },
          numRatings: { $sum : '$ratingsAverage'},
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort : { avgPrice : 1}
      },
      {
        $match : { _id : { $ne : 'EASY' }}
      }
    ]);

    // Log the results for debugging
    // console.log('Aggregation Results:', stats);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  
});


exports.getMonthlyplan = catchAsync( async (req, res, next) => {
    console.log(req.params.year)
    const year = req.params.year * 1; // 2022

    const plan = await Tour.aggregate( [
      {
        $unwind: '$startDates'     
      },
      {
        $project: {
          // Convert startDates to a date object
          startDates: {
            $toDate: '$startDates'
          },
          // Include other fields if needed
          name: 1,
          duration: 1,
          maxGroupSize: 1,
          difficulty: 1,
          ratingsAverage: 1,
          ratingsQuantity: 1,
          price: 1,
          summary: 1,
          description: 1,
          imageCover: 1,
          images: 1
        }
      },
      {
        $match: {
          startDates: {
            $gte : new Date(`${year}-01-01`),
            $lte :  new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group : {
          _id : { $month : '$startDates'},
          numTourStarts : { $sum : 1 },
          tours : {
            $push : '$name'
          }
        }
      },
      {
        $addFields : { month : '$_id'}
      },
      {
        $project : {
          _id : 0
        }
      },
      {
        $sort : { numTourStarts : -1 }
      },
      {
       $limit : 12
      }
    ] )
    
    res.status(200).json({
      status: 'success',
      count: plan.length,
      data: {
        plan,
      },
    });
    
  
})


// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/-45,40/unit/mi
exports.getToursWithin = catchAsync(  async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng ] = latlng.split(',')

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1

  if(!lat || !lng) {
    next( new AppError('Please provide lattitude and longitude in the forat lat,lng'), 400)

  }

  console.log(distance, lat, lng, unit, radius)

  const tours = await Tour.find({
    startLocation : { $geoWithin : {
      $centerSphere : [
        [lng, lat], radius
      ]
    } }
  })

  res.status(200).json({
    status : 'success',
    results : tours.length,
    data : {
      data : tours
    }
  })


  
} )

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }
  console.log( lat, lng, unit)


  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
