import React, { useState } from 'react';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await auth.signOut();
          throw new Error('Please verify your email before logging in. Check your inbox.');
        }
        closeAuthModal();
      } else {
        // SIGNUP
        if (name.trim().length < 2) {
          throw new Error('Please enter your full name.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
        
        // Save initial user doc
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName: name.trim(),
          email: userCredential.user.email,
          createdAt: serverTimestamp(),
          photoURL: ''
        });

        await sendEmailVerification(userCredential.user);
        await auth.signOut(); // Force them to verify before actually logging in
        setVerificationSent(true);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-[#120c24] rounded-3xl shadow-2xl overflow-hidden border border-vit-500/20">
        
        {/* Close Button */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-full transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-vit-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-3xl mb-4 shadow-lg shadow-vit-500/30">
              ⚡
            </div>
            <h2 className="text-3xl font-black font-syne text-gray-900 dark:text-white">
              {verificationSent ? 'Check Your Email' : isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Join ViTMART'}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              {verificationSent 
                ? 'We sent a verification link to your email. Please click it to verify your account.'
                : isForgotPassword 
                ? 'Enter your email address and we will send you a link to reset your password.'
                : 'Exclusive marketplace for students.'}
            </p>
          </div>

          {!verificationSent && (
            <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-100 text-rose-700 text-sm font-bold rounded-xl text-center">
                  {error}
                </div>
              )}
              {message && (
                <div className="p-3 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl text-center">
                  {message}
                </div>
              )}

              {!isForgotPassword && !isLogin && (
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="vit-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              )}
              
              <input 
                type="email" 
                placeholder="Email Address" 
                className="vit-input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
              
              {!isForgotPassword && (
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="vit-input" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              )}

              {!isForgotPassword && isLogin && (
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(true); setError(''); setMessage(''); }}
                    className="text-xs font-bold text-vit-600 hover:text-cyan-500 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-vit-600 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-vit-500/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          )}

          {!verificationSent && (
            <p className="text-center mt-6 text-sm text-gray-500">
              {isForgotPassword ? (
                <button 
                  onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }} 
                  className="font-bold text-vit-600 dark:text-vit-400 hover:underline"
                >
                  Back to Login
                </button>
              ) : (
                <>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                    className="font-bold text-vit-600 dark:text-vit-400 hover:underline"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </>
              )}
            </p>
          )}
          
          {verificationSent && (
            <button 
              onClick={() => { setVerificationSent(false); setIsLogin(true); }}
              className="w-full mt-4 py-3 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-xl font-bold"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
