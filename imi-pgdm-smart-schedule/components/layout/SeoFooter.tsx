import { CREATOR_CREDIT } from '@/lib/sheet/constants';

export function SeoFooter() {
  return (
    <footer className="border-border text-muted mt-8 border-t px-4 py-6 text-xs leading-relaxed">
      <div className="mx-auto max-w-6xl space-y-2">
        <h2 className="text-foreground font-display text-sm font-bold tracking-wide uppercase">
          IMI Schedule — IMI Bhubaneswar PGDM Timetable
        </h2>
        <p>
          IMI PGDM Smart Schedule is a live class schedule and timetable app built for the IMI
          Bhubaneswar PGDM batch. Check today&apos;s classes, next-class countdown, weekly
          timetable, campus events, and notices — updated automatically from the official batch
          sheet, section-wise (A/B/C), so you always have the current IMI schedule on hand.
        </p>
        <p className="text-[11px]">{CREATOR_CREDIT}</p>
      </div>
    </footer>
  );
}
