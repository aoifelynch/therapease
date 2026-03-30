import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import './calendar.css';
import { AppSidebar } from '../components/AppSidebar';
import { appointmentsAPI, clientsAPI } from '../api/api';
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

const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCalendarDateFromQuery = (value) => {
  if (!value) return null;

  const datePortion = String(value).split('T')[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePortion);

  if (!match) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, month, day, 12, 0, 0, 0);
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

const addHoursToTime = (timeValue, hoursToAdd = 1) => {
  if (!timeValue) return '';

  const [hoursValue, minutesValue] = String(timeValue).split(':').map(Number);
  if (Number.isNaN(hoursValue) || Number.isNaN(minutesValue)) return '';

  const totalMinutes = ((hoursValue * 60) + minutesValue + (hoursToAdd * 60)) % (24 * 60);
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
};

const buildTimeOptions = ({ startHour = 0, endHour = 23, minuteStep = 5 } = {}) => {
  const options = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += minuteStep) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }

  return options;
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
  const isCancelled = eventInfo.event.extendedProps.status === 'cancelled';

  return (
    <div className="therapease-event-content">
      <p className="therapease-event-time">{eventInfo.timeText}</p>
      <p className="therapease-event-client">
        {eventInfo.event.title}
        {isCancelled ? ' (Cancelled)' : ''}
      </p>
      <p className="therapease-event-type">{eventType}</p>
    </div>
  );
};

export function Calendar() {
  const { user } = useAuth();
  const calendarRef = useRef(null);
  const [searchParams] = useSearchParams();

  const requestedViewParam = searchParams.get('view');
  const initialRequestedView = (
    requestedViewParam === 'dayGridMonth'
    || requestedViewParam === 'timeGridWeek'
    || requestedViewParam === 'timeGridDay'
  )
    ? requestedViewParam
    : 'timeGridWeek';
  const initialRequestedDate = useMemo(
    () => getCalendarDateFromQuery(searchParams.get('date')),
    [searchParams],
  );

  const [activeNav, setActiveNav] = useState('Calendar');
  const [now, setNow] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [viewRangeLabel, setViewRangeLabel] = useState('');
  const [calendarView, setCalendarView] = useState(initialRequestedView);
  const [appointmentFilter, setAppointmentFilter] = useState(DEFAULT_FILTER);
  const [isViewingCurrentWeek, setIsViewingCurrentWeek] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [createTimeMessage, setCreateTimeMessage] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [appointmentBusy, setAppointmentBusy] = useState(false);
  const [appointmentDeleteBusy, setAppointmentDeleteBusy] = useState(false);
  const [appointmentMessage, setAppointmentMessage] = useState('');
  const [confirmDeleteAppointment, setConfirmDeleteAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    clientId: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'in-person',
    status: 'upcoming',
  });
  const [createForm, setCreateForm] = useState({
    clientId: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'in-person',
  });
  const startTimeOptions = useMemo(() => buildTimeOptions({ startHour: 8, endHour: 21, minuteStep: 5 }), []);
  const endTimeOptions = useMemo(() => buildTimeOptions({ startHour: 8, endHour: 22, minuteStep: 5 }), []);

  const resetCreateForm = () => {
    setCreateForm({
      clientId: '',
      date: '',
      startTime: '',
      endTime: '',
      type: 'in-person',
    });
    setCreateMessage('');
    setCreateTimeMessage('');
  };

  const closeCreateModal = () => {
    if (createBusy) return;
    setShowCreateModal(false);
    resetCreateForm();
  };

  const closeAppointmentModal = () => {
    if (appointmentBusy || appointmentDeleteBusy) return;
    setShowAppointmentModal(false);
    setSelectedAppointmentId('');
    setAppointmentMessage('');
    setConfirmDeleteAppointment(false);
    setAppointmentForm({
      clientId: '',
      date: '',
      startTime: '',
      endTime: '',
      type: 'in-person',
      status: 'upcoming',
    });
  };

  const handleCreateAppointment = async (event) => {
    event.preventDefault();
    setCreateMessage('');
    setCreateTimeMessage('');

    const payload = {
      clientId: createForm.clientId,
      date: createForm.date,
      startTime: createForm.startTime,
      endTime: createForm.endTime,
      type: createForm.type,
      status: 'upcoming',
    };

    if (!payload.clientId || !payload.date || !payload.startTime || !payload.endTime || !payload.type) {
      setCreateMessage('Please complete all required fields.');
      return;
    }

    const requestedStart = buildDateTime(payload.date, payload.startTime);
    const requestedEnd = buildDateTime(payload.date, payload.endTime);
    const requestedDateKey = getDateKey(payload.date);

    const hasTimeConflict = appointments.some((appointment) => {
      if (appointment?.status === 'cancelled') return false;
      if (getDateKey(appointment?.date) !== requestedDateKey) return false;

      const existingStart = buildDateTime(appointment.date, appointment.startTime);
      const existingEnd = buildDateTime(appointment.date, appointment.endTime);

      if (!requestedStart || !requestedEnd || !existingStart || !existingEnd) {
        return false;
      }

      return requestedStart < existingEnd && requestedEnd > existingStart;
    });

    if (hasTimeConflict) {
      setCreateTimeMessage('There is already someone booked for that day and time.');
      return;
    }

    setCreateBusy(true);

    try {
      const response = await appointmentsAPI.create(payload);
      const createdAppointment = response.data;

      const selectedClient = clients.find((client) => {
        const currentClientId = client.id || client._id;
        return String(currentClientId) === String(payload.clientId);
      });

      const appointmentForState = selectedClient
        ? { ...createdAppointment, client: selectedClient }
        : createdAppointment;

      setAppointments((current) => [...current, appointmentForState]);
      closeCreateModal();
    } catch (requestError) {
      const errorStatus = Number(requestError?.response?.status || 0);
      const backendMessage = String(requestError?.response?.data?.message || requestError?.message || '');
      const hasServerConflict = errorStatus === 409 || /already booked|already exists|conflict/i.test(backendMessage);

      if (hasServerConflict) {
        setCreateTimeMessage('There is already someone booked for that day and time.');
      } else {
        setCreateMessage(backendMessage || 'Unable to create appointment');
      }
    } finally {
      setCreateBusy(false);
    }
  };

  const handleEventClick = (eventInfo) => {
    const appointmentId = eventInfo?.event?.id;
    if (!appointmentId) return;

    const appointment = appointments.find((item) => String(item.id || item._id) === String(appointmentId));
    if (!appointment) return;

    const appointmentClientId = typeof appointment.client === 'string'
      ? appointment.client
      : appointment.client?.id || appointment.client?._id || '';

    const normalizedDate = appointment.date
      ? new Date(appointment.date).toISOString().slice(0, 10)
      : '';

    setSelectedAppointmentId(String(appointmentId));
    setAppointmentForm({
      clientId: String(appointmentClientId),
      date: normalizedDate,
      startTime: appointment.startTime || '',
      endTime: appointment.endTime || '',
      type: appointment.type || 'in-person',
      status: appointment.status || 'upcoming',
    });
    setAppointmentMessage('');
    setConfirmDeleteAppointment(false);
    setShowAppointmentModal(true);
  };

  const handleUpdateAppointment = async (event) => {
    event.preventDefault();
    setAppointmentMessage('');

    if (!selectedAppointmentId) {
      setAppointmentMessage('No appointment selected.');
      return;
    }

    const payload = {
      clientId: appointmentForm.clientId,
      date: appointmentForm.date,
      startTime: appointmentForm.startTime,
      endTime: appointmentForm.endTime,
      type: appointmentForm.type,
      status: appointmentForm.status,
    };

    if (!payload.clientId || !payload.date || !payload.startTime || !payload.endTime || !payload.type) {
      setAppointmentMessage('Please complete all required fields.');
      return;
    }

    setAppointmentBusy(true);

    try {
      const response = await appointmentsAPI.update(selectedAppointmentId, payload);
      const updatedAppointment = response.data;

      const selectedClient = clients.find((client) => {
        const currentClientId = client.id || client._id;
        return String(currentClientId) === String(payload.clientId);
      });

      const appointmentForState = selectedClient
        ? { ...updatedAppointment, client: selectedClient }
        : updatedAppointment;

      setAppointments((current) => current.map((item) => {
        const currentId = item.id || item._id;
        return String(currentId) === String(selectedAppointmentId) ? appointmentForState : item;
      }));

      closeAppointmentModal();
    } catch (requestError) {
      setAppointmentMessage(requestError.response?.data?.message || requestError.message || 'Unable to update appointment');
    } finally {
      setAppointmentBusy(false);
    }
  };

  const handleDeleteAppointment = async () => {
    setAppointmentMessage('');

    if (!selectedAppointmentId) {
      setAppointmentMessage('No appointment selected.');
      return;
    }

    setAppointmentDeleteBusy(true);

    try {
      await appointmentsAPI.delete(selectedAppointmentId);
      setAppointments((current) => current.filter((item) => String(item.id || item._id) !== String(selectedAppointmentId)));
      closeAppointmentModal();
    } catch (requestError) {
      setAppointmentMessage(requestError.response?.data?.message || requestError.message || 'Unable to delete appointment');
    } finally {
      setAppointmentDeleteBusy(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadCalendarData = async () => {
      setError('');

      try {
        const [appointmentsResponse, clientsResponse] = await Promise.all([
          appointmentsAPI.getAll(),
          clientsAPI.getAll(),
        ]);
        setAppointments(appointmentsResponse.data || []);
        setClients(clientsResponse.data || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || 'Unable to load calendar data');
      }
    };

    loadCalendarData();
  }, []);

  useEffect(() => {
    if (requestedViewParam === 'timeGridWeek') return;

    if (window.innerWidth < 1024) {
      setCalendarView('timeGridDay');
    }
  }, [requestedViewParam]);

  const calendarEvents = useMemo(() => {
    const filteredAppointments = appointments
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
        const isPast = end ? end.getTime() < now.getTime() : false;

        if (!start || !end) {
          return null;
        }

        return {
          id: appointment.id || appointment._id,
          title,
          start,
          end,
          classNames: [
            `therapease-event-${appointment.type === 'online' ? 'online' : 'inperson'}`,
            ...((appointment.status === 'cancelled' || isPast) ? ['therapease-event-cancelled'] : []),
          ],
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
  }, [appointmentFilter, appointments, now]);

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
              onClick={() => {
                setCreateMessage('');
                setShowCreateModal(true);
              }}
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
                initialDate={initialRequestedDate || undefined}
                headerToolbar={false}
                allDaySlot={false}
                firstDay={1}
                nowIndicator
                height="auto"
                expandRows={false}
                slotMinTime="08:00:00"
                slotMaxTime="21:00:00"
                slotDuration="00:30:00"
                snapDuration="00:15:00"
                slotLabelInterval="01:00"
                dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                events={calendarEvents}
                eventContent={renderCalendarEvent}
                eventClick={handleEventClick}
                datesSet={handleDatesSet}
                eventDisplay="block"
                displayEventTime
                editable={false}
              />
            </div>
          </section>
        </div>
      </main>

      {showAppointmentModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl p-6" style={componentStyles.card}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                Edit Appointment
              </h3>
              <button
                type="button"
                onClick={closeAppointmentModal}
                disabled={appointmentBusy || appointmentDeleteBusy}
                className="rounded-xl px-3 py-1.5 text-sm font-semibold"
                style={{
                  backgroundColor: withAlpha(theme.colors.secondary.beige, 0.7),
                  color: theme.colors.secondary.charcoal,
                }}
              >
                Close
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleUpdateAppointment}>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                  Client <span style={{ color: theme.colors.error.text }}>*</span>
                </label>
                <select
                  value={appointmentForm.clientId}
                  onChange={(event) => setAppointmentForm((current) => ({ ...current, clientId: event.target.value }))}
                  required
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => {
                    const clientId = client.id || client._id;
                    return (
                      <option key={`edit-${clientId}`} value={clientId}>
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
                  value={appointmentForm.date}
                  onChange={(event) => setAppointmentForm((current) => ({ ...current, date: event.target.value }))}
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
                    value={appointmentForm.startTime}
                    onChange={(event) => {
                      const nextStartTime = event.target.value;
                      const nextEndTime = addHoursToTime(nextStartTime, 1);

                      setAppointmentForm((current) => ({
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
                      <option key={`edit-start-${timeValue}`} value={timeValue}>{timeValue}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                    End Time <span style={{ color: theme.colors.error.text }}>*</span>
                  </label>
                  <select
                    value={appointmentForm.endTime}
                    onChange={(event) => setAppointmentForm((current) => ({ ...current, endTime: event.target.value }))}
                    required
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
                  >
                    <option value="">Select end time</option>
                    {endTimeOptions.map((timeValue) => (
                      <option key={`edit-end-${timeValue}`} value={timeValue}>{timeValue}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                    Session Type <span style={{ color: theme.colors.error.text }}>*</span>
                  </label>
                  <select
                    value={appointmentForm.type}
                    onChange={(event) => setAppointmentForm((current) => ({ ...current, type: event.target.value }))}
                    required
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
                  >
                    <option value="in-person">In-person</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                    Status
                  </label>
                  <select
                    value={appointmentForm.status}
                    onChange={(event) => setAppointmentForm((current) => ({ ...current, status: event.target.value }))}
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {appointmentMessage && (
                <div
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{
                    backgroundColor: withAlpha(theme.colors.error.bg, 0.9),
                    border: `1px solid ${theme.colors.error.border}`,
                    color: theme.colors.error.text,
                  }}
                >
                  {appointmentMessage}
                </div>
              )}

              {confirmDeleteAppointment && (
                <div
                  className="rounded-xl px-3 py-3 text-sm"
                  style={{
                    backgroundColor: withAlpha(theme.colors.error.bg, 0.7),
                    border: `1px solid ${theme.colors.error.border}`,
                    color: theme.colors.error.text,
                  }}
                >
                  This action cannot be undone. Delete this appointment?
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAppointment((current) => !current)}
                  disabled={appointmentBusy || appointmentDeleteBusy}
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: withAlpha(theme.colors.error.bg, 0.95),
                    color: theme.colors.error.text,
                  }}
                >
                  {confirmDeleteAppointment ? 'Cancel Delete' : 'Delete Appointment'}
                </button>

                <div className="flex items-center gap-2">
                  {confirmDeleteAppointment && (
                    <button
                      type="button"
                      onClick={handleDeleteAppointment}
                      disabled={appointmentBusy || appointmentDeleteBusy}
                      className="rounded-xl px-4 py-2 text-sm font-semibold"
                      style={{
                        backgroundColor: appointmentDeleteBusy ? withAlpha(theme.colors.error.text, 0.6) : theme.colors.error.text,
                        color: theme.colors.gray[50],
                      }}
                    >
                      {appointmentDeleteBusy ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={appointmentBusy || appointmentDeleteBusy}
                    className="rounded-xl px-4 py-2 text-sm font-semibold"
                    style={{
                      backgroundColor: appointmentBusy ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
                      color: theme.colors.gray[50],
                    }}
                  >
                    {appointmentBusy ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-lg rounded-3xl p-6" style={componentStyles.card}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                Create Appointment
              </h3>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={createBusy}
                className="rounded-xl px-3 py-1.5 text-sm font-semibold"
                style={{
                  backgroundColor: withAlpha(theme.colors.secondary.beige, 0.7),
                  color: theme.colors.secondary.charcoal,
                }}
              >
                Close
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateAppointment}>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                  Client <span style={{ color: theme.colors.error.text }}>*</span>
                </label>
                <select
                  value={createForm.clientId}
                  onChange={(event) => setCreateForm((current) => ({ ...current, clientId: event.target.value }))}
                  required
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => {
                    const clientId = client.id || client._id;
                    return (
                      <option key={clientId} value={clientId}>
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
                  value={createForm.date}
                  onChange={(event) => {
                    setCreateTimeMessage('');
                    setCreateForm((current) => ({ ...current, date: event.target.value }));
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
                    value={createForm.startTime}
                    onChange={(event) => {
                      const nextStartTime = event.target.value;
                      const nextEndTime = addHoursToTime(nextStartTime, 1);

                      setCreateTimeMessage('');

                      setCreateForm((current) => ({
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
                      <option key={`start-${timeValue}`} value={timeValue}>{timeValue}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                    End Time <span style={{ color: theme.colors.error.text }}>*</span>
                  </label>
                  <select
                    value={createForm.endTime}
                    onChange={(event) => {
                      setCreateTimeMessage('');
                      setCreateForm((current) => ({ ...current, endTime: event.target.value }));
                    }}
                    required
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
                  >
                    <option value="">Select end time</option>
                    {endTimeOptions.map((timeValue) => (
                      <option key={`end-${timeValue}`} value={timeValue}>{timeValue}</option>
                    ))}
                  </select>
                </div>
              </div>

              {createTimeMessage && (
                <p className="text-sm" style={{ color: theme.colors.error.text }}>
                  {createTimeMessage}
                </p>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                  Session Type <span style={{ color: theme.colors.error.text }}>*</span>
                </label>
                <select
                  value={createForm.type}
                  onChange={(event) => setCreateForm((current) => ({ ...current, type: event.target.value }))}
                  required
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: theme.colors.secondary.charcoal }}
                >
                  <option value="in-person">In-person</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {createMessage && (
                <div
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{
                    backgroundColor: withAlpha(theme.colors.error.bg, 0.9),
                    border: `1px solid ${theme.colors.error.border}`,
                    color: theme.colors.error.text,
                  }}
                >
                  {createMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={createBusy}
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
                  disabled={createBusy}
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: createBusy ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
                    color: theme.colors.gray[50],
                  }}
                >
                  {createBusy ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
