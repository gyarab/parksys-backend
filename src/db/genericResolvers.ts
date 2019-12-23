import { Context, Resolver } from "./gql";
import mongoose from "mongoose";

export type ModelGetter = (ctx: Context) => mongoose.Model<any, any>;
export type ResolverFactory = (modelGetter: ModelGetter) => Resolver;

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
