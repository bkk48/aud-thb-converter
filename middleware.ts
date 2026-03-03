import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require login
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/order(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};