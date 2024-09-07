import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: Process.env.CORS_ORIGIN,
    Credential: true,
  })
);

// express settings for app
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' })); // extended : for crate objects in object in case
app.use(express.static('public'));
app.use(cookieParser());

export { app };
