import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "JSFuck Quiz & Generator",
  description: "Generate JSFuck expressions and practice reading them.",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/generate", label: "Generate" },
  { href: "/quiz", label: "Quiz" },
  { href: "/patterns", label: "Patterns" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="border-b border-[var(--line)] bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="text-base font-semibold tracking-normal text-[var(--foreground)]">
              JSFuck Quiz & Generator
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
