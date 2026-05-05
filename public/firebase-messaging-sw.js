// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Default config (the config should ideally be fetched or injected, but we can use a basic initialization)
// Because this is a Service Worker, it runs in the background. We need the same config.
// Ideally, the user needs to replace these with their actual config strings if not using standard VITE injection
// For now, we will leave placeholders that the user must fill, or we can construct it if possible.
// Actually, Service Workers can't read process.env. We will need to set up the config manually.
// Wait, to make it seamless, the user should provide the config. For now, we initialize an empty app and wait for config.

const firebaseConfig = {
    // The user will need to replace these placeholders manually, or we can use URL parameters if we register it specially.
    // For now, this is a boilerplate service worker.
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new update.',
        icon: '/vite.svg', // Update with actual app icon
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
