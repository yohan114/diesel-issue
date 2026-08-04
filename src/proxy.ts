import { NextResponse, type NextRequest } from "next/server";

// Coarse gate based on cookie presence (no DB/JWT work in the edge runtime).
// Real authorization happens server-side in the (app) layout and every action.
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has("session");
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === "/login";

  if (!hasSession && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (hasSession && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Protect pages; exclude API routes (they self-authorize) and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
