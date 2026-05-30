import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import './Notifications.css';

const icons = {
  info: <Info size={16} />,
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  error: <AlertCircle size={16} />,
};

export function Notifications() {
  const notifications = useUIStore((s) => s.notifications);
  const removeNotification = useUIStore((s) => s.removeNotification);

  return (
    <div className="notifications-container">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            className={`notification notification-${n.type}`}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9, height: 0, marginBottom: 0, padding: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <span className="notification-icon">{icons[n.type]}</span>
            <span className="notification-message">{n.message}</span>
            <motion.button
              className="notification-close"
              onClick={() => removeNotification(n.id)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={14} />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
