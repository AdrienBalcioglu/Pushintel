importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBJ3ESip_gifEPUFZUdbam0QgR4j4lqfas',
  authDomain: 'pushintel-a5fc8.firebaseapp.com',
  projectId: 'pushintel-a5fc8',
  storageBucket: 'pushintel-a5fc8.firebasestorage.app',
  messagingSenderId: '60021983181',
  appId: '1:60021983181:web:d70d64e270685d990d2684',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, { body, icon: '/icon.png' })
})
