import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function usePushNotifications() {
    const navigate = useNavigate();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const registerPush = async () => {
            try {
                // Request Permissions
                const permStatus = await PushNotifications.requestPermissions();
                if (permStatus.receive === 'granted') {
                    await PushNotifications.register();
                }

                // Catch Native Device Token (FCM Token) and send it to Django
                PushNotifications.addListener('registration', async (token) => {
                    console.log('FCM Registration token: ', token.value);
                    try {
                        // Optional: You can save the FCM token via your DRF backend endpoint
                        await api.post('/auth/devices/', {
                            fcm_token: token.value,
                            device_type: Capacitor.getPlatform()
                        });
                    } catch (e) {
                        console.error('Failed to sync FCM Token to backend:', e);
                    }
                });

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Error on FCM registration: ', error);
                });

                // Foreground Notification Received
                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received: ', notification);
                });

                // Background Notification Clicked (Trigger deep link)
                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push action performed: ', notification);
                    const data = notification.notification.data;

                    if (data && data.url) {
                        // Usually the Django backend will send a payload like { url: '/room/5' }
                        navigate(data.url);
                    }
                });

            } catch (err) {
                console.warn('Push Notifications failed to configure.', err);
            }
        };

        registerPush();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [navigate]);
}
