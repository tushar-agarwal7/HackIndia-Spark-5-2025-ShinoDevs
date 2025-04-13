// New component for notifications
// components/notifications/NotificationCenter.jsx
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationCenter({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };
  
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update locally
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update locally
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'CHALLENGE_COMPLETED':
      case 'CHALLENGE_REMINDER':
        router.push(`/dashboard/challenges`);
        break;
      case 'ACHIEVEMENT_EARNED':
        router.push(`/dashboard/profile`);
        break;
      default:
        router.push('/dashboard');
    }
    
    // Close notification panel
    onClose();
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CHALLENGE_COMPLETED':
        return (
          <div className="rounded-full bg-green-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'CHALLENGE_REMINDER':
        return (
          <div className="rounded-full bg-amber-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'ACHIEVEMENT_EARNED':
        return (
          <div className="rounded-full bg-purple-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex" onClick={e => e.stopPropagation()}>
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      type="button"
                      className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {notifications.length > 0 && (
                  <div className="mt-8">
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-cyan-600 hover:text-cyan-800"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}

                <div className="mt-8">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-md">
                      {error}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No notifications yet
                    </div>
                  ) : (
                    <ul role="list" className="divide-y divide-gray-200">
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={`py-4 flex ${!notification.read ? 'bg-blue-50' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="ml-3 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}