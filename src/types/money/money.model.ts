export const MoneySchema = {
  type: Number,
  validate: {
    validator: (v: any) => Number.isInteger(v) && v >= 0,
    message: "{VALUE} is not a positive integer"
  }
};

export type Money = Number;
