import React from 'react';
import styles from './closeButton.module.less';

const CloseButton = ({ onClick, className }) => {
  return (
    <button aria-label="Close" type="button"
            className={`${styles.closeBtn} ${className || ''}`.trim()}
            onClick={onClick}>
      <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
        <path fill="currentColor" d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4z" />
      </svg>
    </button>
  );
};

export default CloseButton;
