/* eslint-disable prettier/prettier */
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No Document Found with this ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document Found with this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

  exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
      const doc = await Model.create(req.body);
  
      res.status(201).json({
        status: 'success',
        data: {
          data: doc
        }
      });
    });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.params);
    // const id = req.params.id * 1;

    // const tour = tours.find((el) => el.id === id);

    // res.status(200).json({
    //   status: 'success',
    //   data: {
    //     tour,
    //   },
    // });

    const query = Model.findById(req.params.id);

    if (popOptions) query.populate(popOptions);

    const doc = await query;

    // const tour = await Tour.findById(req.params.id);
    //   const doc = await Model.findById(req.params.id).populate('reviews')
    // Tour.findOne( {_id : req.params.id} )

    if (!doc) {
      return next(new AppError('No Tour Found with this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    
    // to allow for nested get reviews on tour (hack).
    let filter = {}
    if(req.params.tourId) filter = { tour : req.params.tourId }

    // console.log(req.requestTime);
    // console.log(Tour)
    //  1A) Filtering
    // const queryObj = {...req.query};
    // const excludeFields = ['page', 'sort', 'limit', 'fields'];
    // excludeFields.forEach(el => delete queryObj[el])

    // console.log(req.query, queryObj);

    // 1B) Advance Filtering

    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr));

    // { difficulty: { gte: 'easy' }, page: '2' } { difficulty: { $gte: 'easy' } }
    // { difficulty: { gte: 'easy' }, page: '2' } { difficulty: { gte: 'easy' } }
    // gte, gt, lte, lt

    // BUILD A QUERY
    // let query = Tour.find(JSON.parse(queryStr))

    // 2) SORTING
    // if(req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   console.log(sortBy)
    //   query.sort(sortBy);
    // }else {
    //   query.sort('-createdAt');
    // }

    // 3) FIELD LIMITING

    // if(req.query.fields){
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields)
    //   console.log(query)
    // }else {
    //   query.select('-__v')
    // }

    // PAGINATION
    // const page = (req.query.page) * 1 || 1;
    // const limit = (req.query.limit) * 1 || 100;
    // const skip = (page - 1) * limit
    // ?page=2&limit=10, 1-10 : Page-1, 11-20 : Page-2..
    // query.skip(10).limit(10)

    // query.skip(skip).limit(limit);

    // if(req.query.page){
    //   const numTours = await Tour.countDocuments()
    //   if(skip >= numTours) throw new Error('This page does not exist')
    // }

    // const tours = await Tour.find(queryObj);

    // const tours = await Tour.find(
    //   {
    //     duration : 5,
    //     difficulty : 'easy'      }
    // )

    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals('5')
    //   .where('difficulty')
    //   .equals('easy');

    // EXECUTE A QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const doc = await features.query.explain();
    const doc = await features.query;
    // const tours = await query;
    // query.sort().select().skip().limit()

    res.status(200).json({
      // SEND RESPONSE
      status: 'success',
      results: doc.length,
      data: {
        data : doc,
      },
    });
    //   } catch (err) {
    //     res.status(400).json({
    //       status: 'fail',
    //       message: 'Error to get all the tours',
    //     });
    //   }
    // };
  });
