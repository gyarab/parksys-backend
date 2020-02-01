import { Resolver } from "../../db/gql";
import moment from "moment";

// Query
const dayStats: Resolver = async (_, args, ctx, info) => {
  // Calculate today
  const startDate: Date = moment()
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
  return result.map(dayData => {
    const id = dayData._id;
    const month = String(id.month).padStart(2, "0");
    const date = String(id.date).padStart(2, "0");
    dayData.day = `${id.year}-${month}-${date}`;
    return dayData;
  });
};

export default {
  Query: {
    dayStats
  }
};
