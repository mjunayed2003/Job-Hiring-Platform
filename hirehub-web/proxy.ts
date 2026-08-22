import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/employer",
  "/company",
  "/notification",
  "/profile",
  "/settings",
  "/jobs",
  "/jobseeker/profile-details",
  "/jobseeker/jobs/interviews",
  "/jobseeker/jobs/:id/apply",
];

const ROLE_PATHS: Record<string, string[]> = {
  "/employer": ["EMPLOYER"],
  "/jobseeker": ["JOB_SEEKER"],
  "/company": ["COMPANY"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    const loginUrl = new URL("/auth/signin", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = request.cookies.get("user-role")?.value;
  const requiredRoles = Object.entries(ROLE_PATHS).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  if (requiredRoles && userRole && !requiredRoles.includes(userRole)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/employer/:path*",
    "/company/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/jobs/:path*",
    "/jobseeker/profile-details",
    "/jobseeker/jobs/interviews",
    "/jobseeker/jobs/:id/apply",
  ],
};
