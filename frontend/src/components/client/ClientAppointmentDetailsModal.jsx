import { ModalShell } from '../ModalShell';
import { theme } from '../../utils/theme';
import { withAlpha, formatLongDate, formatCurrency } from '../../utils/formatters';
import { getAppointmentNotes, getPaymentLinkTimingLabel } from '../../utils/clientProfileUtils';
import { ExternalLinkIcon } from '../../utils/icons';

export function ClientAppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  clientName,
  notes,
  appointmentDetailsBusy = false,
  selectedAppointmentNotes = [],
  onOpenClientNote,
}) {
  const appointmentNotes = selectedAppointmentNotes.length > 0
    ? selectedAppointmentNotes
    : getAppointmentNotes(appointment, notes);

  return (
    <ModalShell
      isOpen={isOpen}
      title="Appointment Details"
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      className="max-h-[90vh] overflow-y-auto"
    >
      {appointment ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: withAlpha(theme.colors.gray[50], 0.78) }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Client</p>
              <p className="mt-1 text-base font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                {clientName}
              </p>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: withAlpha(theme.colors.gray[50], 0.78) }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Date &amp; Time</p>
              <p className="mt-1 text-base font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                {formatLongDate(new Date(appointment.date))}
              </p>
              <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.8) }}>
                {appointment.startTime} - {appointment.endTime}
              </p>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: withAlpha(theme.colors.gray[50], 0.78) }}>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Session</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-base font-semibold capitalize" style={{ color: theme.colors.secondary.charcoal }}>
                                {appointment.type || 'in-person'}
                              </p>
                              <p className="text-sm capitalize" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.8) }}>
                                {appointment.status || 'upcoming'}
                              </p>
                            </div>
                            {appointment.type === 'online' && appointment.zoomLink ? (
                              <a
                                href={appointment.zoomLink}
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
              <p className="mt-1 text-base font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                {getPaymentLinkTimingLabel(appointment.paymentLinkTiming)}
              </p>
              <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.8) }}>
                {appointment.quotedAmount ? formatCurrency(appointment.quotedAmount) : 'No amount set'}
              </p>
            </div>
          </div>

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
              {!appointmentDetailsBusy && appointmentNotes.length === 0 && (
                <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                  No notes attached to this appointment.
                </p>
              )}

              {appointmentNotes.map((note) => (
                <button
                  key={note.id || note._id}
                  type="button"
                  onClick={() => onOpenClientNote?.(note)}
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

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: theme.colors.primary.DEFAULT, color: theme.colors.gray[50] }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
