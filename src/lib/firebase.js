import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDF6hJ5VU_eXu4Nf0tlERnK8vbAZtnJxBM",
  authDomain: "easymess-d7f17.firebaseapp.com",
  projectId: "easymess-d7f17",
  storageBucket: "easymess-d7f17.firebasestorage.app",
  messagingSenderId: "278542609832",
  appId: "1:278542609832:web:4dae4a72ed99cea0bf019d",
  measurementId: "G-5WW7TQHDQF"
};

const app = initializeApp(firebaseConfig);

export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
export default app;
