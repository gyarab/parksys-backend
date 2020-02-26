import { Context, Resolver } from "./gql";
import mongoose from "mongoose";
import lodash from "lodash";

export type ModelGetter<D extends mongoose.Document> = (
  ctx: Context,
  model?: string
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
) => async (_, args, ctx) => {
  const type = args.input._t;
  return await modelGetter(ctx, type).findByIdAndUpdate(
    args.id,
    getInput(args.input, mapper),
    { new: true }
  );
};

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
    const limit = lodash.get(args, "search.limit", limitArg.default);
    const page = lodash.get(args, "search.page", 1);
    if (limit > limitArg.max)
      throw new Error(`Limit must be <= ${limitArg.max}!`);
    const fieldValueEscaped = lodash
      .get(args, `search.${fieldKey}`, "")
      .replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, "\\$&");
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

export const gqlPaged = <D extends mongoose.Document, K extends keyof D>(
  modelGetter: ModelGetter<D>,
  limitArg: { max: number; default: number },
  sorting: object,
  find: object = {}
): Resolver | never => {
  if (limitArg.max < limitArg.default) {
    throw new Error(
      "limit.max < limit.default! This would produce errors every time the resolver is called!"
    );
  }
  return async (_, args, ctx) => {
    const model = modelGetter(ctx);
    const limit = lodash.get(args, "limit", limitArg.default);
    const page = lodash.get(args, "page", 1);
    const find2 = lodash.get(args, "_find", {});
    if (limit > limitArg.max)
      throw new Error(`Limit must be <= ${limitArg.max}!`);
    const matchedObjects = await model
      .find({ ...find, ...find2 })
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
