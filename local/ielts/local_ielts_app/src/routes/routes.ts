/**
 * Routes configuration for IELTS application
 */

export const ROUTES = {
  HOME: "/",
  READING: "/reading",
  LISTENING: "/listening",
  WRITING: "/writing",
  SPEAKING: "/speaking",
  RESULT: "/result",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
