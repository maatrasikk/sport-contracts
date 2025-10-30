// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// ЗАМЕНИ ЭТИ ДАННЫЕ НА СВОИ ИЗ FIREBASE CONSOLE!
const firebaseConfig = {
  apiKey: "AIzaSyATr2RGJDvDLQCXNMTqlHdIAYVEom77aI8",
  authDomain: "sport-contracts-fae97.firebaseapp.com",
  databaseURL: "https://sport-contracts-fae97-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sport-contracts-fae97",
  storageBucket: "sport-contracts-fae97.firebasestorage.app",
  messagingSenderId: "786711256583",
  appId: "1:786711256583:web:6c9ae3b3fa2dd3a0a814a2"
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Инициализируем сервисы Firebase
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;