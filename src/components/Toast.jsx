import React from 'react';

export default function Toast({ message, type = 'success', onClose }) {
    return (
        <div className={`toast ${type}`} onClick={onClose}>
            <span>{type === 'success' ? '✅' : '❌'}</span>
            <span>{message}</span>
        </div>
    );
}
