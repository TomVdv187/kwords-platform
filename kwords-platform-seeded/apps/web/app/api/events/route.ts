import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { type, campaignId, sponsorshipId, url } = body || {};
  if (!type) return NextResponse.json({ ok: false, error: 'Missing type' }, { status: 400 });

  await prisma.event.create({
    data: {
      type,
      campaignId: campaignId || null,
      sponsorshipId: sponsorshipId || null,
      url: url || null,
      ip: req.headers.get('x-forwarded-for') || req.ip || '',
      userAgent: req.headers.get('user-agent') || '',
    }
  });

  // TODO: budget pacing adjustments / capping
  return NextResponse.json({ ok: true });
}
