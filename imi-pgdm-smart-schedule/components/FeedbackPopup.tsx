'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Star, X, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
}

const POPUP_SEEN_KEY = 'pgdm-feedback-popup-seen';
// This visitor's own review (id + a copy of its content), kept on the device
// so it can be shown instantly after a refresh — no waiting for Firestore.
const MY_REVIEW_KEY = 'pgdm-my-review-id';
// Show the popup exactly once per visitor, this long after their first visit.
const SHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

function readMine(): Review | null {
  try {
    const raw = localStorage.getItem(MY_REVIEW_KEY);
    if (!raw) return null;
    if (raw.startsWith('{')) {
      const p = JSON.parse(raw);
      if (p && typeof p.id === 'string') {
        return {
          id: p.id,
          name: typeof p.name === 'string' ? p.name : '',
          rating: typeof p.rating === 'number' ? p.rating : 0,
          comment: typeof p.comment === 'string' ? p.comment : '',
        };
      }
      return null;
    }
    // Older versions stored just the id — content fills in from Firestore.
    return { id: raw, name: '', rating: 0, comment: '' };
  } catch {
    return null;
  }
}

function writeMine(review: Review | null) {
  try {
    if (review) localStorage.setItem(MY_REVIEW_KEY, JSON.stringify(review));
    else localStorage.removeItem(MY_REVIEW_KEY);
  } catch { /* ignore */ }
}

export function FeedbackPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  // null = still loading from Firestore
  const [reviews, setReviews] = useState<Review[] | null>(null);
  // This visitor's saved review. null = they haven't given feedback yet.
  const [mine, setMine] = useState<Review | null>(null);
  // true = showing the edit form for an existing review
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [poppedStar, setPoppedStar] = useState<number | null>(null);
  const [glowPulse, setGlowPulse] = useState(false);

  // Drag-to-rate star row
  const starRowRef = useRef<HTMLDivElement | null>(null);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isDraggingRef = useRef(false);
  const startStarRef = useRef<number | null>(null);
  const movedRef = useRef(false);

  // Load the saved review from this device right away on every page load,
  // so the button and popup already say "feedback given" after a refresh.
  useEffect(() => {
    queueMicrotask(() => setMine(readMine()));
  }, []);

  // Storage value: absent = brand-new visitor, a number = timestamp of the
  // first visit, '1' = popup already shown (or rated) — never show again.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(POPUP_SEEN_KEY);
      if (stored === '1') return;

      const firstVisit = stored ? parseInt(stored, 10) : NaN;
      if (Number.isNaN(firstVisit)) {
        // First visit — start the 7-day clock, no popup yet
        localStorage.setItem(POPUP_SEEN_KEY, String(Date.now()));
        return;
      }

      if (Date.now() - firstVisit >= SHOW_AFTER_MS) {
        const timer = setTimeout(() => {
          setOpen(true);
          // Mark as shown right away so it never appears again,
          // whether the user rates, dismisses, or just ignores it.
          try {
            localStorage.setItem(POPUP_SEEN_KEY, '1');
          } catch { /* ignore */ }
        }, 2000);
        return () => clearTimeout(timer);
      }
    } catch {
      // storage unavailable — skip
    }
  }, []);

  useEffect(() => {
    if (!open) return; // don't read Firestore for visitors who never see the popup
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: Review[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        rating: d.data().rating,
        comment: d.data().comment ?? '',
      }));
      setReviews(list);

      // Keep the saved copy of this visitor's review in sync with Firestore.
      const saved = readMine();
      if (!saved) return;
      const found = list.find((r) => r.id === saved.id);
      if (found) {
        writeMine(found);
        setMine((prev) =>
          prev &&
          prev.id === found.id &&
          prev.name === found.name &&
          prev.rating === found.rating &&
          prev.comment === found.comment
            ? prev
            : found,
        );
      } else if (!snap.metadata.fromCache && !snap.metadata.hasPendingWrites) {
        // The review was really removed from the database — forget it.
        writeMine(null);
        setMine(null);
        setEditing(false);
      }
    });
    return () => unsub();
  }, [open]);

  const closePopup = () => {
    setOpen(false);
    setEditing(false);
    setNotice(null);
  };

  const startEditing = () => {
    if (!mine) return;
    setName(mine.name === 'Anonymous' ? '' : mine.name);
    setRating(mine.rating);
    setComment(mine.comment);
    setNotice(null);
    setEditing(true);
  };

  const count = reviews?.length ?? 0;
  const average =
    reviews && count > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
      : null;

  // Golden sparkle burst from the clicked star
  const spawnSparkles = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.top + rect.height / 2}px`;
      el.style.width = '6px';
      el.style.height = '6px';
      el.style.borderRadius = '9999px';
      el.style.background = '#f7bd63';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '9999';
      el.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
      document.body.appendChild(el);

      const angle = ((Math.PI * 2) / 6) * i;
      const dist = 26 + Math.random() * 14;

      requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.cos(angle) * dist}px, ${
          Math.sin(angle) * dist
        }px) scale(0.3)`;
        el.style.opacity = '0';
      });

      setTimeout(() => el.remove(), 650);
    }
  };

  const applyRating = (star: number) => {
    setRating(star);
    setPoppedStar(star);
    const target = starRefs.current[star - 1];
    if (target) spawnSparkles(target);
    setGlowPulse(true);
    setTimeout(() => setGlowPulse(false), 400);
    setTimeout(() => setPoppedStar(null), 220);
  };

  // Given a pointer clientX, figure out which star (1-5) it's over
  const getStarFromClientX = (clientX: number) => {
    const el = starRowRef.current;
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const star = Math.ceil((x / rect.width) * 5);
    return Math.min(5, Math.max(1, star));
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    const star = getStarFromClientX(e.clientX);
    if (star !== startStarRef.current) movedRef.current = true;
    setHoverRating(star);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);

    const endStar = getStarFromClientX(e.clientX);

    if (!movedRef.current && rating === endStar) {
      // Tapped a star that's already selected — deselect it
      setRating(0);
    } else {
      applyRating(endStar);
    }
    setHoverRating(0);
    startStarRef.current = null;
  };

  const handleStarPointerDown = (star: number, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    movedRef.current = false;
    startStarRef.current = star;
    setHoverRating(star);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Clean up any dangling drag listeners if the component unmounts mid-drag
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim() || 'Anonymous',
        rating,
        comment: comment.trim(),
      };
      let saved: Review;
      if (mine) {
        // Update: overwrite this visitor's existing review (count stays the same)
        await updateDoc(doc(db, 'reviews', mine.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        saved = { id: mine.id, ...payload };
        setNotice('Feedback updated');
      } else {
        const ref = await addDoc(collection(db, 'reviews'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        saved = { id: ref.id, ...payload };
        setNotice('Thanks for your feedback!');
      }
      writeMine(saved);
      setMine(saved);
      setEditing(false);
      try {
        // '1' means rated — never auto-show again
        localStorage.setItem(POPUP_SEEN_KEY, '1');
      } catch { /* ignore */ }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;
  const showForm = !mine || editing;
  const title = !mine ? 'Rate the dashboard' : editing ? 'Update your feedback' : 'Your feedback';

  return (
    <>
      {/* Floating button — always visible */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
      >
        {mine ? (
          <>
            <Check size={14} className="text-emerald-300" />
            Feedback given
          </>
        ) : (
          <>
            <Star size={14} className="text-amber-400" fill="currentColor" />
            Rate Us
          </>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 text-white transition-shadow duration-300"
            style={{
              boxShadow: glowPulse
                ? '0 0 0 1px rgba(240,168,60,0.45), 0 0 20px rgba(240,168,60,0.15)'
                : '0 0 0 1px rgba(240,168,60,0.15)',
            }}
          >
            <div className="mb-5 flex items-start justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={closePopup}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Average rating + number of reviewers — always visible */}
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-200">
              <Star size={16} className="text-amber-400" fill="currentColor" />
              {reviews === null ? (
                <span className="text-gray-400">Loading ratings…</span>
              ) : count === 0 ? (
                <span>No ratings yet — be the first</span>
              ) : (
                <span>
                  <span className="font-medium text-white">{average}</span> average ·{' '}
                  {count} {count === 1 ? 'student' : 'students'} rated
                </span>
              )}
            </div>

            {!showForm && mine ? (
              /* Feedback already given — read-only until they tap Update feedback */
              <div className="text-center">
                {notice && (
                  <p className="mb-3 flex items-center justify-center gap-1.5 text-sm text-amber-400">
                    <Sparkles size={16} />
                    {notice}
                  </p>
                )}
                <p className="mb-3 flex items-center justify-center gap-1.5 text-sm text-emerald-300">
                  <Check size={16} />
                  You&apos;ve already given feedback
                </p>

                <div className="mb-1 flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={30}
                      color={star <= mine.rating ? '#f0a83c' : '#454850'}
                      fill={star <= mine.rating ? 'currentColor' : 'none'}
                      style={{
                        filter:
                          star <= mine.rating
                            ? 'drop-shadow(0 0 6px rgba(240,168,60,0.5))'
                            : 'none',
                      }}
                    />
                  ))}
                </div>
                <p className="mb-3 h-5 text-sm font-medium" style={{ color: '#f0a83c' }}>
                  {mine.rating ? RATING_LABELS[mine.rating] : 'Loading your review…'}
                </p>

                {mine.name && mine.name !== 'Anonymous' && (
                  <p className="mb-1 text-sm text-gray-300">{mine.name}</p>
                )}
                {mine.comment && (
                  <p className="mb-4 rounded-lg bg-white/5 p-3 text-left text-sm text-gray-300">
                    {mine.comment}
                  </p>
                )}

                <div className="mt-4 flex gap-2.5">
                  <button
                    onClick={startEditing}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95"
                  >
                    Update feedback
                  </button>
                  <button
                    onClick={closePopup}
                    className="flex-1 rounded-lg border border-white/15 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Stars — tap to rate, tap again to clear, or swipe across to rate */}
                <div
                  ref={starRowRef}
                  className="mb-1 flex justify-center gap-2"
                  style={{ touchAction: 'none' }}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= displayRating;
                    const popped = poppedStar === star;
                    return (
                      <button
                        key={star}
                        type="button"
                        ref={(el) => {
                          starRefs.current[star - 1] = el;
                        }}
                        onPointerDown={(e) => handleStarPointerDown(star, e)}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        className="p-0.5 transition-transform duration-300"
                        style={{
                          transform: popped ? 'scale(1.35)' : 'scale(1)',
                          transitionTimingFunction: 'cubic-bezier(.34,1.8,.64,1)',
                          touchAction: 'none',
                        }}
                      >
                        <Star
                          size={40}
                          color={filled ? (hoverRating ? '#f7bd63' : '#f0a83c') : '#454850'}
                          fill={filled ? 'currentColor' : 'none'}
                          style={{
                            filter: filled
                              ? 'drop-shadow(0 0 6px rgba(240,168,60,0.65))'
                              : 'none',
                            transition: 'color 0.2s ease, filter 0.2s ease',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                <p
                  className="mb-4 text-center text-sm font-medium transition-all duration-300"
                  style={{
                    color: '#f0a83c',
                    height: 16,
                    opacity: rating ? 1 : 0,
                    transform: rating ? 'translateY(0)' : 'translateY(-4px)',
                  }}
                >
                  {rating ? RATING_LABELS[rating] : ''}
                </p>

                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none transition-shadow focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(240,168,60,0.15)]"
                />

                <textarea
                  placeholder="Your comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm outline-none transition-shadow focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(240,168,60,0.15)]"
                  rows={3}
                />

                <div className="flex gap-2.5">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                  >
                    {submitting
                      ? mine
                        ? 'Updating...'
                        : 'Submitting...'
                      : mine
                        ? 'Save changes'
                        : 'Submit review'}
                  </button>
                  <button
                    onClick={mine ? () => setEditing(false) : closePopup}
                    className="flex-1 rounded-lg border border-white/15 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
                  >
                    {mine ? 'Cancel' : 'Maybe later'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
