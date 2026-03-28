import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { setCookie, successResponse } from "../../utils/response";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;

      const user = await AuthService.register(name, email, password);

      return successResponse(res, "User registered", user, 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const { token, id } = await AuthService.login(email, password);
      const payload = { email, id };

      setCookie(res, "access_token", token, 3000 * 60 * 60);
      return successResponse(res, "Login successful", payload, 200);
    } catch (error) {
      next(error);
    }
  }
}
