import mongoose from "mongoose";
import { AuthenticationMethod } from "../authentication/authentication.model";

interface IRefreshToken {
  revokedAt: Date;
  method: AuthenticationMethod;
  isRevoked?: boolean;
}

interface IRefreshTokenDocument extends mongoose.Document, IRefreshToken {}

const RefreshTokenName = "RefreshToken";

const RefreshTokenSchema = new mongoose.Schema({
  revokedAt: {
    type: Date,
    default: null
  },
  method: {
    type: String,
    required: true,
    enum: Object.keys(AuthenticationMethod)
  }
});

RefreshTokenSchema.virtual("isRevoked").get(function() {
  return (
    this.revokedAt !== null && new Date().getTime() >= this.revokedAt.getTime()
  );
});

const RefreshToken = mongoose.model<IRefreshTokenDocument>(
  RefreshTokenName,
  RefreshTokenSchema
);

export {
  RefreshTokenSchema,
  RefreshToken,
  RefreshTokenName,
  IRefreshTokenDocument,
  IRefreshToken
};
