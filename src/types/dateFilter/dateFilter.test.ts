import dateFilter from ".";

describe("DateFilter parser", () => {
  const date1 = new Date(1);
  const date2 = new Date(2);
  const date3 = new Date(3);
  const date4 = new Date(4);
  it("parses", () => {
    const query = {
      id: 123,
      filter1: {
        gt: date1,
        lt: date4
      },
      filter2: {
        gte: date2,
        lte: date3
      },
      filter3: undefined,
      filter4: null
    };
    const expected1 = {
      id: 123,
      date1: { $gt: date1, $lt: date4 }
    };
    expect(dateFilter(query, "date1", "filter1")).toMatchObject(expected1);
    // The object itself should be modified
    expect(query).toMatchObject(expected1);

    const finalExpected = {
      id: 123,
      date1: { $gt: date1, $lt: date4 },
      date2: { $gte: date2, $lte: date3 }
    };

    expect(dateFilter(query, "date2", "filter2")).toMatchObject(finalExpected);
    expect(query).toMatchObject(finalExpected);

    expect(dateFilter(query, "date3", "filter3")).toMatchObject(finalExpected);
    expect(dateFilter(query, "date4", "filter4")).toMatchObject(finalExpected);

    expect(query).toMatchObject(finalExpected);
    expect(query["date3"]).toBeUndefined();
    expect(query["date4"]).toBeUndefined();

    // It should have removed the original properties
    expect(query.filter1).toBeUndefined();
    expect(query.filter2).toBeUndefined();
    expect(query.filter3).toBeUndefined();
    expect(query.filter4).toBeUndefined();
  });
});
