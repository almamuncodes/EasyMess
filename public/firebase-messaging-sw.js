importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Initialize Firebase in the Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyDF6hJ5VU_eXu4Nf0tlERnK8vbAZtnJxBM",
  projectId: "easymess-d7f17",
  messagingSenderId: "278542609832",
  appId: "1:278542609832:web:4dae4a72ed99cea0bf019d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || "💬 EasyMess";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "New message received.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || "easymess-notification",
    renotify: true,
    data: {
      url: payload.data?.click_action || payload.data?.url || "/chat"
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click action handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/chat";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
