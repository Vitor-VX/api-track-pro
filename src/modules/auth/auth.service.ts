import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import UserModel from "../users/user.model";
import config from "../../config";
import { AppError } from "../../errors/AppError";
import { MESSAGES } from "../../constants/messages";

export class AuthService {
    static async register(name: string, email: string, password: string) {
        const exists = await UserModel.findOne({ email });
        
        if (exists) throw new AppError(MESSAGES.emailExists, 400);
        const hash = await bcrypt.hash(password, 10);

        const user = await UserModel.create({ name, email, password: hash });
        return { id: user._id, name: user.name, email: user.email };
    }

    static async login(email: string, password: string) {
        const user = await UserModel.findOne({ email });
        if (!user) throw new AppError(MESSAGES.invalidCredentials, 401);
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new AppError(MESSAGES.invalidCredentials, 401);

        const secret = config.JWT_SECRET as Secret;
        const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: "1d" });
        return { token, email: user.email, id: user._id };
    }
}
