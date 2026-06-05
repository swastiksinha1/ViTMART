import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function LostAndFound() {
  const { currentUser, setShowAuthModal } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState('lost'); // 'lost' or 'found'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [collectionPoint, setCollectionPoint] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'lost_and_found'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return setShowAuthModal(true);
    if (!imageFile) return alert('Please upload an image.');
    
    setIsSubmitting(true);
    try {
      // Upload image
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error('Image upload failed');

      // Save to Firestore
      await addDoc(collection(db, 'lost_and_found'), {
        reportType,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        collectionPoint: reportType === 'found' ? collectionPoint.trim() : null,
        imageUrl: data.secure_url,
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName,
        reporterEmail: currentUser.email,
        status: 'active',
        createdAt: serverTimestamp()
      });

      // Reset
      setIsModalOpen(false);
      setTitle(''); setDescription(''); setLocation(''); setCollectionPoint('');
      setImageFile(null); setImagePreview(null);
    } catch (error) {
      alert('Error submitting report.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'lost_and_found', id), {
        status: currentStatus === 'active' ? 'resolved' : 'active'
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this report?')) {
      try {
        await deleteDoc(doc(db, 'lost_and_found', id));
      } catch (error) {
        console.error('Error deleting report:', error);
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterStatus === 'all' || item.reportType === filterStatus;
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="text-vit-600 dark:text-vit-400 text-sm font-bold uppercase tracking-widest">Campus Board</p>
          <h2 className="text-3xl font-black font-syne text-gray-900 dark:text-white mt-1">Lost & Found</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setReportType('lost'); setIsModalOpen(true); }} className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold rounded-xl shimmer-btn shadow-lg shadow-rose-500/30 text-sm">
            Report Lost
          </button>
          <button onClick={() => { setReportType('found'); setIsModalOpen(true); }} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shimmer-btn shadow-lg shadow-emerald-500/30 text-sm">
            Report Found
          </button>
        </div>
      </div>

      <div className="glass p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-grow w-full">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or description..." className="vit-input text-sm w-full" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="vit-input text-sm w-full md:w-48">
          <option value="all">Show All</option>
          <option value="lost">Lost Items</option>
          <option value="found">Found Items</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400 text-center py-10 col-span-full">Loading...</p>
        ) : filteredItems.length > 0 ? (
          filteredItems.map(item => {
            const isResolved = item.status === 'resolved';
            const isLost = item.reportType === 'lost';
            const isMyReport = currentUser?.uid === item.reporterId;

            return (
              <div key={item.id} className={`glass rounded-2xl overflow-hidden flex flex-col ${isResolved ? 'opacity-60' : ''}`}>
                <div className="relative">
                  <img src={item.imageUrl} alt={item.title} className={`w-full h-44 object-cover ${isResolved ? 'grayscale' : ''}`} />
                  <div className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-full text-white ${isLost ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                    {isLost ? 'LOST' : 'FOUND'}
                  </div>
                  {isResolved && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 text-xs font-bold bg-gray-700 text-white rounded-full">RESOLVED</div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">by {item.reporterName} · {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Just now'}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 flex-grow leading-relaxed">{item.description}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 space-y-1 text-xs">
                    <p><strong className="text-gray-400">{isLost ? 'Last seen:' : 'Found at:'}</strong> <span className="text-gray-600 dark:text-gray-300">{item.location}</span></p>
                    {!isLost && item.collectionPoint && (
                      <p><strong className="text-gray-400">Collect at:</strong> <span className="text-gray-600 dark:text-gray-300">{item.collectionPoint}</span></p>
                    )}
                  </div>

                  {isMyReport ? (
                    <div className="flex items-center gap-2 mt-4">
                      <button onClick={() => handleStatusChange(item.id, item.status)} className={`flex-grow py-2 text-sm font-bold rounded-xl text-white ${isResolved ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-cyan-500 to-cyan-600'}`}>
                        {isResolved ? 'Mark Active' : 'Mark Resolved'}
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 glass rounded-xl text-gray-400 hover:text-rose-500 transition-colors">🗑️</button>
                    </div>
                  ) : (
                    <a href={`mailto:${item.reporterEmail}?subject=ViTMART: About "${item.title}"`} className="mt-4 block w-full text-center py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white font-bold rounded-xl shimmer-btn text-sm">
                      Contact {isLost ? 'Owner' : 'Finder'}
                    </a>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-center py-10 col-span-full">No items matching your search. 🤷</p>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1430] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative transform transition-all p-6">
            <div className="text-center mb-2">
              <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3 ${reportType === 'lost' ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                {reportType === 'lost' ? '😢' : '🎉'}
              </div>
              <h2 className="text-2xl font-black font-syne text-gray-900 dark:text-white">Report {reportType === 'lost' ? 'a Lost' : 'a Found'} Item</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Image *</label>
                <div className="relative border-2 border-dashed border-vit-500/30 rounded-2xl h-32 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-vit-500/5 transition-colors">
                  <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={handleImageChange} />
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <span className="text-gray-400 text-sm">Click to upload image</span>
                  )}
                </div>
              </div>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Item Title *" className="vit-input w-full" required />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed Description *" className="vit-input w-full resize-none" rows="3" required></textarea>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={reportType === 'lost' ? 'Last Seen Location *' : 'Location Found *'} className="vit-input w-full" required />
              {reportType === 'found' && (
                <input type="text" value={collectionPoint} onChange={e => setCollectionPoint(e.target.value)} placeholder="Collection Point *" className="vit-input w-full" required />
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 glass rounded-xl font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-gradient-to-r from-vit-600 to-vit-700 text-white rounded-xl font-bold shimmer-btn">
                  {isSubmitting ? 'Uploading...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
