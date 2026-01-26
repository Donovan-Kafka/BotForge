import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, User, Sparkles, Trash2, Bell, CheckCircle } from 'lucide-react';
import { notificationService } from '../../api';
import { User as UserType } from '../../types';

interface NotificationsProps {
  onBack: () => void;
  user: UserType | null;
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack, user }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      fetchNotifications();
    }
  }, [user?.user_id]);

  const fetchNotifications = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    const res = await notificationService.listNotifications(user.user_id);
    if (res.ok && Array.isArray(res)) {
      setNotifications(res);

      // Mark all as read when opening (optional, or we can do it on interaction)
      // For now let's just mark them individually or when user views them effectively
      // Or we can auto-mark unread ones
      res.filter((n: any) => !n.is_read).forEach((n: any) => {
        notificationService.markAsRead(user.user_id, n.message_id);
      });
    }
    setLoading(false);
  };

  const handleDelete = async (messageId: number) => {
    if (!user?.user_id) return;
    const res = await notificationService.deleteNotification(user.user_id, messageId);
    if (res.ok) {
      setNotifications(prev => prev.filter(n => n.message_id !== messageId));
    }
  };

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('system') || title.toLowerCase().includes('maintenance')) return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    if (title.toLowerCase().includes('account') || title.toLowerCase().includes('profile')) return <User className="w-5 h-5 text-blue-400" />;
    if (title.toLowerCase().includes('bot') || title.toLowerCase().includes('ai')) return <Sparkles className="w-5 h-5 text-purple-500" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 text-sm flex items-center font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
      </div>

      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Notifications</h2>

      <div className="space-y-4 max-w-4xl mx-auto">
        {loading && <div className="text-center text-gray-500">Loading notifications...</div>}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        )}

        {notifications.map((notification) => (
          <div key={notification.message_id} className={`bg-white border rounded-xl p-6 shadow-sm transition-all hover:shadow-md ${notification.is_read ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'}`}>
            <div className="flex gap-4 items-start">
              <div className="mt-1 flex-shrink-0 bg-gray-100 p-2 rounded-full">
                {getIcon(notification.title)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold text-base ${notification.is_read ? 'text-gray-800' : 'text-blue-900'}`}>{notification.title}</h3>
                  <span className="text-xs text-gray-400">
                    {new Date(notification.creation_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{notification.content}</p>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleDelete(notification.message_id)}
                    className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-1 transition-colors px-3 py-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
