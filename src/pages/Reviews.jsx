import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

export default function Reviews() {
  const { currentUser, setShowAuthModal } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Form State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    if (!subject.trim() || !reviewText.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        rating,
        subject: subject.trim(),
        text: reviewText.trim(),
        authorId: currentUser.uid,
        authorName: isAnonymous ? 'Anonymous Student' : (currentUser.displayName || 'Student'),
        authorPhoto: isAnonymous ? null : currentUser.photoURL,
        isAnonymous,
        createdAt: serverTimestamp()
      });
      setRating(0);
      setSubject('');
      setReviewText('');
      setIsAnonymous(false);
      alert('Review posted successfully! ⭐');
    } catch (err) {
      console.error(err);
      alert('Failed to post review: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === '5') return r.rating === 5;
    if (activeFilter === '4') return r.rating === 4;
    if (activeFilter === '3') return r.rating === 3;
    if (activeFilter === '1,2') return r.rating === 1 || r.rating === 2;
    return true;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <p className="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest mb-2">Community Feedback</p>
        <h2 className="text-4xl font-black font-syne text-gray-900 dark:text-white">Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-vit-600 to-cyan-500">Reviews</span></h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Real experiences from real students</p>
      </div>

      {/* Write Review */}
      <div className="glass rounded-2xl p-6 mb-8 border border-vit-500/20">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">✍️ Write a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Rate your experience</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button 
                  key={i} 
                  type="button" 
                  className={`text-3xl transition-transform hover:scale-110 ${i <= (hoverRating || rating) ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-gray-300 dark:text-gray-600'}`}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">About (product name / seller / platform)</label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              className="vit-input w-full" 
              placeholder="e.g. MacBook Pro by Rahul, or ViTMART Platform" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Your Review</label>
            <textarea 
              value={reviewText} 
              onChange={e => setReviewText(e.target.value)} 
              className="vit-input w-full resize-none" 
              rows="4" 
              placeholder="Share your honest experience..." 
              required
            ></textarea>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              <input 
                type="checkbox" 
                checked={isAnonymous} 
                onChange={e => setIsAnonymous(e.target.checked)} 
                className="w-4 h-4 text-vit-600 bg-gray-100 border-gray-300 rounded focus:ring-vit-500 dark:focus:ring-vit-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
              />
              Post anonymously
            </label>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-vit-600 to-cyan-500 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30 hover:-translate-y-0.5 transition-transform"
          >
            {isSubmitting ? 'Posting...' : 'Post Review ⭐'}
          </button>
        </form>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'All ⭐' },
          { id: '5', label: '5 Stars 🌟' },
          { id: '4', label: '4 Stars' },
          { id: '3', label: '3 Stars' },
          { id: '1,2', label: '1-2 Stars' }
        ].map(filter => (
          <button 
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeFilter === filter.id ? 'bg-vit-600 text-white shadow-md' : 'glass text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-black/20'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Reviews Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No reviews found for this filter.</div>
        ) : (
          filteredReviews.map(r => (
            <div key={r.id} className="glass p-5 rounded-2xl relative group hover:shadow-lg transition-all duration-300">
              {currentUser?.uid === r.authorId && (
                <button 
                  onClick={() => handleDelete(r.id)} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Review"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              )}
              <div className="flex items-start gap-4">
                {r.authorPhoto && !r.isAnonymous ? (
                  <img src={r.authorPhoto} className="w-12 h-12 rounded-full object-cover shadow-sm" alt={r.authorName} />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {r.isAnonymous ? '🕵️' : r.authorName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{r.authorName}</h4>
                    <span className="text-[10px] text-gray-400 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full font-semibold">
                      {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className={`text-sm ${i <= r.rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
                    ))}
                  </div>
                  <h5 className="font-black text-sm text-vit-700 dark:text-vit-400 mb-1">{r.subject}</h5>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{r.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
