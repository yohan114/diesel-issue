import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Role } from "./enums";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 8; // 8 hours
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me-please-set-AUTH_SECRET",
);

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 11);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export type SessionClaims = {
  sub: string;
  role: Role;
  name: string;
  username: string;
};

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, name: claims.name, username: claims.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function setSessionCookie(token: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function readSessionClaims(): Promise<SessionClaims | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: String(payload.sub),
      role: payload.role as Role,
      name: String(payload.name),
      username: String(payload.username),
    };
  } catch {
    return null;
  }
}
