import { ModalShell } from '../ModalShell';
import { theme } from '../../utils/theme';
import { withAlpha, getClientName } from '../../utils/formatters';

export function AppointmentFormModal({
  mode,
  isOpen,
  title,
  onClose,
  closeDisabled,
  form,
  setForm,
  onSubmit,
  isBusy,
  message,
  clients,
  startTimeOptions,
  endTimeOptions,
  addHoursToTime,
  getDefaultFeeByType,
  onCancel,
  timeMessage,
  clearTimeMessage,
}) {
  const isEditMode = mode === 'edit';

  return (
    <ModalShell
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      closeDisabled={closeDisabled}
      className="max-h-[90vh] overflow-y-auto"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
            Client <span style={{ color: theme.colors.error.text }}>*</span>
          </label>
          <select
            value={form.clientId}
            onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
            required
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
          >
            <option value="">Select a client</option>
            {clients.map((client) => {
              const clientId = client.id || client._id;
              return (
                <option key={isEditMode ? `edit-${clientId}` : clientId} value={clientId}>
                  {getClientName(client)}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
            Date <span style={{ color: theme.colors.error.text }}>*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(event) => {
              if (!isEditMode && clearTimeMessage) {
                clearTimeMessage('');
              }
              setForm((current) => ({ ...current, date: event.target.value }));
            }}
            required
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              Start Time <span style={{ color: theme.colors.error.text }}>*</span>
            </label>
            <select
              value={form.startTime}
              onChange={(event) => {
                const nextStartTime = event.target.value;
                const nextEndTime = addHoursToTime(nextStartTime, 1);

                if (!isEditMode && clearTimeMessage) {
                  clearTimeMessage('');
                }

                setForm((current) => ({
                  ...current,
                  startTime: nextStartTime,
                  endTime: nextEndTime,
                }));
              }}
              required
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
            >
              <option value="">Select start time</option>
              {startTimeOptions.map((timeValue) => (
                <option key={`${isEditMode ? 'edit-start' : 'start'}-${timeValue}`} value={timeValue}>{timeValue}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              End Time <span style={{ color: theme.colors.error.text }}>*</span>
            </label>
            <select
              value={form.endTime}
              onChange={(event) => {
                if (!isEditMode && clearTimeMessage) {
                  clearTimeMessage('');
                }
                setForm((current) => ({ ...current, endTime: event.target.value }));
              }}
              required
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
            >
              <option value="">Select end time</option>
              {endTimeOptions.map((timeValue) => (
                <option key={`${isEditMode ? 'edit-end' : 'end'}-${timeValue}`} value={timeValue}>{timeValue}</option>
              ))}
            </select>
          </div>

        </div>
        <p className='text-center text-sm italic' style={{color: theme.colors.primary.darker}}>We will send a reminder text to your client the day before their session.</p>
        {timeMessage && (
          <p className="text-sm" style={{ color: theme.colors.error.text }}>
            {timeMessage}
          </p>
        )}

        <div className={isEditMode ? 'grid gap-3 sm:grid-cols-2' : ''}>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              Session Type <span style={{ color: theme.colors.error.text }}>*</span>
            </label>
            <select
              value={form.type}
              onChange={(event) => {
                const nextType = event.target.value;
                const defaultFee = getDefaultFeeByType(nextType);

                setForm((current) => ({
                  ...current,
                  type: nextType,
                  amount: current.amount || defaultFee,
                }));
              }}
              required
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
            >
              <option value="in-person">In-person</option>
              <option value="online">Online</option>
            </select>
          </div>

          {isEditMode && (
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
              >
                <option value="upcoming">Upcoming</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              Payment Link Timing
            </label>
            <select
              value={form.paymentLinkTiming}
              onChange={(event) => {
                const nextTiming = event.target.value;
                if (isEditMode) {
                  setForm((current) => ({
                    ...current,
                    paymentLinkTiming: nextTiming,
                    autoSendPaymentLink: nextTiming === 'none' ? false : (nextTiming === 'now' ? true : current.autoSendPaymentLink),
                    amount: nextTiming === 'none' ? '' : (current.amount || getDefaultFeeByType(current.type)),
                  }));
                  return;
                }

                setForm((current) => ({
                  ...current,
                  paymentLinkTiming: nextTiming,
                  amount: nextTiming === 'none' ? '' : (current.amount || getDefaultFeeByType(current.type)),
                }));
              }}
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
            >
              <option value="none">Do not send automatically</option>
              <option value="now">Send now</option>
              <option value="before">Send the day before session</option>
              <option value="after">Send after session</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
              Amount (EUR)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              disabled={form.paymentLinkTiming === 'none'}
              className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
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
            onClick={onCancel || onClose}
            disabled={isBusy}
            className="rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: withAlpha(theme.colors.secondary.beige, 0.7),
              color: theme.colors.secondary.charcoal,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy || closeDisabled}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: isBusy ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
              color: theme.colors.gray[50],
            }}
          >
            {isBusy ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Appointment')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
