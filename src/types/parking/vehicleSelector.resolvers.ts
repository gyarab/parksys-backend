export default {
  VehicleSelector: {
    __resolveType(obj) {
      if (!!obj.value) return "VehicleSelectorSingleton";
      return "VehicleFilter";
    }
  }
};
