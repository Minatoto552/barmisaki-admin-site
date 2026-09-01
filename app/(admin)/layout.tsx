import { requireChatGPTUser } from '../chatgpt-auth';
import { requireAdmin } from '@/db/service';
import { AdminShell } from '@/components/admin-shell';
export const dynamic = 'force-dynamic';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) { const user = await requireChatGPTUser('/dashboard'); await requireAdmin(); return <AdminShell user={user}>{children}</AdminShell>; }
