/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { generateId } from '../utils/ui-utils';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const addToast = useCallback((message, type = 'info') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirmAction = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        message,
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, confirmAction }}>
      {children}
      
      {/* Toasts Portal */}
      <div className="global-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`global-toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
              {toast.type === 'error' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              )}
              {toast.type === 'warning' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              )}
              {toast.type === 'info' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              )}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal Portal */}
      {confirmModal.isOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3 style={{ marginTop: 0, fontSize: 18, color: "var(--text)" }}>Confirm Action</h3>
            <p style={{ color: "var(--text-sub)", fontSize: 14, margin: "16px 0 24px" }}>
              {confirmModal.message}
            </p>
            <div className="confirm-modal-actions">
              <button className="btn secondary" onClick={confirmModal.onCancel}>Cancel</button>
              <button className="btn danger" onClick={confirmModal.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
