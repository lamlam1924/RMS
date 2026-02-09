import { useState } from 'react';
import hrService from '../../../services/hrService';

/**
 * Hook to manage actions for Job Requests (Forward, Return)
 */
export const useHRJobRequestActions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const forward = async (id, note, onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            await hrService.jobRequests.forwardToDirector(id, note);
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            const msg = err.message || 'Không thể chuyển tiếp yêu cầu.';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const returnRequest = async (id, note, onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            await hrService.jobRequests.returnToDeptManager(id, note);
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            const msg = err.message || 'Không thể gửi trả lại yêu cầu.';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        forward,
        returnRequest,
        loading,
        error
    };
};
