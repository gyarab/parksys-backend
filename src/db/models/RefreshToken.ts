import mongoose from "mongoose";

interface IRefreshToken extends mongoose.Document {
  revokedAt: Date;
  isRevoked: boolean;
}

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

const RefreshToken = mongoose.model<IRefreshToken>(
  RefreshTokenName,
  RefreshTokenSchema
);

export { RefreshTokenSchema, RefreshToken, RefreshTokenName, IRefreshToken };
