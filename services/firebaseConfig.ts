import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDetsRlOQaYSl_3bkUKzT3mvyJwm1WC_ik',
  authDomain: 'screen-talc.firebaseapp.com',
  projectId: 'screen-talc',
  storageBucket: 'screen-talc.firebasestorage.app',
  messagingSenderId: '181279360160',
  appId: '1:181279360160:web:ea181215bc2356ba22b5c5'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
