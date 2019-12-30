import {
  RefreshTokenName,
  IRefreshToken
} from "../refreshToken/refreshToken.model";
import {
  AuthenticationSchema,
  IAuthentication
} from "../authentication/authentication.model";
import mongoose from "mongoose";
import { Permission } from "../permissions";

interface IUser extends mongoose.Document {
  name: string;
  email: string;
  permissions?: string[];
  authentications?: IAuthentication<any>[];
  refreshTokens?: IRefreshToken["_id"][];
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
      required: true,
      enum: Object.keys(Permission)
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
