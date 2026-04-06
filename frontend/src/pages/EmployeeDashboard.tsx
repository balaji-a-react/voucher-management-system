import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getVouchers,
  createVoucher,
  updateVoucher,
  submitVoucher,
  Voucher,
  VoucherStatus,
} from '../api/vouchers';
import StatusBadge from '../components/StatusBadge';
import axios from 'axios';

const Spinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | 'ALL'>('ALL');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [resubmitAfterSave, setResubmitAfterSave] = useState(false);

  // Per-voucher action loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
      const response = await getVouchers(page, 50);
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

  // Close modal on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForm) closeForm();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showForm]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openCreateForm = () => {
    setEditingVoucher(null);
    setFormTitle('');
    setFormDescription('');
    setFormAmount('');
    setFormError('');
    setResubmitAfterSave(false);
    setShowForm(true);
  };

  const openEditForm = (voucher: Voucher, resubmit = false) => {
    setEditingVoucher(voucher);
    setFormTitle(voucher.title);
    setFormDescription(voucher.description);
    setFormAmount(String(voucher.amount));
    setFormError('');
    setResubmitAfterSave(resubmit);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVoucher(null);
    setResubmitAfterSave(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid positive amount.');
      setFormLoading(false);
      return;
    }

    try {
      if (editingVoucher) {
        const updated = await updateVoucher(editingVoucher.id, {
          title: formTitle,
          description: formDescription,
          amount,
        });
        // Auto-submit if "Edit & Resubmit"
        if (resubmitAfterSave) {
          await submitVoucher(updated.id);
        }
      } else {
        await createVoucher({
          title: formTitle,
          description: formDescription,
          amount,
        });
      }
      closeForm();
      await fetchVouchers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError('Operation failed. Please try again.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitForReview = async (id: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await submitVoucher(id);
      await fetchVouchers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorWithAutoClear(err.response.data.error);
      } else {
        setErrorWithAutoClear('Failed to submit voucher.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredVouchers =
    statusFilter === 'ALL'
      ? vouchers
      : vouchers.filter((v) => v.status === statusFilter);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Employee Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
              Filter by status:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VoucherStatus | 'ALL')}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="ALL">All</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button
            onClick={openCreateForm}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            + New Voucher
          </button>
        </div>

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
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-4xl mb-3">📋</div>
            <p className="text-gray-500">
              {statusFilter === 'ALL'
                ? 'No vouchers found. Create one to get started.'
                : `No ${statusFilter.toLowerCase()} vouchers found.`}
            </p>
          </div>
        ) : (
          <>
            {/* Voucher cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVouchers.map((voucher) => {
                const isActionLoading = actionLoadingId === voucher.id;
                return (
                  <div
                    key={voucher.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900 truncate pr-2">
                        {voucher.title}
                      </h3>
                      <StatusBadge status={voucher.status} />
                    </div>

                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {formatCurrency(voucher.amount)}
                    </p>

                    <p className="text-xs text-gray-400 mb-3">{formatDate(voucher.createdAt)}</p>

                    <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                      {voucher.description}
                    </p>

                    {voucher.status === 'REJECTED' && voucher.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-600">{voucher.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                      {voucher.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => openEditForm(voucher)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSubmitForReview(voucher.id)}
                            disabled={isActionLoading}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                          >
                            {isActionLoading && <Spinner />}
                            {isActionLoading ? 'Submitting...' : 'Submit for Review'}
                          </button>
                        </>
                      )}
                      {voucher.status === 'REJECTED' && (
                        <button
                          onClick={() => openEditForm(voucher, true)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600 transition-colors"
                        >
                          Edit &amp; Resubmit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Create/Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingVoucher
                ? resubmitAfterSave
                  ? 'Edit & Resubmit Voucher'
                  : 'Edit Voucher'
                : 'Create Voucher'}
            </h2>

            {editingVoucher?.rejectionReason && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs font-semibold text-red-700 mb-1">
                  Previous Rejection Reason
                </p>
                <p className="text-sm text-red-600">{editingVoucher.rejectionReason}</p>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="vTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="vTitle"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="vDesc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="vDesc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label htmlFor="vAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  id="vAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {formLoading && <Spinner />}
                  {formLoading
                    ? 'Saving...'
                    : editingVoucher
                    ? resubmitAfterSave
                      ? 'Save & Resubmit'
                      : 'Save Changes'
                    : 'Create Voucher'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={formLoading}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
