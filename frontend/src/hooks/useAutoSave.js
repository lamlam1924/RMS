import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for auto-saving form data to localStorage
 * @param {Object} data - Form data to save
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Save interval in milliseconds (default: 30000 = 30s)
 * @param {string} options.key - LocalStorage key (required)
 * @param {boolean} options.enabled - Enable/disable auto-save (default: true)
 * @returns {Object} - { lastSaved, clearDraft, hasDraft }
 */
export function useAutoSave(data, options = {}) {
  const {
    interval = 30000, // 30 seconds
    key,
    enabled = true,
  } = options;

  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(null);

  // Validate key
  if (!key) {
    throw new Error('useAutoSave: "key" option is required');
  }

  const saveDraft = useCallback(() => {
    if (!enabled || !data) return;

    try {
      // Only save if data has changed
      const currentData = JSON.stringify(data);
      if (currentData === previousDataRef.current) {
        return;
      }

      localStorage.setItem(key, currentData);
      localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
      previousDataRef.current = currentData;
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [data, enabled, key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      setLastSaved(null);
      previousDataRef.current = null;
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key]);

  const hasDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(key);
      return draft !== null;
    } catch (error) {
      console.error('Failed to check draft:', error);
      return false;
    }
  }, [key]);

  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(key);
      const timestamp = localStorage.getItem(`${key}_timestamp`);
      
      if (draft) {
        return {
          data: JSON.parse(draft),
          timestamp: timestamp ? new Date(timestamp) : null,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [key]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveDraft();
    }, interval);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, interval, enabled, saveDraft]);

  // Save on page unload (beforeunload)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      saveDraft();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveDraft]);

  return {
    lastSaved,
    clearDraft,
    hasDraft,
    loadDraft,
    saveDraft, // Manual save trigger
  };
}
