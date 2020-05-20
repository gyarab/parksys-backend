import dateFilter from ".";

describe("DateFilter parser", () => {
  const date1 = new Date(1);
  const date2 = new Date(2);
  const date3 = new Date(3);
  const date4 = new Date(4);

  it("parses", () => {
    const filter1 = {
      gt: date1,
      lt: date4,
    };
    const filter2 = {
      gte: date2,
      lte: date3,
    };
    const filter3 = undefined;
    const filter4 = null;

    expect(dateFilter(filter1)).toMatchObject({
      $gt: date1,
      $lt: date4,
    });
    expect(dateFilter(filter2)).toMatchObject({
      $gte: date2,
      $lte: date3,
    });
    expect(dateFilter(filter3)).toStrictEqual({});
    expect(dateFilter(filter4)).toStrictEqual({});
  });
});
