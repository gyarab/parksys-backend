interface DateFilter {
  gt?: Date;
  gte?: Date;
  lt?: Date;
  lte?: Date;
}

const dateFilter = (filter: DateFilter) => {
  if (!filter) {
    return {};
  }
  return ["gt", "gte", "lt", "lte"]
    .filter((key) => !!filter[key])
    .reduce((newFilter, key) => {
      newFilter[`$${key}`] = filter[key];
      return newFilter;
    }, {});
};

export default dateFilter;
