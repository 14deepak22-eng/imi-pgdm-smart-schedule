'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, X, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
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
const REPROMPT_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

export function FeedbackPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [poppedStar, setPoppedStar] = useState<number | null>(null);
  const [glowPulse, setGlowPulse] = useState(false);

  // Drag-to-rate star row
  const starRowRef = useRef<HTMLDivElement | null>(null);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isDraggingRef = useRef(false);
  const startStarRef = useRef<number | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(POPUP_SEEN_KEY);
      if (!seen) {
        // First visit — set timestamp silently, no popup yet
        localStorage.setItem(POPUP_SEEN_KEY, String(Date.now()));
      } else if (seen !== '1') {
        // Has a timestamp (dismissed or first visit) — check if 2 days passed
        const lastShownTime = parseInt(seen, 10);
        const dueForReprompt = Date.now() - lastShownTime >= REPROMPT_INTERVAL_MS;
        if (dueForReprompt) {
          const timer = setTimeout(() => setOpen(true), 2000);
          return () => clearTimeout(timer);
        }
      }
      // seen === '1' means already rated — never show again
    } catch {
      // storage unavailable — skip
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          rating: d.data().rating,
          comment: d.data().comment,
        })),
      );
    });
    return () => unsub();
  }, []);

  const closePopup = () => {
    setOpen(false);
    try {
      // Store timestamp so we can re-prompt after 2 days
      const current = localStorage.getItem(POPUP_SEEN_KEY);
      if (current !== '1') {
        localStorage.setItem(POPUP_SEEN_KEY, String(Date.now()));
      }
    } catch { /* ignore */ }
  };

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
      await addDoc(collection(db, 'reviews'), {
        name: name.trim() || 'Anonymous',
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
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

  return (
    <>
      {/* Floating button — always visible */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
      >
        <Star size={14} className="text-amber-400" fill="currentColor" />
        Rate Us
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 text-white transition-shadow duration-300"
            style={{
              boxShadow: glowPulse
                ? '0 0 0 1px rgba(240,168,60,0.45), 0 0 20px rgba(240,168,60,0.15)'
                : '0 0 0 1px rgba(240,168,60,0.15)',
            }}
          >
            <div className="mb-5 flex items-start justify-between">
              <h2 className="text-lg font-semibold">Rate the dashboard</h2>
              <button
                onClick={closePopup}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="py-6 text-center">
                <Sparkles className="mx-auto mb-2 text-amber-400" size={28} />
                <p className="mb-4 text-lg">Thanks for your feedback!</p>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Close
                </button>
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
                    {submitting ? 'Submitting...' : 'Submit review'}
                  </button>
                  <button
                    onClick={closePopup}
                    className="flex-1 rounded-lg border border-white/15 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Maybe later
                  </button>
                </div>

                {reviews.length > 0 && (
                  <p className="mt-3.5 text-center text-xs text-gray-500">
                    {reviews.length} students rated so far — avg{' '}
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}{' '}
                    <Star size={12} className="inline text-amber-400" fill="currentColor" />
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
