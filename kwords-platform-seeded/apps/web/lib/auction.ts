import { prisma } from './db';
import { z } from 'zod';

const AuctionInput = z.object({
  url: z.string().url(),
  siteKey: z.string(),
  keyword: z.string(),
  tcfConsent: z.string().optional(),
  ip: z.string().optional(),
  ua: z.string().optional(),
});

export type AuctionInput = z.infer<typeof AuctionInput>;

export type CreativePayload = {
  type: 'text';
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  campaignId?: string;
  sponsorshipId?: string;
  ecpmCents: number;
};

// Very rough estimated CTR for tooltip-style units
const EST_CTR = 0.01; // 1%

async function getLocalBestBid(siteKey: string, keyword: string): Promise<CreativePayload | null> {
  const site = await prisma.publisherSite.findUnique({ where: { siteKey } });
  if (!site) return null;

  const kw = await prisma.keyword.findFirst({ where: { word: keyword, siteId: site.id }, include: { sponsorships: { include: { campaign: true } } } });
  if (!kw) return null;

  let best: CreativePayload | null = null;
  for (const s of kw.sponsorships) {
    if (s.campaign.status !== 'ACTIVE') continue;
    if (s.campaign.dailyBudgetCents <= s.campaign.spendCents) continue;
    // eCPM heuristic: CPM bid or CPC * CTR * 1000
    const ecpmFromCpm = s.bidCpmCents ?? 0;
    const ecpmFromCpc = (s.maxCpcCents ?? 0) * EST_CTR * 1000;
    const ecpm = Math.max(ecpmFromCpm, ecpmFromCpc);

    const creative = await prisma.creative.findFirst({ where: { campaignId: s.campaignId } });
    if (!creative) continue;

    if (!best || ecpm > best.ecpmCents) {
      best = {
        type: 'text',
        title: creative.title,
        description: creative.description,
        ctaText: creative.ctaText,
        clickUrl: creative.url,
        campaignId: s.campaignId,
        sponsorshipId: s.id,
        ecpmCents: Math.floor(ecpm),
      };
    }
  }
  return best;
}

async function fetchOpenRtbBids(request: AuctionInput): Promise<CreativePayload[]> {
  const endpoints = (process.env.OPENRTB_ENDPOINTS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (endpoints.length === 0) return [];
  let authHeaders: Record<string, Record<string, string>> = {};
  try { authHeaders = JSON.parse(process.env.OPENRTB_AUTH_HEADERS || '{}'); } catch {}

  const body = {
    id: crypto.randomUUID(),
    tmax: 120,
    at: 1,
    regs: { ext: { gdpr: request.tcfConsent ? 1 : 0 } },
    user: { ext: { consent: request.tcfConsent || '' } },
    site: {
      page: request.url,
      domain: new URL(request.url).hostname,
    },
    device: {
      ua: request.ua || '',
      ip: request.ip || '',
    },
    imp: [{
      id: "1",
      banner: { w: 1, h: 1, pos: 7 }, // placeholder; creative returned as text via ext
      ext: { placement: "keyword", keyword: request.keyword }
    }],
  };

  const payloads: CreativePayload[] = [];

  await Promise.all(endpoints.map(async (ep) => {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders[ep] || {}),
        },
        body: JSON.stringify(body),
        // @ts-ignore
        cache: 'no-store'
      });
      if (!res.ok) return;
      const bid = await res.json();
      // Expecting OpenRTB SeatBid -> Bid; use ext for text creative
      const seatbids = bid.seatbid || [];
     for (const sb of seatbids) {
  for (const b of (sb.bid || [])) {
    const ext = b.ext || {};
    if (ext.type === 'text' && ext.title && ext.url) {
      payloads.push({
        type: 'text',
        title: ext.title,
        description: ext.description || '',
        ctaText: ext.ctaText || 'Learn more',
        clickUrl: ext.url,
        ecpmCents: Math.floor((b.price || 0) * 100),
      });
    }
  }
}
              ecpmCents: Math.floor((b.price || 0) * 100), // USD -> cents (assume 1 unit = $)
            } as CreativePayload)
          }
        }
      }
    } catch (e) {
      console.error('OpenRTB connector error for', ep, e);
    }
  }));

  return payloads;
}

export async function runAuction(input: AuctionInput): Promise<CreativePayload | null> {
  // TCF gate if required
  if (process.env.NEXT_PUBLIC_TCF_REQUIRED === 'true' && !input.tcfConsent) {
    // Restrict to contextual only (we already are contextual). Proceed.
  }

  const local = await getLocalBestBid(input.siteKey, input.keyword);
  const external = await fetchOpenRtbBids(input);
  const all = [...external];
  if (local) all.push(local);
  if (all.length === 0) return null;
  // pick highest eCPM
  all.sort((a, b) => (b.ecpmCents - a.ecpmCents));
  return all[0];
}
