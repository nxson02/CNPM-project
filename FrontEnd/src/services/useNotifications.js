import { useCallback, useEffect, useState } from 'react';
import api from './apiConfig';

const EMPTY_STATE = {
  unreadNotifications: [],
  readNotifications: [],
  unreadCount: 0,
};

const NOTIFICATION_EVENT = 'bluemoon:notifications-updated';

export default function useNotifications({ pollInterval = 0 } = {}) {
  const [notifications, setNotifications] = useState(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await api.get('/notifications/check');
      setNotifications({ ...EMPTY_STATE, ...response.data });
      setError('');
    } catch (requestError) {
      setError('Không thể tải thông báo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener(NOTIFICATION_EVENT, handleUpdate);
    const timer = pollInterval > 0 ? setInterval(refresh, pollInterval) : null;

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleUpdate);
      if (timer) clearInterval(timer);
    };
  }, [pollInterval, refresh]);

  const publishUpdate = () => window.dispatchEvent(new Event(NOTIFICATION_EVENT));

  const markAsRead = async (id) => {
    await api.put(`/notifications/mark-as-read/${id}`);
    publishUpdate();
  };

  const markAllAsRead = async () => {
    await api.post('/notifications/mark-as-read');
    publishUpdate();
  };

  const deleteNotification = async (id) => {
    await api.delete(`/notifications/delete/${id}`);
    publishUpdate();
  };

  return {
    ...notifications,
    allNotifications: [
      ...notifications.unreadNotifications,
      ...notifications.readNotifications,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
