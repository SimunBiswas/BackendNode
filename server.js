/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtExceptionMonitor', err => {
  console.log(err.name, err.message); 
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
   // eslint-disable-next-line no-use-before-define
   server.close( process.exit(1) )
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// console.log(process.env)

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false
    // useUnifiedTopology: true 
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
