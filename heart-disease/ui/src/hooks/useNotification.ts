import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  addNotification,
  setBrowserPermission,
} from '../store/slices/notificationSlice';

export function useNotification() {
  const dispatch = useDispatch<AppDispatch>();
  const permission = useSelector(
    (s: RootState) => s.notifications.browserPermission
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    dispatch(setBrowserPermission(result));
    return result;
  }, [dispatch]);

  const sendNotification = useCallback(
    (opts: {
      type: 'success' | 'warning' | 'info' | 'error';
      title: string;
      message: string;
    }) => {
      // In-app notification
      dispatch(addNotification(opts));

      // Browser push notification
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        new Notification(opts.title, {
          body: opts.message,
          icon: '/heart.svg',
          tag: 'cardiosense',
        });
      }
    },
    [dispatch]
  );

  return { sendNotification, requestPermission, permission };
}
