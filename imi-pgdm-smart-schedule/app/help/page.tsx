'use client';

import { Mail } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { SUPPORT_EMAIL } from '@/lib/sheet/constants';

const MAIL_SUBJECT = 'IMI PGDM Smart Schedule — Help & Support';
const MAIL_BODY =
  "Hi Deepak,\n\nI'm having an issue with the Smart Schedule app:\n\n[Describe what happened here]\n";

const MAILTO_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  MAIL_SUBJECT,
)}&body=${encodeURIComponent(MAIL_BODY)}`;

export default function HelpPage() {
  return (
    <>
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
            Help & Support
          </h1>
          <p className="text-muted text-sm">
            Found a bug, missing class, or something that looks off? Send a mail and it&apos;ll
            go straight to the person who built this app.
          </p>
        </div>

        <Card className="flex flex-col items-start gap-4 p-5">
          <div className="border-accent bg-accent/10 flex h-12 w-12 items-center justify-center rounded-2xl border-2">
            <Mail className="text-accent h-6 w-6" aria-hidden />
          </div>

          <div>
            <h2 className="font-display text-lg font-bold tracking-wide uppercase">
              Contact
            </h2>
            <p className="text-muted mt-1 text-sm">
              This opens your email app with a message already addressed and started — just
              describe what&apos;s wrong and hit send.
            </p>
          </div>

          <a
            href={MAILTO_HREF}
            className="bg-accent text-background border-foreground shadow-[3px_3px_0_0_var(--color-accent-2)] hover:brightness-110 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none inline-flex items-center justify-center gap-2 rounded-lg border-2 px-3.5 py-2 text-sm font-bold tracking-wide uppercase transition-all duration-150 focus-visible:ring-accent focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Mail className="h-4 w-4" />
            Mail me
          </a>

          <p className="text-muted text-xs">
            Or email directly:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </Card>
      </main>
    </>
  );
}
