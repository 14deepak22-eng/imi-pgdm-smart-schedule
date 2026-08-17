"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
}

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          rating: d.data().rating,
          comment: d.data().comment,
        }))
      );
    });
    return () => unsub();
  }, []);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  const handleSubmit = async () => {
    if (!name.trim() || rating === 0) {
      alert("Please enter your name and select a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        name: name.trim(),
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      setName("");
      setRating(0);
      setComment("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Rate the Schedule Dashboard</h1>

      <div className="mb-6">
        <p className="text-lg">
          Average Rating: <strong>{averageRating}</strong> ⭐ ({reviews.length} reviews)
        </p>
      </div>

      <div className="border rounded-lg p-4 mb-8">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2 mb-3"
        />

        <div className="flex mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                cursor: "pointer",
                fontSize: "28px",
                color: star <= (hoverRating || rating) ? "#facc15" : "#d1d5db",
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
          className="w-full border rounded p-2 mb-3"
          rows={3}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Reviews</h2>
        {reviews.length === 0 && <p className="text-gray-500">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="border-b py-3">
            <div className="flex justify-between">
              <strong>{r.name}</strong>
              <span style={{ color: "#facc15" }}>
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </span>
            </div>
            {r.comment && <p className="text-gray-600 mt-1">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
