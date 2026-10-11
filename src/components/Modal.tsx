import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

export default function Modal({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className={`pixel-modal ${className}`} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
    if (event.target === dialog.current) {
      const bounds = dialog.current.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }
  }}>
    <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button></div>
    {children}
  </dialog>;
}
