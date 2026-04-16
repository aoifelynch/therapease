import { ModalShell } from '../ModalShell';
import { theme } from '../../utils/theme';
import { withAlpha, formatLongDate, getClientName } from '../../utils/formatters';
import { getPaymentLinkTimingLabel } from '../../utils/calendarUtils';
import { ExternalLinkIcon } from '../../utils/icons';

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  closeDisabled,
  selectedAppointment,
  appointmentDetailsMessage,
  appointmentDetailsBusy,
  selectedAppointmentNotes,
  onOpenClientNote,
  onDeleteAppointment,
  onEditAppointment,
  appointmentBusy,
  appointmentDeleteBusy,
}) {
  return (
    <ModalShell
      isOpen={isOpen}
      title="Appointment Details"
      onClose={onClose}
      closeDisabled={closeDisabled}
      maxWidthClass="max-w-2xl"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-5">
        {selectedAppointment ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: withAlpha(theme.colors.gray[50], 0.78) }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Client</p>
              <p className="mt-1 text-base font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                {getClientName(selectedAppointment.client)}
              </p>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: withAlpha(theme.colors.gray[50], 0.78) }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Date &amp; Time</p>
              <p className="mt-1 text-base font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                {formatLongDate(new Date(selectedAppointment.date))}
              </p>
              <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.8) }}>
                {selectedAppointment.startTime} - {selectedAppointment.endTime}
              </p>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: withAlpha(theme.colors.gray[50], 0.78) }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Session</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div>
                  <p className="text-base font-semibold capitalize" style={{ color: theme.colors.secondary.charcoal }}>
                    {selectedAppointment.type || 'in-person'}
                  </p>
                  <p className="text-sm capitalize" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.8) }}>
                    {selectedAppointment.status || 'upcoming'}
                  </p>
                </div>
                {selectedAppointment.type === 'online' && selectedAppointment.zoomLink ? (
                  <a
                    href={selectedAppointment.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                    style={{ backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.16), color: theme.colors.primary.darker }}
                  >
                    <ExternalLinkIcon />
                    Join Zoom
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: withAlpha(theme.colors.gray[50], 0.78) }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Payment Link</p>
              <p className="mt-1 text-base font-semibold capitalize" style={{ color: theme.colors.secondary.charcoal }}>
                {getPaymentLinkTimingLabel(selectedAppointment.paymentLinkTiming)}
              </p>
              <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.8) }}>
                {selectedAppointment.quotedAmount ? `€${Number(selectedAppointment.quotedAmount).toFixed(2)}` : 'No amount set'}
              </p>
            </div>
          </div>
        ) : null}

        {appointmentDetailsMessage && (
          <div
            className="rounded-xl px-3 py-2 text-sm"
            style={{
              backgroundColor: withAlpha(theme.colors.error.bg, 0.9),
              border: `1px solid ${theme.colors.error.border}`,
              color: theme.colors.error.text,
            }}
          >
            {appointmentDetailsMessage}
          </div>
        )}

        <div className="rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: withAlpha(theme.colors.gray[50], 0.74) }}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>
              Appointment Notes
            </h3>
            {appointmentDetailsBusy && (
              <span className="text-xs font-medium" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.7) }}>
                Loading notes...
              </span>
            )}
          </div>

          <div className="mt-3 space-y-3">
            {!appointmentDetailsBusy && selectedAppointmentNotes.length === 0 && (
              <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.75) }}>
                No notes attached to this appointment.
              </p>
            )}

            {selectedAppointmentNotes.map((note) => (
              <button
                key={note.id || note._id}
                type="button"
                onClick={() => onOpenClientNote(note)}
                className="w-full rounded-xl border px-3 py-3 text-left transition-opacity hover:opacity-90"
                style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.85), backgroundColor: theme.colors.gray[50] }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                    {note.templateType || 'Note'}
                  </p>
                  <p className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.62) }}>
                    {note.createdAt ? formatLongDate(new Date(note.createdAt)) : ''}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.85) }}>
                  {note.content}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onDeleteAppointment}
            disabled={appointmentBusy || appointmentDeleteBusy}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: withAlpha(theme.colors.error.bg, 0.95),
              color: theme.colors.error.text,
            }}
          >
            Delete Appointment
          </button>

          <button
            type="button"
            onClick={onEditAppointment}
            disabled={appointmentBusy || appointmentDeleteBusy}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: theme.colors.primary.DEFAULT,
              color: theme.colors.gray[50],
            }}
          >
            Edit Appointment
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
