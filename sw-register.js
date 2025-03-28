// Service Worker Registration Script for Expert Chat System
// This script can be included in the main application to register the service worker

// Function to register the service worker
async function registerServiceWorker() {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('Service Worker registered with scope:', registration.scope);

      // Check if push notifications are supported
      if ('PushManager' in window) {
        console.log('Push notifications are supported');

        // Dispatch an event that can be caught by the application to show the permission prompt
        window.dispatchEvent(new CustomEvent('sw-push-supported'));
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } else {
    console.log('Service workers are not supported in this browser');
  }
}

// Function to subscribe to push notifications
async function subscribeToPushNotifications(publicVapidKey) {
  try {
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    console.log('Push notification subscription:', subscription);

    // Send the subscription to the server
    await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
}

// Function to convert base64 string to Uint8Array
// (required for applicationServerKey)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Function to send subscription to server
async function sendSubscriptionToServer(subscription) {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription,
        userAgent: navigator.userAgent
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending subscription to server:', error);
    throw error;
  }
}

// Register the service worker on page load
window.addEventListener('load', () => {
  registerServiceWorker();
});

// Export functions for use in application
window.pushNotifications = {
  register: registerServiceWorker,
  subscribe: subscribeToPushNotifications
};
