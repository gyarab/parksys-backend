import {
  RefreshTokenName,
  IRefreshToken
} from "../refreshToken/refreshToken.model";
import {
  AuthenticationSchema,
  IAuthentication
} from "../authentication/authentication.model";
import mongoose from "mongoose";

interface IUser extends mongoose.Document {
  name: string;
  email: string;
  permissions: string[];
  authentications: IAuthentication[];
  refreshTokens: IRefreshToken[];
}

const UserName = "User";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    dropDups: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    dropDups: true
  },
  permissions: [
    {
      type: String,
      required: true
    }
  ],
  authentications: [AuthenticationSchema],
  refreshTokens: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: RefreshTokenName
    }
  ]
});

const User = mongoose.model<IUser>(UserName, UserSchema);

export { User, UserSchema, UserName, IUser };
