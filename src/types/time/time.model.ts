import lodash from "lodash";

export interface Time {
  hours: number;
  minutes: number;
}

export const TimeSchema = (
  hoursRequired: boolean = false,
  minutesRequired: boolean = false,
  path: string = null
) => ({
  hours: {
    type: Number,
    required: hoursRequired,
    validate: {
      validator(h) {
        const time: Time = lodash.get(this, path, null);
        const firstCheck = 0 <= h && h <= 23 && Number.isInteger(h);
        if (!time) {
          return firstCheck;
        } else {
          return firstCheck || (h === 24 && time.minutes === 0);
        }
      }
    }
  },
  minutes: {
    type: Number,
    required: minutesRequired,
    validate: {
      validator: (m: Number) => 0 <= m && m <= 59
    }
  }
});
