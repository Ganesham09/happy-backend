import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({
  path: './.env',
});

connectDB()
  .then(() => {
    app.on('error', (error) => {
      console.log('ERRR', error); // add for an event then throw error
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`🔥 APP is listing on: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log('MONGODB connection failed !!!', error);
  });

//  this is the 1st approch for connect database
/*
import express from 'express';
const app = express()
(async () => {
  try {
    await mongoose.connect(`${Process.env.MONGODB_URI}/${DB_NAME}`);
    app.on('error', (error) => {
      console.log('ERRR', error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is Listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error('ERROR:', error);
    throw err;
  }
})();
*/
