import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqsgsbxvYViVPNLpiiKDrEyikHu76Wu4I",
  authDomain: "campusexchange-875ba.firebaseapp.com",
  projectId: "campusexchange-875ba",
  storageBucket: "campusexchange-875ba.appspot.com",
  messagingSenderId: "943624444799",
  appId: "1:943624444799:web:9fcb07a2dab871adc2d84a",
  measurementId: "G-S8K7PGVKM5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const CLOUDINARY_CLOUD_NAME = 'dlwb70n5s';
export const CLOUDINARY_UPLOAD_PRESET = 'campus-exchange-uploads';
