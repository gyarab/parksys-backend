import mongoose from "mongoose";

enum AuthenticationMethod {
  PASSWORD = "PASSWORD"
}

interface IAuthentication extends mongoose.Document {
  payload: string;
  method: AuthenticationMethod;
}

const AuthenticationName = "Authentication";

const AuthenticationSchema: mongoose.Schema<
  IAuthentication
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

const Authentication = mongoose.model<IAuthentication>(
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
