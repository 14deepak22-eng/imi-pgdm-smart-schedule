'use client';

import { useEffect, useState } from 'react';
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

const POPUP_LAST_SHOWN_KEY = 'pgdm-feedback-popup-last-shown';
const HAS_RATED_KEY = 'pgdm-feedback-has-rated';
const REPROMPT_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export function FeedbackPopup() {
  const [open, setOpen] = useState(false);
  const [hasRated, setHasRated] = useState(true); // default true to avoid flash before check
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check on load: has this device already rated? If not, has it been
  // 2+ days since we last showed the popup?
  useEffect(() => {
    try {
      const rated = localStorage.getItem(HAS_RATED_KEY) === '1' || localStorage.getItem('pgdm-feedback-popup-seen') === '1';
      setHasRated(rated);

      if (!rated) {
        const lastShown = localStorage.getItem(POPUP_LAST_SHOWN_KEY);
        const lastShownTime = lastShown ? parseInt(lastShown, 10) : 0;
        const dueForReprompt = Date.now() - lastShownTime >= REPROMPT_INTERVAL_MS;

        if (dueForReprompt) {
          const timer = setTimeout(() => setOpen(true), 2000);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      setHasRated(false);
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
      localStorage.setItem(POPUP_LAST_SHOWN_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || rating === 0) {
      alert('Please enter your name and select a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        name: name.trim(),
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      try {
        localStorage.setItem(HAS_RATED_KEY, '1');
      } catch {
        // ignore
      }
      setHasRated(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button — always visible, even after rating */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
      >
        ⭐ Rate Us
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 text-white shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <h2 className="text-lg font-bold">Rate the Schedule Dashboard</h2>
              <button
                onClick={closePopup}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="py-6 text-center">
                <p className="mb-4 text-lg">Thanks for your feedback! 🎉</p>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mb-3 w-full rounded border border-white/20 bg-transparent p-2"
                />

                <div className="mb-3 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        cursor: 'pointer',
                        fontSize: '28px',
                        color: star <= (hoverRating || rating) ? '#facc15' : '#6b7280',
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <textarea
                  placeholder="Your comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-3 w-full rounded border border-white/20 bg-transparent p-2"
                  rows={3}
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    onClick={closePopup}
                    className="rounded border border-white/20 px-4 py-2 text-white"
                  >
                    Maybe later
                  </button>
                </div>

                {reviews.length > 0 && (
                  <p className="mt-3 text-xs text-gray-400">
                    {reviews.length} students have rated so far — avg{' '}
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} ⭐
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
