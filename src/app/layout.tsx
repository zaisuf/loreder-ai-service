import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'Loreder AI Aggregator | High Performance AI Router & Gateway',
  description: 'AI Aggregator service powered by OpenCode Zen free models with OpenAI compatible API endpoints and live streaming playground.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body className="bg-[#070b14] text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
