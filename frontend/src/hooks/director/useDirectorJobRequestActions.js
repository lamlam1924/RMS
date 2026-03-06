import { useState } from 'react';
import directorService from '../../services/directorService';

/**
 * Hook to manage Director actions for Job Requests (Approve, Reject, Return)
 */
export const useDirectorJobRequestActions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Approve one or multiple job requests
     * @param {number|number[]} ids - Single ID or array of IDs
     * @param {string} comment - Optional approval comment
     * @param {Function} onSuccess - Callback after successful approval
     */
    const approve = async (ids, comment = '', onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            
            const idsArray = Array.isArray(ids) ? ids : [ids];
            
            await Promise.all(
                idsArray.map(id => directorService.jobRequests.approve(id, comment))
            );
            
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Không thể phê duyệt yêu cầu.';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reject one or multiple job requests
     * @param {number|number[]} ids - Single ID or array of IDs
     * @param {string} comment - Required rejection reason
     * @param {Function} onSuccess - Callback after successful rejection
     */
    const reject = async (ids, comment, onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            
            if (!comment || !comment.trim()) {
                throw new Error('Vui lòng nhập lý do từ chối.');
            }
            
            const idsArray = Array.isArray(ids) ? ids : [ids];
            
            await Promise.all(
                idsArray.map(id => directorService.jobRequests.reject(id, comment))
            );
            
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Không thể từ chối yêu cầu.';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Return one or multiple job requests for revision
     * @param {number|number[]} ids - Single ID or array of IDs
     * @param {string} comment - Required reason for return
     * @param {Function} onSuccess - Callback after successful return
     */
    const returnRequest = async (ids, comment, onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            
            if (!comment || !comment.trim()) {
                throw new Error('Vui lòng nhập lý do yêu cầu chỉnh sửa.');
            }
            
            const idsArray = Array.isArray(ids) ? ids : [ids];
            
            await Promise.all(
                idsArray.map(id => directorService.jobRequests.returnJobRequest(id, comment))
            );
            
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Không thể trả lại yêu cầu.';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        approve,
        reject,
        returnRequest,
        loading,
        error
    };
};
