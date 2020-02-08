import { Resolver } from "../../db/gql";
import moment, { min } from "moment";

const toIsoDate = ({ year, month, date }) => {
  const filler = "0";
  const m = String(month).padStart(2, filler);
  const d = String(date).padStart(2, filler);
  return `${year}-${m}-${d}`;
};

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
// TODO: Range selection
const dayStatsAll: Resolver = async (_, args, ctx, info) => {
  // Calculate today
  const startDate: Date = moment()
    .subtract(2, "weeks")
    .startOf("day")
    .toDate();
  // Constants
  const dateField = "checkOut.time";
  const dateField$ = `$${dateField}`;
  const timezone = "Europe/Prague";
  // Aggregation
  const aggr = [
    {
      $match: {
        [dateField]: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: {
            $year: { date: dateField$, timezone: timezone }
          },
          month: {
            $month: { date: dateField$, timezone: timezone }
          },
          date: {
            $dayOfMonth: { date: dateField$, timezone: timezone }
          }
        },
        revenueCents: { $sum: "$finalFee" },
        numParkingSessions: { $sum: 1 }
      }
    },
    {
      $sort: {
        "_id.year": -1,
        "_id.month": -1,
        "_id.date": -1
      }
    },
    {
      $addFields: {
        numParkingSessions: { $toInt: "$numParkingSessions" }
      }
    }
  ];
  const result = await ctx.models.ParkingSession.aggregate(aggr);
  return result.map(({ _id: id, numParkingSessions, revenueCents }) => {
    const month = String(id.month).padStart(2, "0");
    const date = String(id.date).padStart(2, "0");
    const day = `${id.year}-${month}-${date}`;
    return {
      day,
      data: {
        numParkingSessions,
        revenueCents
      }
    };
  });
};

const dayStats: Resolver = async (_, args, ctx) => {
  const dateField = "checkOut.time";
  const dateField$ = `$${dateField}`;
  const timezone = "Europe/Prague";
  const day = moment(toIsoDate(args));
  const start: Date = day.startOf("day").toDate();
  const end: Date = day.endOf("day").toDate();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Supplied day is not of YYYY-MM-DD format");
  }
  const aggr = [
    {
      $match: {
        [dateField]: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          year: {
            $year: { date: dateField$, timezone }
          },
          month: {
            $month: { date: dateField$, timezone }
          },
          date: {
            $dayOfMonth: { date: dateField$, timezone }
          },
          hour: {
            $hour: { date: dateField$, timezone }
          }
        },
        revenueCents: { $sum: "$finalFee" },
        numParkingSessions: { $sum: 1 }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.date": 1,
        "_id.hour": 1
      }
    },
    {
      $project: {
        year: "$_id.year",
        month: "$_id.month",
        date: "$_id.date",
        hour: "$_id.hour",
        data: {
          revenueCents: "$revenueCents",
          numParkingSessions: { $toInt: "$numParkingSessions" }
        }
      }
    }
  ];
  const hourlyResults = await ctx.models.ParkingSession.aggregate(aggr);
  const dayStats = sumLowerLevelStats(hourlyResults);
  return {
    date: day.date(),
    data: dayStats,
    hourly: hourlyResults,
    __: {
      timezone,
      day
    }
  };
};

export default {
  Query: {
    dayStats,
    dayStatsAll
  }
};
