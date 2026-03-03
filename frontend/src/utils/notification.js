import { toast } from 'sonner';

/**
 * Notification utility for the entire application
 * Uses Sonner toast library for modern, non-blocking notifications
 */

export const notify = {
  /**
   * Show success notification
   * @param {string} message - Success message to display
   * @param {object} options - Additional options for toast
   */
  success: (message, options = {}) => {
    toast.success(message, {
      duration: 3000,
      ...options,
    });
  },

  /**
   * Show error notification
   * @param {string} message - Error message to display
   * @param {object} options - Additional options for toast
   */
  error: (message, options = {}) => {
    toast.error(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show info notification
   * @param {string} message - Info message to display
   * @param {object} options - Additional options for toast
   */
  info: (message, options = {}) => {
    toast.info(message, {
      duration: 3000,
      ...options,
    });
  },

  /**
   * Show warning notification
   * @param {string} message - Warning message to display
   * @param {object} options - Additional options for toast
   */
  warning: (message, options = {}) => {
    toast.warning(message, {
      duration: 3500,
      ...options,
    });
  },

  /**
   * Show loading notification
   * @param {string} message - Loading message to display
   * @returns {string|number} Toast ID for updating/dismissing
   */
  loading: (message) => {
    return toast.loading(message);
  },

  /**
   * Show promise-based notification (auto handles loading/success/error)
   * @param {Promise} promise - Promise to track
   * @param {object} messages - Messages for each state { loading, success, error }
   */
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Processing...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    });
  },

  /**
   * Dismiss a specific toast or all toasts
   * @param {string|number} toastId - Optional toast ID to dismiss
   */
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  /**
   * Show confirmation dialog (alternative to window.confirm)
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Callback when confirmed
   * @param {Function} onCancel - Callback when cancelled
   */
  confirm: (message, onConfirm, onCancel) => {
    toast(message, {
      action: {
        label: 'Confirm',
        onClick: () => onConfirm && onConfirm(),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => onCancel && onCancel(),
      },
      duration: 10000,
    });
  },
};

// Alias for backward compatibility
export const showNotification = notify;

export default notify;
