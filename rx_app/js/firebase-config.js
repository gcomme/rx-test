// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbFsNSFd6BA9aTwWXlGSJTsT2jnl7m5sc",
  authDomain: "rx-app-592d4.firebaseapp.com",
  projectId: "rx-app-592d4",
  storageBucket: "rx-app-592d4.firebasestorage.app",
  messagingSenderId: "365050481257",
  appId: "1:365050481257:web:50a5006472140c356db0f8",
  measurementId: "G-7891T982KG",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // This line was causing the error

// Collection references
const usersRef = db.collection("users");
const categoriesRef = db.collection("categories");
const servicesRef = db.collection("services");

// Make sure these variables are accessible globally
window.auth = auth;
window.db = db;
window.storage = storage;
window.usersRef = usersRef;
window.categoriesRef = categoriesRef;
window.servicesRef = servicesRef;

// Helper functions
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

const getCurrentUserRole = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const userDoc = await usersRef.doc(user.uid).get();
  if (userDoc.exists) {
    return userDoc.data().role;
  }
  return null;
};

const checkUserRole = async (allowedRoles) => {
  const role = await getCurrentUserRole();
  if (!role || !allowedRoles.includes(role)) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
};

// Make helper functions globally accessible
window.getCurrentUser = getCurrentUser;
window.getCurrentUserRole = getCurrentUserRole;
window.checkUserRole = checkUserRole;
