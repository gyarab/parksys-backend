import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import path from "path";

export default () => {
  // TODO: Move to config
  const sequelize = new Sequelize("parksys1", "postgres", null, {
    host: "localhost",
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    models: [path.join(__dirname, "models")]
  });
  return {
    init() {
      sequelize.sync({ force: true }).then(() => {
        console.log("Database & Tables created!");
      });
    }
  };
};
