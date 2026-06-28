import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];
const RESTRICTED_PATHS = ["/keuangan", "/laporan", "/penjualan", "/master", "/setting"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // cashier_session stores the role, set by saveAuth() on login
  const role = request.cookies.get("cashier_session")?.value;
  const loggedIn = !!role;

  if (PUBLIC_PATHS.includes(pathname)) {
    if (loggedIn) return NextResponse.redirect(new URL("/kasir", request.url));
    return NextResponse.next();
  }

  if (!loggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (RESTRICTED_PATHS.some((p) => pathname.startsWith(p)) && role === "kasir") {
    return NextResponse.redirect(new URL("/kasir", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
