import React from 'react';
import { format } from 'date-fns';

const DateBadge = ({ date }) => {
  // Handle the date properly
  const formattedDate = date ? new Date(date) : new Date();
  
  return (
    <div className="date-badge">
      <span className="date-day">{format(formattedDate, 'dd')}</span>
      <span className="date-month">{format(formattedDate, 'MMM yyyy')}</span>
    </div>
  );
};

export default DateBadge;