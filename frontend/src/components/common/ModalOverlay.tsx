import React, { useRef } from 'react';
import { useModalDismiss } from '../../hooks/useModalDismiss';

export interface ModalOverlayProps {
  isOpen?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  children: React.ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  submitOnCtrlEnter?: boolean;
  lockScroll?: boolean;
}

/**
 * Reusable backdrop overlay for modals that handles:
 * 1. Escape key dismissal
 * 2. Click outside (backdrop click) dismissal
 * 3. Ctrl+Enter / Cmd+Enter submission (calls onConfirm, submits inner <form>, or clicks primary button)
 * 4. Body scroll locking
 */
export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  isOpen = true,
  onClose,
  onConfirm,
  children,
  className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in',
  closeOnEscape = true,
  closeOnClickOutside = true,
  submitOnCtrlEnter = true,
  lockScroll = true,
}) => {
  const isBackdropClickRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }

    if (overlayRef.current) {
      // 1. Check if there is an active form inside the modal
      const form = overlayRef.current.querySelector('form');
      if (form) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          const submitBtn = form.querySelector<HTMLButtonElement>(
            'button[type="submit"], input[type="submit"]'
          );
          if (submitBtn) {
            submitBtn.click();
          } else {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
        return;
      }

      // 2. Look for primary confirmation button
      const confirmBtn = overlayRef.current.querySelector<HTMLButtonElement>(
        'button[type="submit"], button[data-confirm="true"], button.btn-primary, button.bg-indigo-600, button.bg-emerald-600, button.bg-rose-600, button.bg-blue-600, button.bg-purple-600, button.bg-amber-800'
      );
      if (confirmBtn && !confirmBtn.disabled) {
        confirmBtn.click();
      }
    }
  };

  useModalDismiss({
    isOpen,
    onClose,
    onConfirm: handleConfirm,
    closeOnEscape,
    submitOnCtrlEnter,
    lockScroll,
  });

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      isBackdropClickRef.current = true;
    } else {
      isBackdropClickRef.current = false;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnClickOutside && e.target === e.currentTarget && isBackdropClickRef.current) {
      onClose();
    }
    isBackdropClickRef.current = false;
  };

  return (
    <div
      ref={overlayRef}
      className={className}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
};
