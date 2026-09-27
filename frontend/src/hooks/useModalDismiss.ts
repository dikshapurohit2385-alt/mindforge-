import { useEffect } from 'react';

export interface UseModalDismissOptions {
  isOpen?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  closeOnEscape?: boolean;
  submitOnCtrlEnter?: boolean;
  lockScroll?: boolean;
}

/**
 * Hook to manage modal dismissal via Escape key, submission via Ctrl+Enter / Cmd+Enter,
 * and body scroll locking.
 */
export function useModalDismiss({
  isOpen = true,
  onClose,
  onConfirm,
  closeOnEscape = true,
  submitOnCtrlEnter = true,
  lockScroll = true,
}: UseModalDismissOptions) {
  useEffect(() => {
    if (!isOpen) return;

    // Handle Keyboard shortcuts: Escape to close, Ctrl+Enter / Cmd+Enter to confirm
    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (submitOnCtrlEnter && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (onConfirm) {
          event.preventDefault();
          event.stopPropagation();
          onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Body scroll lock
    let originalOverflow = '';
    if (lockScroll) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (lockScroll) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [isOpen, onClose, onConfirm, closeOnEscape, submitOnCtrlEnter, lockScroll]);
}
