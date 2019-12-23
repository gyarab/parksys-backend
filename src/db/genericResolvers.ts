import { Context, Resolver } from "./gql";
import mongoose from "mongoose";

export type ModelGetter<D extends mongoose.Document> = (
  ctx: Context
) => mongoose.Model<D, any>;
export type ResolverFactory<D extends mongoose.Document = any> = (
  modelGetter: ModelGetter<D>
) => Resolver;

export const gqlCreate: ResolverFactory = modelGetter => async (_, args, ctx) =>
  await modelGetter(ctx).create(args.input);

export const gqlFindUsingFilter: ResolverFactory = modelGetter => async (
  _,
  args,
  ctx
) => await modelGetter(ctx).find(args.filter || {});

export const gqlFindByIdUpdate: ResolverFactory = modelGetter => async (
  _,
  args,
  ctx
) =>
  await modelGetter(ctx).findByIdAndUpdate(args.id, args.input, { new: true });

export const gqlFindByIdDelete: ResolverFactory = modelGetter => async (
  _,
  args,
  ctx
) => await modelGetter(ctx).findByIdAndRemove(args.id);

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
