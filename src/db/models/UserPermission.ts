import { Model, Column, Table, ForeignKey } from "sequelize-typescript";
import User from "./User";
import Permission from "./Permission";

@Table
export default class UserPermission extends Model<UserPermission> {
  @ForeignKey(() => User)
  @Column
  userId!: number;

  @ForeignKey(() => Permission)
  @Column
  permissionId!: number;
}
