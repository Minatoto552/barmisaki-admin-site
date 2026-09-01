import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
export const metadata: Metadata = { title: 'BarMisaki Admin', description: 'BarMisaki運営者専用管理サイト', robots: { index: false, follow: false } };
const speculationRules = {
  prerender: [{ source: 'list', urls: ['/dashboard', '/cast', '/news', '/pickup'], eagerness: 'moderate' }],
  prefetch: [{ source: 'list', urls: ['/dashboard', '/cast', '/news', '/pickup'], eagerness: 'eager' }],
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><head><script type="speculationrules" dangerouslySetInnerHTML={{ __html: JSON.stringify(speculationRules) }} /></head><body className={inter.variable}>{children}</body></html>; }
