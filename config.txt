// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyDx78_LwFkGfejCJUncbX8eaoRwlIF6f5A",
authDomain: "my-fx-journey.firebaseapp.com",
projectId: "my-fx-journey",
storageBucket: "my-fx-journey.firebasestorage.app",
messagingSenderId: "251559591304",
appId: "1:251559591304:web:b98a24559c628cb0650e3d",
measurementId: "G-6JDWB7ZF21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };