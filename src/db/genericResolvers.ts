import { Context, Resolver } from "./gql";
import mongoose from "mongoose";

export type ModelGetter<D extends mongoose.Document> = (
  ctx: Context
) => mongoose.Model<D, any>;
export type ResolverFactory<D extends mongoose.Document = any> = (
  modelGetter: ModelGetter<D>,
  mapper?: (input: any) => any
) => Resolver;

const getInput = (input: any, mapper?: (input: any) => any) => {
  return !mapper ? input : mapper(input);
};

export const gqlCreate: ResolverFactory = (modelGetter, mapper) => async (
  _,
  args,
  ctx
) => await modelGetter(ctx).create(getInput(args.input, mapper));

export const gqlFindUsingFilter: ResolverFactory = modelGetter => async (
  _,
  args,
  ctx
) => await modelGetter(ctx).find(args.filter || {});

export const gqlFindByIdUpdate: ResolverFactory = (
  modelGetter,
  mapper
) => async (_, args, ctx) =>
  await modelGetter(ctx).findByIdAndUpdate(
    args.id,
    getInput(args.input, mapper),
    { new: true }
  );

export const gqlFindByIdDelete: ResolverFactory = modelGetter => async (
  _,
  args,
  ctx
) => {
  await modelGetter(ctx).findByIdAndRemove(args.id);
  return { id: args.id };
};

export const gqlPopulate = <D extends mongoose.Document, K extends keyof D>(
  modelGetter: ModelGetter<D>,
  key: K
): Resolver => async (obj: D, _, ctx) => {
  const keyStr = key.toString();
  if (obj.populated(keyStr)) {
    return obj[key];
  } else {
    const populated: D = await modelGetter(ctx).populate(obj, {
      path: keyStr
    });
    return populated[key];
  }
};

export const gqlRegexSearch = <D extends mongoose.Document, K extends keyof D>(
  modelGetter: ModelGetter<D>,
  fieldKey: K,
  limitArg: { max: number; default: number },
  caseSensitive: boolean = true,
  sorting: object = { [fieldKey]: -1 }
): Resolver | never => {
  if (limitArg.max < limitArg.default) {
    throw new Error(
      "limit.max < limit.default! This would produce errors every time the resolver is called!"
    );
  }
  return async (_, args, ctx) => {
    const model = modelGetter(ctx);
    const limit = args.search.limit || limitArg.default;
    const page = args.search.page || 1;
    if (limit > limitArg.max)
      throw new Error(`Limit must be <= ${limitArg.max}!`);
    const fieldValueEscaped = args.search[fieldKey].replace(
      /[-[\]{}()*+?.,\\/^$|#\s]/g,
      "\\$&"
    );
    const query = { $regex: `.*${fieldValueEscaped}.*` };
    if (!caseSensitive) query["$options"] = "i";
    const matchedObjects = await model
      .find({ [fieldKey]: query })
      .sort(sorting)
      // Skip does not scale well: https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js
      .skip((page - 1) * limit)
      .limit(limit);
    return {
      data: matchedObjects,
      page,
      limit
    };
  };
};
