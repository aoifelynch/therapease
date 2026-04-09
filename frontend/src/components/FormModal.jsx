import { ModalShell } from './ModalShell';

export const FormModal = ({
  isOpen,
  title,
  onClose,
  closeDisabled = false,
  maxWidthClass = 'max-w-lg',
  overlayStyle,
  children,
}) => {
  return (
    <ModalShell
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      closeDisabled={closeDisabled}
      maxWidthClass={maxWidthClass}
      overlayStyle={overlayStyle}
      className="max-h-[90vh] overflow-y-auto"
    >
      {children}
    </ModalShell>
  );
};
