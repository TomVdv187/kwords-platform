import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  if (!process.env.APP_SECRET || token !== process.env.APP_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Idempotent seed
  const site = await prisma.publisherSite.upsert({
    where: { siteKey: 'demo-site' },
    update: {},
    create: { siteKey: 'demo-site', domain: 'example.com', name: 'Demo Site' }
  });

  const keyword = await prisma.keyword.upsert({
    where: { word_siteId: { word: 'Platform', siteId: site.id } },
    update: {},
    create: { word: 'Platform', siteId: site.id }
  });

  const campaign = await prisma.campaign.upsert({
    where: { id: 'demo-camp' },
    update: {},
    create: { id: 'demo-camp', name: 'Demo Campaign', advertiser: 'DemoCo', dailyBudgetCents: 5000, status: 'ACTIVE' }
  });

  const creative = await prisma.creative.upsert({
    where: { id: 'demo-creative' },
    update: {},
    create: {
      id: 'demo-creative',
      campaignId: campaign.id,
      url: 'https://example.com',
      title: 'Discover DemoCo',
      description: 'Contextual sponsorship around “Platform”.',
      ctaText: 'Learn more'
    }
  });

  const sponsorship = await prisma.sponsorship.upsert({
    where: { campaignId_keywordId: { campaignId: campaign.id, keywordId: keyword.id } },
    update: { bidCpmCents: 300 },
    create: { campaignId: campaign.id, keywordId: keyword.id, bidCpmCents: 300, maxCpcCents: 50 }
  });

  return NextResponse.json({ ok: true, site, keyword, campaign, creative, sponsorship });
}
