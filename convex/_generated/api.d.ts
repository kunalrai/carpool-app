/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as blogs from "../blogs.js";
import type * as bookings from "../bookings.js";
import type * as calls from "../calls.js";
import type * as chat from "../chat.js";
import type * as crons from "../crons.js";
import type * as directMessages from "../directMessages.js";
import type * as listings from "../listings.js";
import type * as recurring from "../recurring.js";
import type * as rideMessages from "../rideMessages.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  auth: typeof auth;
  blogs: typeof blogs;
  bookings: typeof bookings;
  calls: typeof calls;
  chat: typeof chat;
  crons: typeof crons;
  directMessages: typeof directMessages;
  listings: typeof listings;
  recurring: typeof recurring;
  rideMessages: typeof rideMessages;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
