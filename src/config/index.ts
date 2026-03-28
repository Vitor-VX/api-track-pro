import dotenv from "dotenv";
import { connect } from "mongoose";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "";
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export const dbConnect = async () => {
  if (!MONGO_URI) throw new Error("MONGO_URI not set");
  await connect(MONGO_URI);
};

export default { MONGO_URI, PORT, JWT_SECRET, JWT_EXPIRES_IN };
