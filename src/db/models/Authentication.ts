import { modelName as userModelName } from "./User";

export const modelName = "authentication";
export default (sequelize, type) => {
  return sequelize.define(
    modelName,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        default: sequelize.fn("uuid_generate_v4")
      },
      userId: {
        type: type.INTEGER,
        references: {
          model: userModelName + "s",
          key: "id"
        }
      },
      method: type.ENUM(["PASSWORD"]),
      payload: type.JSONB
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["userId", "method"]
        }
      ]
    }
  );
};
