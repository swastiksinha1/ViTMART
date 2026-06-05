import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

// Hardcoded for exact clone parity as requested.
const GEMINI_API_KEY = typeof window !== 'undefined' && window.GEMINI_API_KEY ? window.GEMINI_API_KEY : '';

export default function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi there! ⚡ I am the **ViTMART Assistant**.\n\nAsk me anything about buying, selling, or finding your way around campus!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    // 1. Check Intents
    const m = userText.toLowerCase();
    
    if (m.match(/how (do|can|to) (i |we )?sell/i) || m.match(/list an item/i)) {
      setTimeout(() => {
        navigate('/sell');
        setMessages(prev => [...prev, { sender: 'bot', text: `To **list an item** for sale:\n\n1️⃣ Upload a clear photo\n2️⃣ Fill in details\n3️⃣ Set a price\n4️⃣ Hit **⚡ List My Item**\n\nI've opened the Sell page for you!` }]);
        setIsTyping(false);
      }, 600);
      return;
    }

    if (m.match(/noticeboard/i) || m.match(/board/i)) {
      setTimeout(() => {
        navigate('/noticeboard');
        setMessages(prev => [...prev, { sender: 'bot', text: `**📌 Noticeboard** is the campus bulletin board.\n\nPost what you want to buy, sell, or ask for help. Anyone can reply! I've opened it for you.` }]);
        setIsTyping(false);
      }, 600);
      return;
    }

    // 2. Gemini Fallback with Conversation History
    try {
      const systemPrompt = `You are ViT Assistant, the official AI guide for ViTMART, a student-only campus marketplace. While your primary job is to help with the marketplace, you are also a friendly, highly capable AI powered by Gemini. You are free to answer general knowledge questions, engage in casual chat (like saying hi or bye), and discuss topics completely unrelated to the app.

Key Features of ViTMART (for reference if asked):
- Buy/Sell: Students list textbooks, electronics, etc.
- Trade: "Tradeable" items can be swapped via the "Make Trade Offer 🔄" button.
- Cart & Checkout: Global cart drawer is available.
- Noticeboard: Community board for lost & found/requests.
- Global UI: Ctrl+K for quick search.

Rules for your responses:
1. Be extremely helpful, friendly, and use emojis.
2. Format your responses in clean Markdown.
3. Keep answers concise but comprehensive. Answer ANY question the user asks, whether it is about ViTMART or the universe.`;

      const historyContents = messages.slice(1).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      historyContents.push({ role: 'user', parts: [{ text: userText }] });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: historyContents
        })
      });
      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to answer that right now! Try asking about buying, selling, or the noticeboard.";
      
      setMessages(prev => [...prev, { sender: 'bot', text: botText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble connecting to my brain right now! 🧠" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={`fixed bottom-6 left-6 z-[90] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 hover:shadow-vit-500/50 animate-float-widget ${isOpen ? 'hidden' : 'block'}`}
        style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
      >
        <span className="text-2xl text-white">✨</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-6 left-6 sm:bottom-6 sm:left-6 w-[90vw] sm:w-[360px] h-[60vh] max-h-[600px] bg-white dark:bg-[#1a1430] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[100] border border-vit-500/20 animate-fade-in">
          <div className="p-4 bg-gradient-to-r from-vit-600 to-cyan-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner">⚡</div>
              <div>
                <h3 className="font-bold text-white leading-tight">ViT Assistant</h3>
                <p className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">AI Powered</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors">&times;</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-black/20 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vit-600 to-cyan-500 flex items-center justify-center text-white text-xs mr-2 shadow-md shrink-0 mt-auto mb-1">⚡</div>}
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-vit-600 to-cyan-500 text-white rounded-br-none' : 'glass rounded-bl-none text-gray-800 dark:text-gray-200'}`}>
                  {msg.sender === 'bot' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-snug prose-p:my-1">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vit-600 to-cyan-500 flex items-center justify-center text-white text-xs mr-2 shadow-md shrink-0 mt-auto mb-1">⚡</div>
                <div className="px-4 py-3 rounded-2xl glass rounded-bl-none text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-vit-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-vit-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-vit-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#1a1430] border-t border-gray-100 dark:border-white/10 flex gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask anything..." 
              className="flex-1 vit-input text-sm py-2 px-4 rounded-xl outline-none"
            />
            <button type="submit" disabled={!input.trim()} className="w-10 h-10 rounded-xl bg-vit-600 text-white flex items-center justify-center shadow-lg hover:bg-vit-700 disabled:opacity-50 transition-colors">
              <svg className="w-4 h-4 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
