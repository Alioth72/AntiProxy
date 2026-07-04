import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("name") || "Guest";
  const room = url.searchParams.get("room") || "*";

  const payload = {
    aud: "jitsi",
    iss: process.env.MEET_APP_ID,
    sub: process.env.MEET_DOMAIN,  
    room: room,
    exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // 2 hours expiry
    context: {
      user: { name: username }
    }
  };

  const token = jwt.sign(payload, process.env.MEET_SECRET!, {
    algorithm: "HS256",
  });

  return NextResponse.json({ token });
}
