importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB7wCIoSMqdjL1j7t04bxHUEZZE1TK_R8E",
  authDomain: "hirehub-88dfd.firebaseapp.com",
  projectId: "hirehub-88dfd",
  storageBucket: "hirehub-88dfd.firebasestorage.app",
  messagingSenderId: "853273646355",
  appId: "1:853273646355:web:e566b8e29888c8dcac76e6",
  measurementId: "G-X9J6Q052T6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "New Notification";
  const body = payload?.notification?.body || "You have a new message.";

  self.registration.showNotification(title, {
    body,
    icon: "/image/logo.svg",
  });
});

