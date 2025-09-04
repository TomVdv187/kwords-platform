export type OpenRtbEndpoint = {
  url: string;
  headers?: Record<string, string>;
};

export async function bidToAll(endpoints: OpenRtbEndpoint[], request: any) {
  const results: any[] = [];
  await Promise.all(endpoints.map(async (ep) => {
    try{
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(ep.headers || {}) },
        // @ts-ignore
        cache: 'no-store',
        body: JSON.stringify(request)
      });
      if(!res.ok) return;
      results.push(await res.json());
    }catch(e){
      // swallow to keep auction resilient
    }
  }));
  return results;
}
