import { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = 500;
  res.status(status).json({ message: err.message ?? 'Internal Server Error' });
};
