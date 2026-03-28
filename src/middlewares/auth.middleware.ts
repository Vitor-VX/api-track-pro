import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import UserModel from "../modules/users/user.model";
import { errorResponse } from "../utils/response";
import { MESSAGES } from "../constants/messages";

interface TokenPayload { id: string; email: string; }

declare global {
  namespace Express {
    interface Request { user?: unknown; }
  }
}

export const jwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return errorResponse(res, MESSAGES.unauthorized, 401);
  }
  const token = header.split(" ")[1];
  try {
    console.log(token);
    console.log(config.JWT_SECRET);
    const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    const user = await UserModel.findById(payload.id);
    if (!user) return errorResponse(res, MESSAGES.unauthorized, 401);
    req.user = user;
    next();
  } catch {
    return errorResponse(res, MESSAGES.unauthorized, 401);
  }
};
