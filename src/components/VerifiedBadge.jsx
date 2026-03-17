import React from 'react';
import { BadgeCheck } from 'lucide-react';

const VerifiedBadge = ({ size = 'md', className = '', title = 'Verified Account' }) => {
  const sizes = { sm: 16, md: 20, lg: 24 };
  const px = sizes[size] || sizes.md;

  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      title={title}
      role="img"
      aria-label={title}
    >
      <BadgeCheck
        size={px}
        color="#FFFFFF"
        fill="#3B82F6"
        className="drop-shadow-sm"
      />
    </span>
  );
};

export default VerifiedBadge;
