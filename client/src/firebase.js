// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCT6s0X-c0O4zOh9GK_Ltv_W8RA_MGAJG8",
  authDomain: "course-visualizer-2ebfb.firebaseapp.com",
  projectId: "course-visualizer-2ebfb",
  storageBucket: "course-visualizer-2ebfb.firebasestorage.app",
  messagingSenderId: "1055685355134",
  appId: "1:1055685355134:web:3c0e6fed88b1bdeecb9a2f",
  measurementId: "G-CCSCH7BZZY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase Auth for use in other parts of the app
export const auth = getAuth(app);