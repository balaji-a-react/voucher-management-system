import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = statusStyles[status] || 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${styles}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
