import {
  Model,
  Column,
  Table,
  ForeignKey,
  DataType,
  BelongsTo
} from "sequelize-typescript";
import User from "./User";

export enum AuthenticationMethod {
  PASSWORD = "PASSWORD"
}

@Table
export default class Authentication extends Model<Authentication> {
  @ForeignKey(() => User)
  @Column({
    unique: "auth"
  })
  userId!: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.ENUM(AuthenticationMethod.PASSWORD),
    unique: "auth"
  })
  method: AuthenticationMethod;
}
