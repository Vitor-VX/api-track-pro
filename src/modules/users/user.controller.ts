import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";
import { successResponse } from "../../utils/response";
import { IUserDocument } from "./interfaces/user.interface";

export class UserController {
  static async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getProfile((req.user as IUserDocument)._id);
      return successResponse(res, "Profile loaded", user, 200);
    } catch (error) {
      next(error);
    }
  }
}
