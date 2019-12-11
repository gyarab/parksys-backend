import {
  RefreshTokenName,
  IRefreshTokenDocument
} from "../refreshToken/refreshToken.model";
import {
  AuthenticationSchema,
  IAuthenticationDocument
} from "../authentication/authentication.model";
import mongoose from "mongoose";
import { Permission } from "../permissions";

interface IUser {
  name: string;
  email: string;
  permissions?: string[];
  authentications?: IAuthenticationDocument[];
  refreshTokens?: IRefreshTokenDocument[];
}

interface IUserDocument extends mongoose.Document, IUser {}

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

const User = mongoose.model<IUserDocument>(UserName, UserSchema);

export { User, UserSchema, UserName, IUserDocument, IUser };
