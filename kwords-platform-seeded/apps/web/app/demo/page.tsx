export const dynamic = 'force-dynamic';

export default function Demo() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Demo Page</h1>
      <p className="mt-4">
        This page includes the publisher SDK. Words like <strong>Platform</strong> may get sponsored.
      </p>
      <script
        async
        src={`${appUrl || ''}/.well-known/sdk-publisher.js`}
        data-site="demo-site"
      />
      <p className="mt-8">
        If nothing highlights, run the seeding:
        <code className="ml-2 px-2 py-1 bg-gray-200 rounded">/api/admin/seed?token=APP_SECRET</code>
        (replace with your real APP_SECRET), then refresh this page.
      </p>
    </main>
  );
}
