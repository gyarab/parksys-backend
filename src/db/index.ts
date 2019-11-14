import { Sequelize } from "sequelize";
import AuthenticationModel from "./models/Authentication";
import PermissionModel from "./models/Permission";
import UserModel from "./models/User";

// https://www.codementor.io/mirko0/how-to-use-sequelize-with-node-and-express-i24l67cuz
// Option 1: Passing parameters separately
const sequelize = new Sequelize("parksys1", "postgres", null, {
  host: "localhost",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Create models
export const User = UserModel(sequelize, Sequelize);
export const Permission = PermissionModel(sequelize, Sequelize);
export const Authentication = AuthenticationModel(sequelize, Sequelize);

// Define Many-to-Many relationships
export const UserPermission = sequelize.define("user_permission", {});

User.belongsToMany(Permission, { through: UserPermission, unique: true });
Permission.belongsToMany(User, { through: UserPermission, unique: true });

sequelize.sync({ force: true }).then(() => {
  console.log("Database & Tables created!");
});
