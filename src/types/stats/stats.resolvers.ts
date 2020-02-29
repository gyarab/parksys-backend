import { Resolver, Context } from "../../db/gql";
import moment from "moment";
import { checkPermissionsGqlBuilder } from "../../auth/requestHofs";

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

type AggregationLevel = "year" | "month" | "dayOfMonth" | "hour";
const aggrGroupByDate = (
  dateField: string,
  timezone: string,
  level: AggregationLevel
) => {
  const levels: Array<AggregationLevel> = [
    "year",
    "month",
    "dayOfMonth",
    "hour"
  ];
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

const genericStatsGenerator = (
  dateField: string,
  timezone: string,
  level: AggregationLevel,
  lowerLevelKey: string
) => async (args, ctx: Context) => {
  const [start, end, day] = intervalFromArgs(args);
  const dateField$ = `$${dateField}`;

  const aggr = [
    aggrMatchByRange(dateField, start, end),
    aggrGroupByDate(dateField$, timezone, level),
    aggrSort(),
    aggrProject()
  ];
  const subLevelStats = await ctx.models.ParkingSession.aggregate(aggr);
  const thisLevelStats = sumLowerLevelStats(subLevelStats);
  return {
    year: day.year(),
    month: day.month() + 1,
    date: day.date(),
    data: thisLevelStats,

    [lowerLevelKey]: subLevelStats,
    __: {
      timezone,
      start,
      end
    }
  };
};

// Defaults
const dateField = "checkOut.time";
const timezone = "Europe/Prague";

const dayStats = genericStatsGenerator(dateField, timezone, "hour", "hourly");
const monthStats = genericStatsGenerator(
  dateField,
  timezone,
  "dayOfMonth",
  "daily"
);
const yearStats = genericStatsGenerator(
  dateField,
  timezone,
  "month",
  "monthly"
);

const dayStatsResolver: Resolver = async (_, args, ctx) => {
  return await dayStats(args, ctx);
};

const monthStatsResolver: Resolver = async (_, args, ctx) => {
  return await monthStats(args, ctx);
};

const yearStatsResolver: Resolver = async (_, args, ctx) => {
  return await yearStats(args, ctx);
};

// YearStats
const monthly: Resolver = (yearStats, args, ctx) => {
  // yearlyStats.monthly is always populated
  return yearStats.monthly;
};

const yearsDaily: Resolver = async (yearStats, args, ctx) =>
  (await monthStats(
    {
      year: yearStats.year
    },
    ctx
  )).daily;

// MonthStats
const daily: Resolver = async (monthlyStats, args, ctx) => {
  return (await monthStats(
    {
      year: monthlyStats.year,
      month: monthlyStats.month
    },
    ctx
  )).daily;
};

// DayStats
const hourly: Resolver = async (dayilyStats, _, ctx) => {
  return (await dayStats(
    {
      year: dayilyStats.year,
      month: dayilyStats.month,
      date: dayilyStats.date
    },
    ctx
  )).hourly;
};

// LiveStats
const numActiveParkingSessions: Resolver = async (_, __, ctx) =>
  ctx.models.ParkingSession.countDocuments({ active: true });

export default {
  Query: {
    dayStats: dayStatsResolver,
    monthStats: monthStatsResolver,
    yearStats: yearStatsResolver,
    liveStats: checkPermissionsGqlBuilder([], () => ({}))
  },
  YearStats: {
    monthly,
    daily: yearsDaily
  },
  MonthStats: {
    daily
  },
  DayStats: {
    hourly
  },
  LiveStats: {
    numActiveParkingSessions
  }
};
