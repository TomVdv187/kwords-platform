import { NextRequest, NextResponse } from 'next/server';
import { runAuction } from '@/lib/auction';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { url, siteKey, keyword, tcfConsent } = body || {};
  if (!url || !siteKey || !keyword) {
    return NextResponse.json({ error: 'Missing url/siteKey/keyword' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') || req.ip || '';
  const ua = req.headers.get('user-agent') || '';

  const winner = await runAuction({ url, siteKey, keyword, tcfConsent, ip, ua });
  if (!winner) return NextResponse.json({ fill: null });

  // Log impression and soft spend increment (CPM-based estimate)
  await prisma.event.create({
    data: {
      type: 'IMPRESSION',
      campaignId: winner.campaignId || null,
      sponsorshipId: winner.sponsorshipId || null,
      url,
      ip,
      userAgent: ua,
    }
  });

  return NextResponse.json({ fill: winner });
}
