import mongoose from "mongoose";

interface IAuthenticationPayload {}

enum AuthenticationMethod {
  PASSWORD = "PASSWORD",
  ACTIVATION_PASSWORD = "ACTIVATION_PASSWORD" // One-use
}

interface IAuthenticationPayloadPassword extends IAuthenticationPayload {
  h: string;
  s: string;
}

interface IAuthenticationPayloadActivationPassword extends IAuthenticationPayload {
  password: string;
  expiresAt: Date;
}

interface IAuthentication<T extends IAuthenticationPayload> {
  payload: T;
  method: AuthenticationMethod;
}

interface IAuthenticationDocument extends mongoose.Document, IAuthentication<any> {}

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
      required: true,
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
  IAuthentication,
  IAuthenticationPayload,
  IAuthenticationPayloadPassword,
  IAuthenticationPayloadActivationPassword
};