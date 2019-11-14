import {
  Model,
  Column,
  Table,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import User from "./User";

@Table
export default class RefreshToken extends Model<RefreshToken> {
  @ForeignKey(() => User)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column
  value!: string;

  @Column
  revoked: Date;
}
