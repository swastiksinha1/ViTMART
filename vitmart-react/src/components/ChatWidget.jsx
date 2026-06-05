import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';

export default function ChatWidget() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' or 'seller'
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // The currently opened chat object
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch Inbox
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      return;
    }
    
    // Listen to chats where I am buyer
    const qBuyer = query(collection(db, 'chats'), where('buyerId', '==', currentUser.uid));
    const unsubBuyer = onSnapshot(qBuyer, (snap) => {
      const buyerChats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChats(prev => {
        const others = prev.filter(c => c.buyerId !== currentUser.uid);
        return [...others, ...buyerChats].sort((a,b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0));
      });
    });

    // Listen to chats where I am seller
    const qSeller = query(collection(db, 'chats'), where('sellerId', '==', currentUser.uid));
    const unsubSeller = onSnapshot(qSeller, (snap) => {
      const sellerChats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChats(prev => {
        const others = prev.filter(c => c.sellerId !== currentUser.uid);
        return [...others, ...sellerChats].sort((a,b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0));
      });
    });

    return () => { unsubBuyer(); unsubSeller(); };
  }, [currentUser]);

  // Fetch Messages for active chat
  useEffect(() => {
    if (!activeChat) return;
    const isBuyer = activeChat.buyerId === currentUser.uid;
    const unreadField = isBuyer ? 'unreadBuyer' : 'unreadSeller';
    
    // Clear unread
    if (activeChat[unreadField] > 0) {
      updateDoc(doc(db, 'chats', activeChat.id), { [unreadField]: 0 }).catch(console.error);
    }

    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      // clear unread again just in case new arrive while open
      updateDoc(doc(db, 'chats', activeChat.id), { [unreadField]: 0 }).catch(console.error);
    }, (error) => {
      console.warn("Message listener error (might need index):", error);
      // Fallback: fetch without orderBy and sort client side
      const qFallback = query(collection(db, 'chats', activeChat.id, 'messages'));
      onSnapshot(qFallback, (snapFallback) => {
        const msgs = snapFallback.docs.map(d => ({ id: d.id, ...d.data() }));
        msgs.sort((a,b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
        setMessages(msgs);
      });
    });

    return () => unsub();
  }, [activeChat, currentUser]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Init Chat Listener
  useEffect(() => {
    const handleInitChat = async (e) => {
      const p = e.detail.product;
      if (!currentUser) return;
      if (p.sellerId === currentUser.uid) {
        alert("You cannot chat with yourself!");
        return;
      }
      
      setIsOpen(true);
      setActiveTab('buyer');
      
      const q = query(collection(db, 'chats'), where('buyerId', '==', currentUser.uid), where('productId', '==', p.id));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setActiveChat({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        try {
          const docRef = await addDoc(collection(db, 'chats'), {
            buyerId: currentUser.uid,
            buyerName: currentUser.displayName || 'User',
            buyerPhoto: currentUser.photoURL || '',
            sellerId: p.sellerId,
            sellerName: p.sellerName,
            sellerPhoto: p.sellerPhotoURL || '',
            productId: p.id,
            productName: p.name,
            unreadBuyer: 0,
            unreadSeller: 0,
            lastMessage: '',
            createdAt: serverTimestamp(),
            lastMessageAt: serverTimestamp()
          });
          setActiveChat({ id: docRef.id, buyerId: currentUser.uid, sellerId: p.sellerId, productName: p.name });
        } catch (err) {
          console.error("Error creating chat:", err);
        }
      }
    };

    window.addEventListener('init-chat', handleInitChat);
    return () => window.removeEventListener('init-chat', handleInitChat);
  }, [currentUser]);

  if (!currentUser) return null;

  const totalUnread = chats.reduce((sum, c) => sum + (c.buyerId === currentUser.uid ? (c.unreadBuyer||0) : (c.unreadSeller||0)), 0);
  const filteredChats = chats.filter(c => activeTab === 'buyer' ? c.buyerId === currentUser.uid : c.sellerId === currentUser.uid);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const text = newMessage.trim();
    setNewMessage(''); // optimistic
    const isBuyer = activeChat.buyerId === currentUser.uid;
    const unreadField = isBuyer ? 'unreadSeller' : 'unreadBuyer';

    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        senderPhoto: currentUser.photoURL || '',
        text: text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text.length > 80 ? text.slice(0, 80) + '...' : text,
        lastMessageAt: serverTimestamp(),
        [unreadField]: (activeChat[unreadField] || 0) + 1
      });
    } catch (err) {
      console.error('Failed to send msg:', err);
    }
  };

  const deleteChat = async (chatId) => {
    if(!window.confirm('Delete this conversation for you?')) return;
    try {
      const msgSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
      const batch = writeBatch(db);
      msgSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await deleteDoc(doc(db, 'chats', chatId));
      if(activeChat?.id === chatId) setActiveChat(null);
    } catch(err) {
      console.error('Error deleting chat', err);
    }
  };

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[90] animate-float-widget" style={{ animationDelay: '0.5s' }}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white relative transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#06b6d4,#7c3aed)' }}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* INBOX PANEL */}
      {isOpen && !activeChat && (
        <div className="fixed bottom-40 right-4 sm:bottom-24 sm:right-6 w-[90vw] sm:w-[360px] h-[60vh] max-h-[500px] bg-white dark:bg-[#1a1430] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100] border border-vit-500/10">
          <div className="p-4 bg-gradient-to-r from-vit-600 to-cyan-500 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">💬 My Chats</h3>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">&times;</button>
          </div>
          <div className="flex border-b border-gray-100 dark:border-white/10">
            <button onClick={() => setActiveTab('buyer')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'buyer' ? 'text-vit-600 border-b-2 border-vit-600' : 'text-gray-400'}`}>🛒 As Buyer</button>
            <button onClick={() => setActiveTab('seller')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'seller' ? 'text-vit-600 border-b-2 border-vit-600' : 'text-gray-400'}`}>🏪 As Seller</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="text-center p-8 text-gray-400">
                <div className="text-4xl mb-2">{activeTab === 'buyer' ? '🛒' : '🏪'}</div>
                <p className="text-sm">No {activeTab} chats yet.</p>
              </div>
            ) : (
              filteredChats.map(c => {
                const isBuyer = c.buyerId === currentUser.uid;
                const otherName = isBuyer ? c.sellerName : c.buyerName;
                const otherPhoto = isBuyer ? c.sellerPhoto : c.buyerPhoto;
                const unread = isBuyer ? (c.unreadBuyer||0) : (c.unreadSeller||0);
                return (
                  <div key={c.id} className={`flex items-center gap-3 p-3 border-b border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 ${unread>0 ? 'bg-vit-500/5' : ''}`}>
                    <div onClick={() => setActiveChat(c)} className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-bold text-sm truncate ${unread>0 ? 'text-vit-600' : 'text-gray-900 dark:text-white'}`}>{otherName || 'User'}</p>
                      </div>
                      <p className="text-xs text-gray-400 truncate">re: {c.productName}</p>
                      <p className={`text-xs truncate ${unread>0 ? 'text-vit-600 font-bold' : 'text-gray-500'}`}>{c.lastMessage || '💬 Start chatting'}</p>
                    </div>
                    {unread > 0 && <span className="bg-vit-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread}</span>}
                    <button onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} className="text-gray-300 hover:text-rose-500 p-1">🗑️</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CHAT PANEL */}
      {isOpen && activeChat && (
        <div className="fixed bottom-40 right-4 sm:bottom-24 sm:right-6 w-[90vw] sm:w-[360px] h-[65vh] max-h-[550px] bg-white dark:bg-[#1a1430] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100] border border-vit-500/10">
          <div className="p-3 bg-gradient-to-r from-vit-600 to-cyan-500 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveChat(null)} className="text-white hover:bg-white/20 p-1 rounded">←</button>
              <h3 className="font-bold text-white text-sm truncate max-w-[200px]">
                {activeChat.buyerId === currentUser.uid ? activeChat.sellerName : activeChat.buyerName}
              </h3>
            </div>
            <button onClick={() => { setIsOpen(false); setActiveChat(null); }} className="text-white hover:text-gray-200">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mt-10">Say hello! 👋</div>
            ) : (
              messages.map(msg => {
                const mine = msg.senderId === currentUser.uid;
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${mine ? 'bg-gradient-to-r from-vit-600 to-cyan-500 text-white rounded-br-none' : 'glass rounded-bl-none text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-[#1a1430] border-t border-gray-100 dark:border-white/10 flex gap-2">
            <input 
              type="text" 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)} 
              placeholder="Message..." 
              className="flex-1 vit-input text-sm py-2 px-3 rounded-xl"
            />
            <button type="submit" disabled={!newMessage.trim()} className="bg-vit-600 text-white px-4 rounded-xl font-bold disabled:opacity-50">→</button>
          </form>
        </div>
      )}
    </>
  );
}
