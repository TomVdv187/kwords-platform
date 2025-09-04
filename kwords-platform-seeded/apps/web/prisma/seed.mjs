// apps/web/prisma/seed.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(){
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

  await prisma.creative.upsert({
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

  await prisma.sponsorship.upsert({
    where: { campaignId_keywordId: { campaignId: campaign.id, keywordId: keyword.id } },
    update: { bidCpmCents: 300 },
    create: { campaignId: campaign.id, keywordId: keyword.id, bidCpmCents: 300, maxCpcCents: 50 }
  });
}

main().then(async () => {
  await prisma.$disconnect();
  console.log('Seed complete.');
}).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
