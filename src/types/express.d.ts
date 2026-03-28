import { IUserDocument } from "../modules/users/interfaces/user.interface";
import { ISiteDocument } from "../modules/sites/interfaces/site.interface";

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      site?: ISiteDocument;
    }
  }
}

export {};
