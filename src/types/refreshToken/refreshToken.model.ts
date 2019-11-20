import mongoose from "mongoose";

interface IRefreshToken {
  revokedAt: Date;
  isRevoked?: boolean;
}

interface IRefreshTokenDocument extends mongoose.Document, IRefreshToken {}

const RefreshTokenName = "RefreshToken";

const RefreshTokenSchema = new mongoose.Schema({
  revokedAt: {
    type: Date,
    default: null
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
