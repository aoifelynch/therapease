import { formatEventTime } from '../../utils/calendarUtils';

export function CalendarEventContent({ eventInfo }) {
  const eventType = eventInfo.event.extendedProps.type === 'online' ? 'Online' : 'In-Person';
  const isCancelled = eventInfo.event.extendedProps.status === 'cancelled';
  const startTime = formatEventTime(eventInfo.event.start);
  const endTime = formatEventTime(eventInfo.event.end);
  const timeLabel = startTime && endTime ? `${startTime} - ${endTime}` : (eventInfo.timeText || '');

  return (
    <div className="therapease-event-content">
      <div className="therapease-event-meta">
        <span className="therapease-event-time">{timeLabel}</span>
        <span className="therapease-event-type">{eventType}</span>
      </div>
      <p className="therapease-event-client">
        {eventInfo.event.title}
        {isCancelled ? ' (Cancelled)' : ''}
      </p>
    </div>
  );
}

export const renderCalendarEvent = (eventInfo) => (
  <CalendarEventContent eventInfo={eventInfo} />
);
