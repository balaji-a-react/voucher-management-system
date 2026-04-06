import api from './axios';

export type VoucherStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Voucher {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: VoucherStatus;
  rejectionReason: string | null;
  createdBy: string;
  creator: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse {
  data: Voucher[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getVouchers = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse> => {
  const response = await api.get<PaginatedResponse>('/vouchers', { params: { page, limit } });
  return response.data;
};

export const getVoucherById = async (id: string): Promise<Voucher> => {
  const response = await api.get<Voucher>(`/vouchers/${id}`);
  return response.data;
};

export const createVoucher = async (data: { title: string; description: string; amount: number }): Promise<Voucher> => {
  const response = await api.post<Voucher>('/vouchers', data);
  return response.data;
};

export const updateVoucher = async (id: string, data: { title: string; description: string; amount: number }): Promise<Voucher> => {
  const response = await api.put<Voucher>(`/vouchers/${id}`, data);
  return response.data;
};

export const deleteVoucher = async (id: string): Promise<void> => {
  await api.delete(`/vouchers/${id}`);
};

export const submitVoucher = async (id: string): Promise<Voucher> => {
  const response = await api.post<Voucher>(`/vouchers/${id}/submit`);
  return response.data;
};

export const approveVoucher = async (id: string): Promise<Voucher> => {
  const response = await api.post<Voucher>(`/vouchers/${id}/approve`);
  return response.data;
};

export const rejectVoucher = async (id: string, rejectionReason: string): Promise<Voucher> => {
  const response = await api.post<Voucher>(`/vouchers/${id}/reject`, { rejectionReason });
  return response.data;
};
