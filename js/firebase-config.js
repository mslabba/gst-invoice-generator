// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC-ldauOIyJEZ9gaTMSvwWXfHJ9T-qFIUE",
  authDomain: "gst-invoice-generator-45ad6.firebaseapp.com",
  projectId: "gst-invoice-generator-45ad6",
  storageBucket: "gst-invoice-generator-45ad6.firebasestorage.app",
  messagingSenderId: "795683564633",
  appId: "1:795683564633:web:4bb3101373f96117d49548",
  measurementId: "G-822LDWN74M"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);