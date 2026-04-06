import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getVouchers,
  approveVoucher,
  rejectVoucher,
  deleteVoucher,
  Voucher,
} from '../api/vouchers';
import StatusBadge from '../components/StatusBadge';
import axios from 'axios';

const Spinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Per-row action loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reject modal state
  const [rejectingVoucher, setRejectingVoucher] = useState<Voucher | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState('');

  // Delete modal state
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Error auto-clear
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const setErrorWithAutoClear = useCallback((msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (msg) {
      errorTimerRef.current = setTimeout(() => setError(''), 5000);
    }
  }, []);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setErrorWithAutoClear('');
    try {
      const response = await getVouchers(page, 10);
      setVouchers(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorWithAutoClear(err.response.data.error);
      } else {
        setErrorWithAutoClear('Failed to load vouchers.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, setErrorWithAutoClear]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Close modals on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (rejectingVoucher && !rejectLoading) closeRejectModal();
        if (deletingVoucher && !deleteLoading) closeDeleteModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [rejectingVoucher, rejectLoading, deletingVoucher, deleteLoading]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleApprove = async (id: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await approveVoucher(id);
      await fetchVouchers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorWithAutoClear(err.response.data.error);
      } else {
        setErrorWithAutoClear('Failed to approve voucher.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (voucher: Voucher) => {
    setRejectingVoucher(voucher);
    setRejectionReason('');
    setRejectError('');
  };

  const closeRejectModal = () => {
    setRejectingVoucher(null);
    setRejectionReason('');
    setRejectError('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectingVoucher) return;
    if (!rejectionReason.trim()) {
      setRejectError('Please provide a reason for rejection.');
      return;
    }
    setRejectLoading(true);
    setRejectError('');
    try {
      await rejectVoucher(rejectingVoucher.id, rejectionReason);
      closeRejectModal();
      await fetchVouchers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setRejectError(err.response.data.error);
      } else {
        setRejectError('Failed to reject voucher.');
      }
    } finally {
      setRejectLoading(false);
    }
  };

  const openDeleteModal = (voucher: Voucher) => {
    setDeletingVoucher(voucher);
  };

  const closeDeleteModal = () => {
    setDeletingVoucher(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVoucher) return;
    setDeleteLoading(true);
    try {
      await deleteVoucher(deletingVoucher.id);
      closeDeleteModal();
      await fetchVouchers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorWithAutoClear(err.response.data.error);
      } else {
        setErrorWithAutoClear('Failed to delete voucher.');
      }
      closeDeleteModal();
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-3 text-red-500 hover:text-red-700 font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="h-8 w-8 text-blue-600" />
              <span className="text-sm text-gray-500">Loading vouchers...</span>
            </div>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-4xl mb-3">📋</div>
            <p className="text-gray-500">No vouchers found.</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Employee</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vouchers.map((voucher) => {
                      const isRowLoading = actionLoadingId === voucher.id;
                      return (
                        <tr key={voucher.id} className={`hover:bg-gray-50 transition-colors ${isRowLoading ? 'opacity-60' : ''}`}>
                          <td className="px-4 py-3 text-gray-900">{voucher.creator?.name ?? 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{voucher.title}</td>
                          <td className="px-4 py-3 text-gray-900 text-right font-medium">
                            {formatCurrency(voucher.amount)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(voucher.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={voucher.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {voucher.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(voucher.id)}
                                    disabled={isRowLoading}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
                                  >
                                    {isRowLoading && <Spinner className="h-3 w-3" />}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(voucher)}
                                    disabled={isRowLoading}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => openDeleteModal(voucher)}
                                disabled={isRowLoading}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Reject Modal */}
      {rejectingVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget && !rejectLoading) closeRejectModal(); }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reject Voucher</h2>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting <span className="font-medium">"{rejectingVoucher.title}"</span> by{' '}
              {rejectingVoucher.creator?.name ?? 'Unknown'}
            </p>

            {rejectError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {rejectError}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                placeholder="Explain why this voucher is being rejected..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRejectSubmit}
                disabled={rejectLoading}
                className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                {rejectLoading && <Spinner />}
                {rejectLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button
                onClick={closeRejectModal}
                disabled={rejectLoading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget && !deleteLoading) closeDeleteModal(); }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete Voucher</h2>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">"{deletingVoucher.title}"</span> by{' '}
              {deletingVoucher.creator?.name ?? 'Unknown'}?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
              >
                {deleteLoading && <Spinner />}
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 py-2 px-4 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
