import mongoose from "mongoose";
import { AuthenticationMethod } from "../authentication/authentication.model";

interface IRefreshToken extends mongoose.Document {
  revokedAt: Date;
  method: AuthenticationMethod;
  isRevoked?: boolean;
}

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

const RefreshToken = mongoose.model<IRefreshToken>(
  RefreshTokenName,
  RefreshTokenSchema
);

export { RefreshTokenSchema, RefreshToken, RefreshTokenName, IRefreshToken };
