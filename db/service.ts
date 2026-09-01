import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';

const seedCasts = [
  ['misaki', '海咲', '1期生', 'OWNER', '', 'https://x.com/BarMisaki_VRC', 'おしゃべり・夜の時間', 'あなたに会える夜を、楽しみにしています。', 1, 1],
  ['luna', 'るな', '1期生', 'CAST', '', '', '音楽・カクテル', 'ゆっくりお話ししましょう。', 1, 2],
  ['yui', 'ゆい', '2期生 花組', 'CAST', '', '', 'かわいいもの', '素敵な夜を一緒に。', 1, 3],
  ['noa', 'のあ', '2期生 花組', 'CAST', '', '', '写真・ワールド巡り', '初めての方も大歓迎です。', 1, 4],
  ['mio', 'みお', '2期生 月組', 'CAST', '', '', 'ゲーム・映画', '今夜の思い出をつくりましょう。', 0, null],
  ['rei', 'れい', '2期生 月組', 'CAST', '', '', 'ダンス', 'お会いできるのを待っています。', 0, null],
  ['staff', '運営スタッフ', 'スタッフ', 'STAFF', '', '', '皆さまの笑顔', '安心して楽しめる夜をお届けします。', 0, null],
] as const;

const seedNews = [
  ['opening', '次回営業日のお知らせ', '2026-08-28', '次回の営業日については、公式Xで最新情報をご案内します。皆さまのご来店をお待ちしています。'],
  ['cast', '新キャストのご紹介', '2026-08-16', 'BarMisakiに新しい海咲ちゃんが加わりました。キャストページからプロフィールをご覧ください。'],
  ['recruit', 'スタッフ募集について', '2026-08-02', '募集状況と応募方法は、RECRUITページからご確認いただけます。'],
  ['guide', 'ご来店前のお願い', '2026-07-20', '快適なイベント運営のため、参加前に店舗ルールをご確認ください。'],
  ['world', '店内ワールドを更新しました', '2026-07-08', 'さらに心地よい夜を過ごしていただけるよう、店内ワールドをアップデートしました。'],
  ['thanks', 'ご来店ありがとうございました', '2026-06-28', '先日の営業にもたくさんのご応募、ご来店をいただきありがとうございました。'],
] as const;

export async function ensureSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS admin_users (user_id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL, created_at TEXT NOT NULL)'),
    db.prepare("CREATE TABLE IF NOT EXISTS casts (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, role TEXT NOT NULL, image_url TEXT NOT NULL DEFAULT '', x_url TEXT NOT NULL DEFAULT '', favorite TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '', is_pickup INTEGER NOT NULL DEFAULT 0, pickup_order INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL, thumbnail_url TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_casts_category ON casts(category)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_casts_pickup_order ON casts(is_pickup, pickup_order)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_news_published_date ON news(published, date)'),
  ]);
  await seedIfEmpty();
}

async function seedIfEmpty() {
  const db = env.DB;
  const castCount = await db.prepare('SELECT COUNT(*) AS count FROM casts').first<{ count: number }>();
  if (!castCount?.count) {
    const now = new Date().toISOString();
    await db.batch(seedCasts.map((row) => db.prepare('INSERT INTO casts (id,name,category,role,image_url,x_url,favorite,message,is_pickup,pickup_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(...row, now, now)));
  }
  const newsCount = await db.prepare('SELECT COUNT(*) AS count FROM news').first<{ count: number }>();
  if (!newsCount?.count) {
    const now = new Date().toISOString();
    await db.batch(seedNews.map((row) => db.prepare('INSERT INTO news (id,title,date,thumbnail_url,content,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(row[0], row[1], row[2], '', row[3], 1, now, now)));
  }
  await db.prepare('PRAGMA optimize').run();
}

export async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user) throw new Response('Authentication required', { status: 401 });
  await ensureSchema();
  const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM admin_users').first<{ count: number }>();
  if (!count?.count) await env.DB.prepare('INSERT OR IGNORE INTO admin_users (user_id,email,created_at) VALUES (?,?,?)').bind(user.userId, user.email, new Date().toISOString()).run();
  const admin = await env.DB.prepare('SELECT user_id FROM admin_users WHERE user_id = ?').bind(user.userId).first();
  if (!admin) throw new Response('Forbidden', { status: 403 });
  return user;
}

export async function listCasts() {
  await ensureSchema();
  const result = await env.DB.prepare('SELECT id,name,category,role,image_url AS imageUrl,x_url AS xUrl,favorite,message,is_pickup AS isPickup,pickup_order AS pickupOrder,created_at AS createdAt,updated_at AS updatedAt FROM casts ORDER BY category,name').all();
  return result.results.map((row: any) => ({ ...row, isPickup: Boolean(row.isPickup) }));
}

export async function listNews(publishedOnly = false) {
  await ensureSchema();
  const sql = `SELECT id,title,date,thumbnail_url AS thumbnailUrl,content,published,created_at AS createdAt,updated_at AS updatedAt FROM news ${publishedOnly ? 'WHERE published = 1' : ''} ORDER BY date DESC, created_at DESC`;
  const result = await env.DB.prepare(sql).all();
  return result.results.map((row: any) => ({ ...row, published: Boolean(row.published) }));
}
