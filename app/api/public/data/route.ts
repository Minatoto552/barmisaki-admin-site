import { listCasts, listNews } from '@/db/service';

export const dynamic = 'force-dynamic';
export async function GET() {
  try { return Response.json({ casts: await listCasts(), news: await listNews(true) }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } }); }
  catch { return Response.json({ error: 'Data unavailable' }, { status: 503 }); }
}
