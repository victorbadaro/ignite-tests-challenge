import cors from 'cors';
import express from 'express';
import 'express-async-errors';
import 'reflect-metadata';
import createConnection from './database';

createConnection();

import { router } from './routes';
import './shared/container';
import { AppError } from './shared/errors/AppError';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', router);

app.use(
  (err: Error, request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      return response.status(err.statusCode).json({
        message: err.message
      });
    }

    return response.status(500).json({
      status: "error",
      message: `Internal server error - ${err.message} `,
    });
  }
);

export { app };
