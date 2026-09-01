import { env } from 'cloudflare:workers';
import { requireAdmin } from '@/db/service';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    await requireAdmin(); const form = await request.formData(); const file = form.get('file');
    if (!(file instanceof File)) return Response.json({ error: '画像を選択してください。' }, { status: 400 });
    if (!file.type.startsWith('image/')) return Response.json({ error: '画像ファイルのみアップロードできます。' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: '画像は10MB以下にしてください。' }, { status: 400 });
    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
    const key = `uploads/${crypto.randomUUID()}.${ext}`;
    await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    return Response.json({ url: `/api/files/${key}` });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: 'アップロードに失敗しました。' }, { status: 500 }); }
}
