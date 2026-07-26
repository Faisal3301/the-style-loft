// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCS6jREA8_J9-sL8DVQFECCggkiec73xXc",
  authDomain: "stitch-style-app.firebaseapp.com",
  projectId: "stitch-style-app",
  storageBucket: "stitch-style-app.firebasestorage.app",
  messagingSenderId: "85285253957",
  appId: "1:85285253957:web:954d5f6a37e3353b1b442c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || "The Style Loft";
  const notificationOptions = {
    body: payload.notification?.body || "Aapko ek naya update mila hai.",
    icon: payload.notification?.icon || '/logo.png',
    data: { url: payload.data?.url || '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Background notification par click karne se user ko target page par le kar jana
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const clickURL = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Agar pehle se koi tab khula hai toh usay focus kar lo
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === clickURL && 'focus' in client) {
          return client.focus();
        }
      }
      // Warna naya window/tab khol do
      if (clients.openWindow) {
        return clients.openWindow(clickURL);
      }
    })
  );
});