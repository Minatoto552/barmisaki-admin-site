import { env } from 'cloudflare:workers';
import { listCasts, listNews, requireAdmin } from '@/db/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { const user = await requireAdmin(); return Response.json({ user, casts: await listCasts(), news: await listNews(false) }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as Record<string, any>;
    const now = new Date().toISOString();
    if (body.action === 'cast:create') {
      const cast = validateCast(body.data); const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO casts (id,name,category,role,image_url,x_url,favorite,message,is_pickup,pickup_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,0,NULL,?,?)').bind(id, cast.name, cast.category, cast.role, cast.imageUrl, cast.xUrl, cast.favorite, cast.message, now, now).run();
      return Response.json({ ok: true, id, message: 'キャストを追加しました。' });
    }
    if (body.action === 'cast:update') {
      const cast = validateCast(body.data); requireId(body.id);
      await env.DB.prepare('UPDATE casts SET name=?,category=?,role=?,image_url=?,x_url=?,favorite=?,message=?,updated_at=? WHERE id=?').bind(cast.name, cast.category, cast.role, cast.imageUrl, cast.xUrl, cast.favorite, cast.message, now, body.id).run();
      return Response.json({ ok: true, message: '変更を保存しました。' });
    }
    if (body.action === 'cast:delete') {
      requireId(body.id); await env.DB.prepare('DELETE FROM casts WHERE id=?').bind(body.id).run();
      return Response.json({ ok: true, message: 'キャストを削除しました。' });
    }
    if (body.action === 'news:create') {
      const item = validateNews(body.data); const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO news (id,title,date,thumbnail_url,content,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(id, item.title, item.date, item.thumbnailUrl, item.content, item.published ? 1 : 0, now, now).run();
      return Response.json({ ok: true, id, message: item.published ? 'お知らせを公開しました。' : 'お知らせを保存しました。' });
    }
    if (body.action === 'news:update') {
      const item = validateNews(body.data); requireId(body.id);
      await env.DB.prepare('UPDATE news SET title=?,date=?,thumbnail_url=?,content=?,published=?,updated_at=? WHERE id=?').bind(item.title, item.date, item.thumbnailUrl, item.content, item.published ? 1 : 0, now, body.id).run();
      return Response.json({ ok: true, message: '変更を保存しました。' });
    }
    if (body.action === 'news:delete') {
      requireId(body.id); await env.DB.prepare('DELETE FROM news WHERE id=?').bind(body.id).run();
      return Response.json({ ok: true, message: 'お知らせを削除しました。' });
    }
    if (body.action === 'pickup:update') {
      const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];
      if (ids.length > 8) return Response.json({ error: 'PICK UPに登録できるのは最大8名です。' }, { status: 400 });
      const statements = [env.DB.prepare('UPDATE casts SET is_pickup=0,pickup_order=NULL,updated_at=?').bind(now), ...ids.map((id: string, index: number) => env.DB.prepare('UPDATE casts SET is_pickup=1,pickup_order=?,updated_at=? WHERE id=?').bind(index + 1, now, id))];
      await env.DB.batch(statements); return Response.json({ ok: true, message: 'PICK UPを変更しました。' });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) { return apiError(error); }
}

function validateCast(value: any) {
  if (!value || typeof value.name !== 'string' || !value.name.trim() || typeof value.category !== 'string' || !value.category.trim()) throw new Error('名前と所属は必須です。');
  return { name: value.name.trim(), category: value.category.trim(), role: String(value.role || 'CAST').trim(), imageUrl: String(value.imageUrl || ''), xUrl: String(value.xUrl || ''), favorite: String(value.favorite || ''), message: String(value.message || '') };
}
function validateNews(value: any) {
  if (!value || typeof value.title !== 'string' || !value.title.trim() || typeof value.date !== 'string' || !value.date) throw new Error('タイトルと投稿日は必須です。');
  return { title: value.title.trim(), date: value.date, thumbnailUrl: String(value.thumbnailUrl || ''), content: String(value.content || ''), published: Boolean(value.published) };
}
function requireId(id: unknown): asserts id is string { if (typeof id !== 'string' || !id) throw new Error('対象IDがありません。'); }
function apiError(error: unknown) { if (error instanceof Response) return error; return Response.json({ error: error instanceof Error ? error.message : '保存に失敗しました。もう一度お試しください。' }, { status: 400 }); }
