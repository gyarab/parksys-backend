import mongoose from "mongoose";

enum AuthenticationMethod {
  PASSWORD = "PASSWORD",
  ACTIVATION_PASSWORD = "ACTIVATION_PASSWORD" // One-use
}

interface IAuthentication {
  payload: object;
  method: AuthenticationMethod;
}

interface IAuthenticationDocument extends mongoose.Document, IAuthentication {}

const AuthenticationName = "Authentication";

const AuthenticationSchema: mongoose.Schema<
  IAuthenticationDocument
> = new mongoose.Schema(
  {
    payload: {
      type: Object,
      required: true
    },
    method: {
      type: String,
      require: true,
      enum: Object.keys(AuthenticationMethod)
    }
  },
  { _id: false, id: false }
);

const Authentication = mongoose.model<IAuthenticationDocument>(
  AuthenticationName,
  AuthenticationSchema
);

export {
  AuthenticationSchema,
  Authentication,
  AuthenticationName,
  AuthenticationMethod,
  IAuthentication
};
