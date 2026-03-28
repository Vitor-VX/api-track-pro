import UserModel from "./user.model";
import { AppError } from "../../errors/AppError";
import { MESSAGES } from "../../constants/messages";

export class UserService {
  static async getProfile(userId: string) {
    const user = await UserModel.findById(userId).select("-password").select("-__v").select("-updatedAt");
    if (!user) throw new AppError(MESSAGES.userNotFound, 404);
    return user;
  }
}
