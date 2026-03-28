import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";
import { AppError } from "../errors/AppError";

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode);
  }
  return errorResponse(res, "Internal server error", 500);
};
