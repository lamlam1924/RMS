import { useState } from 'react';
import deptManagerService from '../../services/deptManagerService';

/**
 * Hook to manage actions for Job Requests (Submit, Reopen, Delete)
 */
export const useJobRequestActions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (id, note, onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            await deptManagerService.jobRequests.submit(id, note);
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || 'Không thể gửi yêu cầu tuyển dụng.';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reopen = async (id, onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            await deptManagerService.jobRequests.reopen(id);
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            console.error('Reopen error:', err);
            let msg = 'Không thể mở lại yêu cầu.';
            try {
                // Try to parse JSON if backend returned an ActionResponseDto
                const errorData = JSON.parse(err.message);
                msg = errorData.message || msg;
            } catch (e) {
                msg = err.response?.data?.message || err.message || msg;
            }
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteRequest = async (id, onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            await deptManagerService.jobRequests.delete(id);
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || 'Không thể xóa yêu cầu.';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const cancel = async (id, note, onSuccess) => {
        try {
            setLoading(true);
            setError(null);
            await deptManagerService.jobRequests.cancel(id, note);
            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || 'Không thể hủy yêu cầu.';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        submit,
        reopen,
        deleteRequest,
        cancel,
        loading,
        error
    };
};
