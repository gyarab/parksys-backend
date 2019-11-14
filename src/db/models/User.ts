export const modelName = "user";
export default (sequelize, type) => {
  console.log(typeof sequelize);
  console.log(typeof type);
  return sequelize.define(modelName, {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      default: sequelize.fn("uuid_generate_v4")
    },
    name: type.STRING,
    email: type.STRING
  });
};
