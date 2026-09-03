import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { MOCK_DRIVER_NOTIFICATIONS } from "../data/mockNotifications.js";
import useOwnerNotifications from "../hooks/useOwnerNotifications.js";

const NotificationContext = createContext(null);

export function NotificationProvider({
  children,
  role = "owner",
}) {
  const normalizedRole = String(role).toLowerCase();
  const isOwner = normalizedRole === "owner";

  const { notifications: ownerNotifications, loading: ownerLoading } =
    useOwnerNotifications({ enabled: isOwner });

  const [notifications, setNotifications] = useState(
    isOwner ? [] : MOCK_DRIVER_NOTIFICATIONS
  );

  useEffect(() => {
    if (isOwner && !ownerLoading) {
      setNotifications(ownerNotifications);
    }
  }, [isOwner, ownerLoading, ownerNotifications]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.is_read
      ).length,
    [notifications]
  );

  function markAsRead(id) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              is_read: true,
              read: true,
            }
          : notification
      )
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read: true,
      }))
    );
  }

  function clearNotifications() {
    setNotifications([]);
  }

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    loading: isOwner ? ownerLoading : false,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
}
