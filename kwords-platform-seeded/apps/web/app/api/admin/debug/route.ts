import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    appSecret: process.env.APP_SECRET || null
  });
}

