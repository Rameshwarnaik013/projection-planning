import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/register"];

async function isValid(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("pp_session")?.value;
  const authed = await isValid(token);

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (authed) return NextResponse.redirect(new URL("/factories", req.url));
    return NextResponse.next();
  }

  if (!authed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Protect pages only. API routes guard themselves via getSession().
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
