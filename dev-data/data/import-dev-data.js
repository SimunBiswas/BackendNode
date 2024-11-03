/* eslint-disable prettier/prettier */
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('../../models/tourModel')
const Review = require('../../models/reviewModel')
const User = require('../../models/userModels')

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

const connectDB = async () => {
    try {
      await mongoose
      // .connect(process.env.DATABASE_LOCAL, {
      .connect(DB, {
        useUnifiedTopology: true
      }).then(() => {
        console.log('DB connection successful');
      });
    } catch (err) {
      console.error('DB connection error:', err);
      process.exit(1); // Exit the process with a failure
    }
  };
  
  connectDB();

  //Read json File

  const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
  const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
  const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))

  // IMPORT DATA INTO THE DB
  const importData = async () => {
    try {
        await Tour.create(tours)
        await Review.create(reviews)
        await User.create(users, {validatesBeforeSafe : false})
        console.log('Data successfully uploaded')
    }catch (err){
        console.log(err)
    }
    process.exit()
  }

  //DELETE DATA FROM THE DB
  const deleteData = async () => {
    try{
        await Tour.deleteMany()
        await Review.deleteMany()
        await User.deleteMany()
        console.log('Data successfully Deleted')
    }catch (err){
        console.log(err)
    }
    process.exit()
  }

  if (process.argv[2] === '--import') {
    importData();
  } else if (process.argv[2] === '--delete') {
    deleteData();
  }