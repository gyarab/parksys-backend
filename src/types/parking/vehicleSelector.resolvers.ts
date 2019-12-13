export default {
  VehicleSelector: {
    __resolveType(obj) {
      if (!!obj.filter) return "VehicleFilter";
      return "VehicleSelectorSingleton";
    }
  }
};
