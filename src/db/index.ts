import { Sequelize } from "sequelize-typescript";
import path from "path";

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
  },
  models: [path.join(__dirname, "models")]
});

sequelize.sync({ force: true }).then(() => {
  console.log("Database & Tables created!");
});

export default null;
