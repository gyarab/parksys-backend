import {
  Model,
  Column,
  Table,
  Scopes,
  PrimaryKey,
  BelongsToMany,
  DataType
} from "sequelize-typescript";
import User from "./User";
import UserPermission from "./UserPermission";

export enum PermissionEnum {
  ALL = "ALL"
}

@Scopes(() => ({
  users: {
    include: [
      {
        model: User,
        through: { attributes: [] }
      }
    ]
  }
}))
@Table
export default class Permission extends Model<Permission> {
  @Column({
    type: DataType.ENUM(PermissionEnum.ALL)
  })
  name: PermissionEnum;

  @BelongsToMany(() => User, () => UserPermission)
  users?: User[];
}
