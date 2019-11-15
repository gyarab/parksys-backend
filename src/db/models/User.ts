import {
  Model,
  Column,
  Table,
  BelongsToMany,
  Scopes,
  HasMany
} from "sequelize-typescript";
import RefreshToken from "./RefreshToken";
import Authentication from "./Authentication";
import Permission from "./Permission";
import UserPermission from "./UserPermission";

@Scopes(() => ({
  refreshToken: {
    include: [
      {
        model: RefreshToken,
        through: { attributes: [] }
      }
    ]
  },
  authentications: {
    include: [
      {
        model: Authentication,
        through: { attributes: [] }
      }
    ]
  }
}))
@Table
export default class User extends Model<User> {
  @Column({
    unique: "user"
  })
  name!: string;

  @Column({
    unique: "user"
  })
  email!: string;

  @HasMany(() => RefreshToken)
  refreshTokens?: RefreshToken[];

  @HasMany(() => Authentication)
  authentications?: Authentication[];

  @BelongsToMany(() => Permission, () => UserPermission)
  permissions?: Permission[];
}
