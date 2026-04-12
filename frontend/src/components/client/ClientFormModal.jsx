import { ModalShell } from '../ModalShell';
import { theme } from '../../utils/theme';
import { componentStyles } from '../../utils/componentStyles';
import { withAlpha } from '../../utils/formatters';

export function ClientFormModal({
  isOpen,
  title,
  onClose,
  closeDisabled,
  form,
  setForm,
  onSubmit,
  isBusy,
  message,
  todayDateKey,
  submitLabel,
  emailPlaceholder = '',
  phonePlaceholder = '',
  addressPlaceholder = '',
  profileNotesPlaceholder = '',
  emergencyContactNamePlaceholder = '',
  emergencyContactPhonePlaceholder = '',
}) {
  return (
    <ModalShell
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      closeDisabled={closeDisabled}
      className="max-h-[90vh] overflow-y-auto"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              First Name <span style={{ color: theme.colors.error.text }}>*</span>
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              placeholder="First name"
              required
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              Last Name <span style={{ color: theme.colors.error.text }}>*</span>
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              placeholder="Last name"
              required
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
            Email <span style={{ color: theme.colors.error.text }}>*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder={emailPlaceholder}
            required
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
            Phone <span style={{ color: theme.colors.error.text }}>*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder={phonePlaceholder}
            required
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
            Date of Birth <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
          </label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
            max={todayDateKey}
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
            Address <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            placeholder={addressPlaceholder}
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
            Profile Notes <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
          </label>
          <textarea
            value={form.profileNotes}
            onChange={(event) => setForm((current) => ({ ...current, profileNotes: event.target.value }))}
            placeholder={profileNotesPlaceholder}
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              Emergency Contact Name <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              value={form.emergencyContactName}
              onChange={(event) => setForm((current) => ({ ...current, emergencyContactName: event.target.value }))}
              placeholder={emergencyContactNamePlaceholder}
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              Emergency Contact Phone <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="tel"
              value={form.emergencyContactPhone}
              onChange={(event) => setForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))}
              placeholder={emergencyContactPhonePlaceholder}
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
            />
          </div>
        </div>

        {message && (
          <div
            className="rounded-xl px-3 py-2 text-sm"
            style={{
              backgroundColor: withAlpha(theme.colors.error.bg, 0.9),
              border: `1px solid ${theme.colors.error.border}`,
              color: theme.colors.error.text,
            }}
          >
            {message}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: withAlpha(theme.colors.secondary.beige, 0.7),
              color: theme.colors.secondary.charcoal,
              cursor: isBusy ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: isBusy ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
              color: theme.colors.gray[50],
              cursor: isBusy ? 'not-allowed' : 'pointer',
            }}
          >
            {isBusy ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
