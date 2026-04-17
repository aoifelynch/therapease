import { ConfirmModal } from './ConfirmModal';

export function DiscardChangesModal({
  isOpen,
  onCancel,
  onConfirm,
  isBusy = false,
}) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Discard Changes?"
      description="Do you really want to close this page? Your information will not be saved."
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Exit"
      cancelLabel="Keep Editing"
      isBusy={isBusy}
    />
  );
}
