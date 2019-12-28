const dateFilter = <T, K extends keyof T>(query: T, key, originalKey: K) => {
  if (!query[originalKey]) {
    delete query[originalKey];
    return query;
  }
  const keys = ["lt", "lte", "gt", "gte"];
  const f = {};
  for (const k of keys) {
    if (query[originalKey][k] !== undefined) {
      f[`$${k}`] = query[originalKey][k];
    }
  }
  if (Object.keys(f).length > 0) {
    query[key] = f;
  }
  delete query[originalKey];
  return query;
};

export default dateFilter;
