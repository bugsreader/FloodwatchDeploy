import React from 'react';

const StationStatusBadge = ({ status }) => {
  let badgeClass = 'bg-secondary';
  let iconClass = 'bi-question-circle';

  switch (status) {
    case 'Normal':
      badgeClass = 'bg-success';
      iconClass = 'bi-check-circle-fill';
      break;
    case 'Alert':
      badgeClass = 'bg-warning text-dark';
      iconClass = 'bi-exclamation-triangle-fill';
      break;
    case 'Warning':
      badgeClass = 'bg-orange text-dark';
      iconClass = 'bi-exclamation-circle-fill';
      break;
    case 'Danger':
      badgeClass = 'bg-danger';
      iconClass = 'bi-x-octagon-fill';
      break;
    default:
      badgeClass = 'bg-secondary';
      break;
  }

  // To support custom orange class, ensure it's in CSS or use inline style for warning
  const style = status === 'Warning' ? { backgroundColor: '#fd7e14' } : {};

  return (
    <span className={`badge ${badgeClass} rounded-pill px-3 py-2`} style={style}>
      <i className={`bi ${iconClass} me-2`}></i>
      {status}
    </span>
  );
};

export default StationStatusBadge;
