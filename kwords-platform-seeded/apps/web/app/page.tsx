import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Keyword Sponsorship Platform — MVP</h1>
      <p className="mt-4">Welcome! This is a minimal, Vercel-ready platform that highlights keywords and runs a contextual auction.</p>

      <h2 className="mt-8 text-xl font-semibold">Quick checks</h2>
      <ul className="list-disc ml-6 mt-2">
        <li><Link href="/.well-known/ads.txt" className="text-blue-600 underline">/.well-known/ads.txt</Link></li>
        <li><Link href="/.well-known/sellers.json" className="text-blue-600 underline">/.well-known/sellers.json</Link></li>
        <li><Link href="/.well-known/sdk-publisher.js" className="text-blue-600 underline">/.well-known/sdk-publisher.js</Link></li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">How to test</h2>
      <ol className="list-decimal ml-6 mt-2">
        <li>Seed a <em>PublisherSite</em>, a <em>Keyword</em>, a <em>Campaign</em>, a <em>Creative</em>, and a <em>Sponsorship</em> via Prisma Studio.</li>
        <li>Open any page with capitalized words; the SDK will replace one occurrence with a sponsored link.</li>
      </ol>

      <p className="mt-8 text-sm opacity-70">See CLAUDE.md in the repo for full deployment & integrations.</p>
    </main>
  );
}
