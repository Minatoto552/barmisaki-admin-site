'use client';

import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type CastRecord = { id: string; name: string; category: string; role: string; imageUrl: string; xUrl: string; favorite: string; message: string; isPickup: boolean; pickupOrder: number | null; };
export type NewsRecord = { id: string; title: string; date: string; thumbnailUrl: string; content: string; published: boolean; };

export function useAdminData() {
  const [data, setData] = useState<{ casts: CastRecord[]; news: NewsRecord[] } | null>(null); const [error, setError] = useState('');
  const reload = async () => { try { const response = await fetch('/api/admin/data', { cache: 'no-store' }); if (!response.ok) throw new Error('データを読み込めませんでした。'); setData(await response.json()); } catch (e) { setError(e instanceof Error ? e.message : '読み込みに失敗しました。'); } };
  useEffect(() => { void reload(); }, []);
  return { data, error, reload };
}

export async function mutateAdmin(payload: unknown) {
  const response = await fetch('/api/admin/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json() as { message?: string; error?: string }; if (!response.ok) throw new Error(result.error || '保存に失敗しました。もう一度お試しください。'); return result;
}

export function PageHeading({ eyebrow, title, note, action }: { eyebrow: string; title: string; note: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-violet-600">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-slate-500">{note}</p></div>{action}</div>;
}

export function Toast({ message, kind = 'success', onClose }: { message: string; kind?: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const timer = setTimeout(onClose, 3600); return () => clearTimeout(timer); }, [onClose]);
  return <div className={`fixed right-5 top-5 z-[100] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl ${kind === 'success' ? 'border-emerald-200 bg-white text-emerald-700' : 'border-rose-200 bg-white text-rose-700'}`} role="status"><span className={`size-2 rounded-full ${kind === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />{message}<button onClick={onClose}><X size={16} /></button></div>;
}

export function LoadingState() { return <div className="admin-card mt-8 flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={20} /> 読み込み中...</div>; }

export function FormModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => { const warning = (event: BeforeUnloadEvent) => { event.preventDefault(); }; window.addEventListener('beforeunload', warning); return () => window.removeEventListener('beforeunload', warning); }, []);
  return <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-sm sm:p-8"><div className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="閉じる"><X /></button></div>{children}</div></div>;
}

export function ImageUpload({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const [preview, setPreview] = useState(value); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => setPreview(value), [value]);
  const upload = async (file?: File) => { if (!file) return; const local = URL.createObjectURL(file); setPreview(local); setBusy(true); setError(''); try { const form = new FormData(); form.append('file', file); const response = await fetch('/api/admin/upload', { method: 'POST', body: form }); const data = await response.json() as { url?: string; error?: string }; if (!response.ok || !data.url) throw new Error(data.error || 'アップロードに失敗しました。'); onChange(data.url); setPreview(data.url); } catch (e) { setError(e instanceof Error ? e.message : 'アップロードに失敗しました。'); } finally { setBusy(false); URL.revokeObjectURL(local); } };
  return <div><span className="field-label">{label}</span><div className="flex items-center gap-4"><div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">{preview ? <img src={preview} alt="プレビュー" className="h-full w-full object-cover" /> : <ImagePlus className="text-slate-300" />}</div><div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ImagePlus size={16} />{busy ? 'アップロード中...' : '画像を選択'}<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => void upload(e.target.files?.[0])} /></label><p className="mt-2 text-xs text-slate-400">PNG / JPG / WebP、10MBまで</p>{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}</div></div></div>;
}
