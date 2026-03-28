import { Schema, model, connection } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const UserModel = connection.useDb("track-backend").model("User", userSchema);
export default UserModel;
