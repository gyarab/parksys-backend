export default (sequelize, type) => {
  return sequelize.define("permission", {
    name: {
      type: type.STRING,
      primaryKey: true
    }
  });
};
