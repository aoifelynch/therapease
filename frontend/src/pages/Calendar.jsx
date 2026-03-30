import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';
import { AppSidebar } from '../components/AppSidebar';
import { appointmentsAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../utils/theme';
import { componentStyles } from '../utils/componentStyles';
import { withAlpha, formatLongDate, formatClock, getClientName } from '../utils/formatters';

const DEFAULT_FILTER = 'all';

const getWeekStart = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const [hours, minutes] = String(timeValue).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  date.setHours(hours, minutes, 0, 0);
  return date;
};

const getViewRangeLabel = (rangeStart, rangeEnd) => {
  if (!(rangeStart instanceof Date) || Number.isNaN(rangeStart.getTime())) return '';
  if (!(rangeEnd instanceof Date) || Number.isNaN(rangeEnd.getTime())) return '';

  const inclusiveEnd = new Date(rangeEnd);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);

  const sameYear = rangeStart.getFullYear() === inclusiveEnd.getFullYear();
  const sameMonth = rangeStart.getMonth() === inclusiveEnd.getMonth() && sameYear;

  if (sameMonth) {
    return new Intl.DateTimeFormat('en-IE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).formatRange(rangeStart, inclusiveEnd);
  }

  if (sameYear) {
    const startText = new Intl.DateTimeFormat('en-IE', {
      month: 'short',
      day: 'numeric',
    }).format(rangeStart);

    const endText = new Intl.DateTimeFormat('en-IE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(inclusiveEnd);

    return `${startText} - ${endText}`;
  }

  return new Intl.DateTimeFormat('en-IE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).formatRange(rangeStart, inclusiveEnd);
};

const renderCalendarEvent = (eventInfo) => {
  const eventType = eventInfo.event.extendedProps.type === 'online' ? 'Online' : 'In-Person';

  return (
    <div className="therapease-event-content">
      <p className="therapease-event-time">{eventInfo.timeText}</p>
      <p className="therapease-event-client">{eventInfo.event.title}</p>
      <p className="therapease-event-type">{eventType}</p>
    </div>
  );
};

export function Calendar() {
  const { user } = useAuth();
  const calendarRef = useRef(null);

  const [activeNav, setActiveNav] = useState('Calendar');
  const [now, setNow] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [viewRangeLabel, setViewRangeLabel] = useState('');
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  const [appointmentFilter, setAppointmentFilter] = useState(DEFAULT_FILTER);
  const [isViewingCurrentWeek, setIsViewingCurrentWeek] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadCalendarData = async () => {
      setError('');

      try {
        const appointmentsResponse = await appointmentsAPI.getAll();
        setAppointments(appointmentsResponse.data || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || 'Unable to load calendar data');
      }
    };

    loadCalendarData();
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setCalendarView('timeGridDay');
    }
  }, []);

  const calendarEvents = useMemo(() => {
    const filteredAppointments = appointments
      .filter((appointment) => appointment.status !== 'cancelled')
      .filter((appointment) => {
        if (appointmentFilter === 'all') return true;
        if (appointmentFilter === 'online') return appointment.type === 'online';
        if (appointmentFilter === 'in-person') return appointment.type === 'in-person';
        return true;
      });

    return filteredAppointments
      .map((appointment) => {
        const clientValue = appointment.client;
        const client = typeof clientValue === 'object' && clientValue !== null ? clientValue : null;

        const title = getClientName(client);
        const start = buildDateTime(appointment.date, appointment.startTime);
        const end = buildDateTime(appointment.date, appointment.endTime);

        if (!start || !end) {
          return null;
        }

        return {
          id: appointment.id || appointment._id,
          title,
          start,
          end,
          classNames: [`therapease-event-${appointment.type === 'online' ? 'online' : 'inperson'}`],
          extendedProps: {
            type: appointment.type,
            status: appointment.status,
          },
        };
      })
      .filter(Boolean)
      .sort((first, second) => {
        const timeCompare = new Date(first.start).getTime() - new Date(second.start).getTime();
        if (timeCompare !== 0) return timeCompare;
        return first.title.localeCompare(second.title);
      });
  }, [appointmentFilter, appointments]);

  const handleDatesSet = (dateInfo) => {
    setViewRangeLabel(getViewRangeLabel(dateInfo.start, dateInfo.end));

    const todayWeekStart = getWeekStart(new Date());
    const visibleWeekStart = getWeekStart(dateInfo.start);

    setIsViewingCurrentWeek(
      Boolean(todayWeekStart && visibleWeekStart && todayWeekStart.getTime() === visibleWeekStart.getTime()),
    );
  };

  const handleViewChange = (nextView) => {
    setCalendarView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  };

  const goToPreviousRange = () => {
    calendarRef.current?.getApi().prev();
  };

  const goToNextRange = () => {
    calendarRef.current?.getApi().next();
  };

  const goToCurrentWeek = () => {
    calendarRef.current?.getApi().today();
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}>
      <AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={user} />

      <main className="h-screen flex-1 overflow-y-auto">
        <header
          className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4 md:px-8"
          style={{
            backgroundColor: withAlpha(theme.colors.gray[50], 0.92),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}`,
          }}
        >
          <h1 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
            Welcome, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <span className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>
            {formatLongDate(now)} {formatClock(now)}
          </span>
        </header>

        <div className="space-y-5 px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-semibold leading-tight" style={{ color: theme.colors.secondary.charcoal }}>
              Your Calendar
            </h2>
            <button
              type="button"
              className="rounded-2xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: theme.colors.primary.light,
                color: theme.colors.gray[50],
                boxShadow: `0 12px 20px ${withAlpha(theme.colors.primary.dark, 0.25)}`,
              }}
            >
              Create Appointment
            </button>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text, border: `1px solid ${theme.colors.error.border}` }}>
              {error}
            </div>
          )}

          <section className="rounded-3xl p-4 md:p-5" style={componentStyles.card}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex items-center rounded-xl border px-2 py-1"
                  style={{
                    borderColor: withAlpha(theme.colors.secondary.beige, 0.9),
                    backgroundColor: withAlpha(theme.colors.gray[50], 0.85),
                  }}
                >
                  <button
                    type="button"
                    aria-label="Previous date range"
                    onClick={goToPreviousRange}
                    className="rounded-lg px-2 py-1 text-sm font-semibold"
                    style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.7) }}
                  >
                    ‹
                  </button>
                  <span className="px-2 text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                    {viewRangeLabel || 'Select range'}
                  </span>
                  <button
                    type="button"
                    aria-label="Next date range"
                    onClick={goToNextRange}
                    className="rounded-lg px-2 py-1 text-sm font-semibold"
                    style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.7) }}
                  >
                    ›
                  </button>
                </div>

                {calendarView === 'timeGridWeek' && !isViewingCurrentWeek && (
                  <button
                    type="button"
                    onClick={goToCurrentWeek}
                    className="rounded-xl border px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: withAlpha(theme.colors.primary.DEFAULT, 0.35),
                      color: theme.colors.primary.darker,
                      backgroundColor: withAlpha(theme.colors.secondary.sage, 0.55),
                    }}
                  >
                    This Week
                  </button>
                )}

                <label className="sr-only" htmlFor="calendar-view">Change calendar view</label>
                <select
                  id="calendar-view"
                  value={calendarView}
                  onChange={(event) => handleViewChange(event.target.value)}
                  className="rounded-xl border pl-3 pr-7 py-2 text-sm font-medium"
                  style={{
                    borderColor: withAlpha(theme.colors.secondary.beige, 0.92),
                    color: theme.colors.secondary.charcoal,
                    backgroundColor: withAlpha(theme.colors.gray[50], 0.9),
                  }}
                >
                  <option value="dayGridMonth">Change View: Month</option>
                  <option value="timeGridWeek">Change View: Week</option>
                  <option value="timeGridDay">Change View: Day</option>
                </select>

                <label className="sr-only" htmlFor="calendar-filter-sort">Filter appointments</label>
                <select
                  id="calendar-filter-sort"
                  value={appointmentFilter}
                  onChange={(event) => {
                    setAppointmentFilter(event.target.value || DEFAULT_FILTER);
                  }}
                  className="rounded-xl border pl-3 pr-7 py-2 text-sm font-medium"
                  style={{
                    borderColor: withAlpha(theme.colors.secondary.beige, 0.92),
                    color: theme.colors.secondary.charcoal,
                    backgroundColor: withAlpha(theme.colors.gray[50], 0.9),
                  }}
                >
                  <option value="all">All</option>
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
            </div>

            <div className="therapease-calendar-wrapper">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={calendarView}
                headerToolbar={false}
                allDaySlot={false}
                firstDay={1}
                nowIndicator
                height="auto"
                expandRows={false}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                snapDuration="00:15:00"
                slotLabelInterval="01:00"
                dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                events={calendarEvents}
                eventContent={renderCalendarEvent}
                datesSet={handleDatesSet}
                eventDisplay="block"
                displayEventTime
                editable={false}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
