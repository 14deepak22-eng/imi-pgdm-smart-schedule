import type { EventCategory } from '@/types/events';
import type { LucideIcon } from 'lucide-react';
import {
  Sun,
  GraduationCap,
  Wrench,
  Presentation,
  Mic2,
  Briefcase,
  Bell,
  CalendarDays,
} from 'lucide-react';

interface CategoryMeta {
  label: string;
  tone: 'amber' | 'teal' | 'muted' | 'danger';
  icon: LucideIcon;
}

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  holiday: { label: 'Holiday', tone: 'teal', icon: Sun },
  exam: { label: 'Exam', tone: 'danger', icon: GraduationCap },
  workshop: { label: 'Workshop', tone: 'amber', icon: Wrench },
  seminar: { label: 'Seminar', tone: 'amber', icon: Presentation },
  'guest-lecture': { label: 'Guest Lecture', tone: 'teal', icon: Mic2 },
  placement: { label: 'Placement', tone: 'danger', icon: Briefcase },
  notice: { label: 'Notice', tone: 'muted', icon: Bell },
  other: { label: 'Event', tone: 'muted', icon: CalendarDays },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_META) as EventCategory[];
