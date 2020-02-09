import { Resolver } from "../../db/gql";
import moment from "moment";

// TODO: Rework this such that it is more readable
// TODO: Limit nesting to prevent crashes?
const sumLowerLevelStats = (lower: Array<any>) =>
  lower.reduce(
    (stats, low) => ({
      revenueCents: stats.revenueCents + low.data.revenueCents,
      numParkingSessions: stats.numParkingSessions + low.data.numParkingSessions
    }),
    // Initial
    { revenueCents: 0, numParkingSessions: 0 }
  );

// Query
const aggrMatchByRange = (dateField: string, start: Date, end: Date) => ({
  $match: {
    [dateField]: { $gte: start, $lte: end }
  }
});

const aggrGroupByDate = (
  dateField: string,
  timezone: string,
  level: "year" | "month" | "dayOfMonth" | "hour"
) => {
  const levels = ["year", "month", "dayOfMonth", "hour"];
  const arg = { date: dateField, timezone };
  const group = {
    $group: {
      _id: {
        year: { $year: arg }
      },
      revenueCents: { $sum: "$finalFee" },
      numParkingSessions: { $sum: 1 }
    }
  };
  // Until we reach the desired level
  for (let i = 0; level !== levels[i]; i++) {
    const current = levels[i + 1];
    group.$group._id[current] = {
      [`$${current}`]: arg
    };
  }
  return group;
};

const aggrSort = () => {
  return {
    $sort: {
      "_id.year": 1,
      "_id.month": 1,
      "_id.dayOfMonth": 1,
      "_id.hour": 1
    }
  };
};

const aggrProject = () => {
  return {
    $project: {
      year: "$_id.year",
      month: "$_id.month",
      date: "$_id.dayOfMonth",
      hour: "$_id.hour",
      data: {
        revenueCents: "$revenueCents",
        numParkingSessions: { $toInt: "$numParkingSessions" }
      }
    }
  };
};

const intervalFromArgs = (args): [Date, Date, moment.Moment] => {
  let full = null;
  let unit = null;
  if (!!args.year && !!args.month && !!args.date) {
    full = moment({
      year: args.year,
      month: args.month - 1,
      date: args.date
    });
    unit = "day";
  } else if (!!args.year && !!args.month) {
    full = moment({
      year: args.year,
      month: args.month - 1
    });
    unit = "month";
  } else if (!!args.year) {
    full = moment({ year: args.year });
    unit = "year";
  }
  const start = full.startOf(unit).toDate();
  const end = full.endOf(unit).toDate();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Supplied day is not of YYYY-MM-DD format");
  }
  return [start, end, full];
};

// Defaults
const dateField = "checkOut.time";
const dateField$ = `$${dateField}`;
const timezone = "Europe/Prague";

const dayStats: Resolver = async (_, args, ctx) => {
  const [start, end, day] = intervalFromArgs(args);

  const aggr = [
    aggrMatchByRange(dateField, start, end),
    aggrGroupByDate(dateField$, timezone, "hour"),
    aggrSort(),
    aggrProject()
  ];
  const hourlyStats = await ctx.models.ParkingSession.aggregate(aggr);
  const dayStats = sumLowerLevelStats(hourlyStats);
  return {
    year: day.year(),
    month: day.month(),
    date: day.date(),
    data: dayStats,

    hourly: hourlyStats,
    __: {
      timezone,
      start,
      end
    }
  };
};

const monthStats: Resolver = async (_, args, ctx) => {
  const [start, end] = intervalFromArgs(args);
  const aggr = [
    aggrMatchByRange(dateField, start, end),
    aggrGroupByDate(dateField$, timezone, "dayOfMonth"),
    aggrSort(),
    aggrProject()
  ];
  const dayStats = await ctx.models.ParkingSession.aggregate(aggr);
  const monthStats = sumLowerLevelStats(dayStats);
  return {
    month: start.getMonth(),
    year: start.getFullYear(),

    data: monthStats,
    daily: dayStats,
    __: {
      timezone,
      start,
      end
    }
  };
};

const yearStats: Resolver = async (_, args, ctx) => {
  const [start, end] = intervalFromArgs(args);
  const aggr = [
    aggrMatchByRange(dateField, start, end),
    aggrGroupByDate(dateField$, timezone, "month"),
    aggrSort(),
    aggrProject()
  ];
  const monthStats = await ctx.models.ParkingSession.aggregate(aggr);
  const yearStats = sumLowerLevelStats(monthStats);
  return {
    year: start.getFullYear(),

    data: yearStats,
    monthly: monthStats,
    __: {
      timezone,
      start,
      end
    }
  };
};

// YearStats
const monthly: Resolver = (yearStats, args, ctx) => {
  // yearlyStats.monthly is always populated
  return yearStats.monthly;
};

// MonthStats
const daily: Resolver = async (monthlyStats, args, ctx) => {
  return (await monthStats(
    null,
    {
      year: monthlyStats.year,
      month: monthlyStats.month
    },
    ctx
  )).daily;
};

// DayStats
const hourly: Resolver = async (dayilyStats, _, ctx) => {
  console.log("HOURLY");
  return (await dayStats(
    null,
    {
      year: dayilyStats.year,
      month: dayilyStats.month,
      date: dayilyStats.date
    },
    ctx
  )).hourly;
};

export default {
  Query: {
    dayStats,
    monthStats,
    yearStats
  },
  YearStats: {
    monthly
  },
  MonthStats: {
    daily
  },
  DayStats: {
    hourly
  }
};
