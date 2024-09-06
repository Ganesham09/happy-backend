// require('dotenv').config({path: './env'})

import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config({
  path: './env',
});

connectDB();

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
