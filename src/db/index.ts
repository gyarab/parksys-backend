const Sequelize = require("sequelize");

// Option 1: Passing parameters separately
const sequelize = new Sequelize("parking1", "postgres", "mysecretpassword", {
  host: "localhost",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0
  }
});
