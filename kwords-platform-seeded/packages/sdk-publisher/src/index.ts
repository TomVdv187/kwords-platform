// See the server-served version under /.well-known/sdk-publisher.js for a no-build include.
// This package mirrors the logic for npm/cdn distribution if desired.

export function initPublisherSDK(opts: { appUrl: string; siteKey: string; }){
  const APP_URL = opts.appUrl;
  const SITE_KEY = opts.siteKey;

  function walk(node: Node){
    let child: any = (node as any).firstChild, next;
    while(child){
      next = child.nextSibling;
      if(child.nodeType === 3) processText(child as Text);
      else walk(child as Node);
      child = next;
    }
  }

  function processText(textNode: Text){
    const text = textNode.nodeValue || '';
    const m = text.match(/\b([A-Z][a-z]{3,})\b/);
    if(!m) return;
    const kw = m[1];
    auction(kw, textNode);
  }

  async function auction(keyword: string, textNode: Text){
    const resp = await fetch(APP_URL + '/api/auction', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        url: location.href,
        siteKey: SITE_KEY,
        keyword: keyword
      })
    });
    const data = await resp.json();
    if(!data.fill) return;
    const span = document.createElement('span');
    const a = document.createElement('a');
    a.href = data.fill.clickUrl;
    a.target = '_blank';
    a.rel = 'sponsored noopener';
    a.style.textDecoration = 'underline dashed';
    a.title = data.fill.title + ' — ' + data.fill.ctaText;
    a.textContent = keyword;
    span.appendChild(a);
    (textNode.parentNode as any).replaceChild(span, textNode);
    navigator.sendBeacon(APP_URL + '/api/events', JSON.stringify({type:'IMPRESSION', campaignId: data.fill.campaignId, sponsorshipId: data.fill.sponsorshipId, url: location.href }));
    a.addEventListener('click', function(){
      navigator.sendBeacon(APP_URL + '/api/events', JSON.stringify({type:'CLICK', campaignId: data.fill.campaignId, sponsorshipId: data.fill.sponsorshipId, url: location.href }));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>walk(document.body));
  else walk(document.body);
}
