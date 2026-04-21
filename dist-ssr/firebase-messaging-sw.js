importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDNF1W160f8wj_n3yji-G7_drVrB8x9QG0",
  authDomain: "gen-lang-client-0362441372.firebaseapp.com",
  projectId: "gen-lang-client-0362441372",
  messagingSenderId: "445249509199",
  appId: "1:445249509199:web:a894823375b9fc03d5173a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "CarPool";
  const body = payload.notification?.body ?? "";
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
  });
});
