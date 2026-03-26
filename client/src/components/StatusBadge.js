import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch(status) {
      case 'Applied': return 'status-applied';
      case 'Interview': return 'status-interview';
      case 'Rejected': return 'status-rejected';
      case 'Offer': return 'status-offer';
      default: return '';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      <span className="status-indicator"></span>
      {status}
    </span>
  );
};

export default StatusBadge;