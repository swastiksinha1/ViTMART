import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const NOTICE_TAGS = {
  'want-to-buy': { label: 'Want to Buy', cls: 'tag-want', icon: '🛒' },
  'selling': { label: 'Selling', cls: 'tag-sell', icon: '💰' },
  'help': { label: 'Need Help', cls: 'tag-help', icon: '🙋' },
  'general': { label: 'General', cls: 'tag-general', icon: '📢' }
};

export default function Noticeboard() {
  const { currentUser, setShowAuthModal } = useAuth();
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('general');
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'noticeboard'), orderBy('createdAt', 'desc'), limit(60));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(fetchedNotices);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (!title.trim() || !body.trim()) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'noticeboard'), {
        tag,
        title: title.trim(),
        body: body.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Student',
        authorPhoto: currentUser.photoURL || null,
        replyCount: 0,
        createdAt: serverTimestamp()
      });
      setTitle('');
      setBody('');
      setTag('general');
    } catch (error) {
      console.error('Error posting notice:', error);
      alert('Failed to post notice');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this notice?')) {
      try {
        await deleteDoc(doc(db, 'noticeboard', id));
      } catch (error) {
        console.error('Error deleting notice:', error);
      }
    }
  };

  const displayedNotices = filter === 'all' ? notices : notices.filter(n => n.tag === filter);

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-4xl py-12">
      <div className="mb-8">
        <p className="section-eyebrow mb-2">Community Board</p>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white">📌 Notice <span className="grad-text">Board</span></h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Post what you need, what you're selling, or ask for help — the campus sees it in real time</p>
      </div>

      {/* Post Form */}
      <div className="glass rounded-2xl p-6 mb-8 border border-vit-500/20">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">📝 Post a Notice</h3>
        <form onSubmit={handlePost} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(NOTICE_TAGS).map(([k, v]) => (
              <label key={k} className="cursor-pointer">
                <input type="radio" name="tag" value={k} checked={tag === k} onChange={(e) => setTag(e.target.value)} className="hidden" />
                <div className={`p-3 rounded-xl border text-center transition-all ${tag === k ? 'border-vit-500 bg-vit-50 dark:bg-vit-900/20 shadow-lg' : 'border-gray-200 dark:border-gray-700 hover:border-vit-400 hover:bg-vit-50 dark:hover:bg-vit-900/20'}`}>
                  <div className="text-xl mb-1">{v.icon}</div>
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{v.label}</div>
                </div>
              </label>
            ))}
          </div>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="vit-input" placeholder="Title of your notice *" required maxLength="100" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="vit-input resize-none" rows="3" placeholder="Details — be specific! *" required maxLength="500"></textarea>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{body.length} / 500</span>
            <button type="submit" disabled={isPosting} className="px-6 py-2.5 bg-gradient-to-r from-vit-600 to-cyan-500 text-white rounded-xl font-bold shimmer-btn shadow-lg shadow-vit-500/30">
              {isPosting ? 'Posting...' : 'Post Notice 📌'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter('all')} className={`cat-pill ${filter === 'all' ? 'active shadow-lg bg-white dark:bg-gray-800' : 'bg-white/50 dark:bg-black/20'} px-4 py-2 rounded-full font-semibold text-sm`}>All Posts</button>
        {Object.entries(NOTICE_TAGS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`cat-pill ${filter === k ? 'active shadow-lg bg-white dark:bg-gray-800' : 'bg-white/50 dark:bg-black/20'} px-4 py-2 rounded-full font-semibold text-sm`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading notices…</div>
        ) : displayedNotices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📌</div>
            <p className="font-medium">No notices yet. Be the first to post!</p>
          </div>
        ) : (
          displayedNotices.map(n => {
            const t = NOTICE_TAGS[n.tag] || NOTICE_TAGS.general;
            const initials = (n.authorName || '?').charAt(0).toUpperCase();
            return (
              <div key={n.id} className="glass rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:-translate-y-1 transition-transform">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {n.authorPhoto ? (
                      <img src={n.authorPhoto} className="w-9 h-9 rounded-xl object-cover" alt="author" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vit-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{n.authorName}</p>
                      <p className="text-xs text-gray-400">
                        {n.createdAt ? formatDistanceToNow(n.createdAt.toDate()) + ' ago' : 'just now'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${n.tag === 'selling' ? 'bg-amber-100 text-amber-700' : n.tag === 'want-to-buy' ? 'bg-cyan-100 text-cyan-700' : n.tag === 'help' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                      {t.icon} {t.label}
                    </span>
                    {currentUser && currentUser.uid === n.authorId && (
                      <button onClick={() => handleDelete(n.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete Notice">
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">{n.title}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{n.body}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
