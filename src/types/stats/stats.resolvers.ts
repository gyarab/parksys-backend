import { Resolver } from "../../db/gql";
import moment, { min } from "moment";

// Query
// TODO: Range selection
const dayStats: Resolver = async (_, args, ctx, info) => {
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

const dayStatsPerHour: Resolver = async (_, args, ctx) => {
  const dateField = "checkOut.time";
  const dateField$ = `$${dateField}`;
  const timezone = "Europe/Prague";
  // TODO: Catch invalid inputs (timestamp, iso date, etc.)
  const day = moment(args.day);
  const start: Date = day.startOf("day").toDate();
  const end: Date = day.endOf("day").toDate();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    // Invalid date
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
          $hour: { date: dateField$, timezone: timezone }
        },
        revenueCents: { $sum: "$finalFee" },
        numParkingSessions: { $sum: 1 }
      }
    },
    {
      $project: {
        hour: "$_id",
        data: {
          revenueCents: "$revenueCents",
          numParkingSessions: { $toInt: "$numParkingSessions" }
        }
      }
    }
  ];
  const results = await ctx.models.ParkingSession.aggregate(aggr);
  console.log(results);
  return {
    day: args.day,
    data: results
  };
};

export default {
  Query: {
    dayStats,
    dayStatsPerHour
  }
};
