import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { PageHeader } from '../components/PageHeader';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmModal } from '../components/ConfirmModal';
import { useLiveNow } from '../hooks/useLiveNow';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import { AppDataTable } from '../components/AppDataTable';
import { appointmentsAPI, clientsAPI, paymentsAPI, remindersAPI, todosAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../utils/theme';
import { withAlpha, isSameDay, startOfWeek, startOfMonth, formatCurrency, formatLongDate, formatClock, getClientName } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';
import { quickActions } from '../constants/sidebarConstants';
import {
  ExternalLinkIcon, EditIcon, CheckIcon, ArrowUpIcon, TrashIcon,
} from '../utils/icons';

export function Dashboard() {
  const location = useLocation();
  const { user } = useAuth();
  const remindersSectionRef = useRef(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todoTitle, setTodoTitle] = useState('');
  const [todoSubmitting, setTodoSubmitting] = useState(false);
  const [todoBusyId, setTodoBusyId] = useState(null);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reminderIssues, setReminderIssues] = useState([]);
  const [payments, setPayments] = useState([]);
  const [todos, setTodos] = useState([]);
  const [showDeleteTodoModal, setShowDeleteTodoModal] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);
  const [deleteTodoBusy, setDeleteTodoBusy] = useState(false);
  const [deleteTodoMessage, setDeleteTodoMessage] = useState('');
  const [reminderTypeFilter, setReminderTypeFilter] = useState('no-filter');
  const now = useLiveNow();

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [clientsResponse, appointmentsResponse, issuesResponse, paymentsResponse, todosResponse] = await Promise.all([
          clientsAPI.getAll(),
          appointmentsAPI.getAll(),
          remindersAPI.getIssues(),
          paymentsAPI.getAll(),
          todosAPI.getAll(),
        ]);

        setClients(clientsResponse.data || []);
        setAppointments(appointmentsResponse.data || []);
        setReminderIssues(issuesResponse.data || []);
        setPayments(paymentsResponse.data || []);
        setTodos(todosResponse.data || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Filters and calculations
  const toAppointmentDateTime = (appointment, timeValue) => {
    if (!appointment?.date || !timeValue) return null;

    const [hours, minutes] = String(timeValue).split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const value = new Date(appointment.date);
    value.setHours(hours, minutes, 0, 0);
    return Number.isNaN(value.getTime()) ? null : value;
  };

  const formatAppointmentTimeRange = (appointment) => {
    const appointmentStartTime = toAppointmentDateTime(appointment, appointment.startTime);
    const appointmentEndTime = toAppointmentDateTime(appointment, appointment.endTime);

    if (appointmentStartTime && appointmentEndTime) {
      return `${formatClock(appointmentStartTime)} - ${formatClock(appointmentEndTime)}`;
    }

    if (appointmentStartTime) {
      return formatClock(appointmentStartTime);
    }

    return formatClock(new Date(appointment.date));
  };

  const todayAppointments = appointments.filter((appointment) => isSameDay(new Date(appointment.date), now));
  const upcomingAppointments = todayAppointments
    .filter((appointment) => {
      if (appointment.status !== 'upcoming') return false;
      const appointmentEndTime = toAppointmentDateTime(appointment, appointment.endTime);
      return appointmentEndTime ? appointmentEndTime > now : false;
    })
    .sort((first, second) => {
      const firstStart = toAppointmentDateTime(first, first.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const secondStart = toAppointmentDateTime(second, second.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return firstStart - secondStart;
    })
    .slice(0, 50);
  const dashboardUpcomingAppointments = upcomingAppointments.slice(0, 3);
  const hasMoreUpcomingAppointments = upcomingAppointments.length > dashboardUpcomingAppointments.length;
  const pendingPayments = payments.filter((payment) => payment.status === 'pending');
  const paidPayments = payments.filter((payment) => payment.status === 'paid');
  const pendingTodos = todos.filter((todo) => !todo.completed);
  const totalClients = clients.filter(Boolean).length;

  const activeClients = useMemo(() => {
    const activeClientIds = new Set();

    clients.forEach((client) => {
      const clientId = client.id || client._id;
      if (!clientId) return;

      const nextAppointment = appointments
        .filter((appointment) => {
          const appointmentClientId = typeof appointment.client === 'string'
            ? appointment.client
            : appointment.client?.id || appointment.client?._id;
          return appointmentClientId === clientId && appointment.status !== 'cancelled';
        })
        .map((appointment) => ({
          ...appointment,
          dateTime: toAppointmentDateTime(appointment, appointment.startTime),
        }))
        .filter((appointment) => appointment.dateTime && appointment.dateTime >= now)
        .sort((first, second) => first.dateTime - second.dateTime)[0] || null;

      if (nextAppointment) {
        activeClientIds.add(clientId);
      }
    });

    return activeClientIds.size;
  }, [appointments, clients, now]);

  const startWeek = startOfWeek(now);
  const startMonth = startOfMonth(now);
  const weeklyRevenue = paidPayments.reduce((total, payment) => (
    new Date(payment.createdAt) >= startWeek ? total + (payment.amount || 0) : total
  ), 0);
  const monthlyRevenue = paidPayments.reduce((total, payment) => (
    new Date(payment.createdAt) >= startMonth ? total + (payment.amount || 0) : total
  ), 0);
  const outstandingBalance = pendingPayments.reduce((total, payment) => total + (payment.amount || 0), 0);

  const onlineToday = todayAppointments.filter((appointment) => appointment.type === 'online').length;
  const inPersonToday = todayAppointments.filter((appointment) => appointment.type === 'in-person').length;
  const clientLookup = clients.reduce((lookup, client) => {
    lookup[client.id || client._id] = getClientName(client);
    return lookup;
  }, {});

  const allReminders = useMemo(() => ([...reminderIssues]), [reminderIssues]);

  const groupedReminders = useMemo(() => {
    const grouped = {};
    allReminders.forEach((reminder) => {
      const clientId = reminder.client;
      if (!grouped[clientId]) {
        grouped[clientId] = [];
      }
      grouped[clientId].push(reminder);
    });
    return grouped;
  }, [allReminders]);

  const remindersByClient = useMemo(() => {
    return Object.entries(groupedReminders).map(([clientId, clientReminders]) => {
      const firstReminder = clientReminders[0];
      const descriptions = clientReminders
        .map((r) => r.description.replace(/^is /, '').replace(/\.$/, ''))
        .join(', ');
      return {
        client: clientId,
        status: firstReminder.status,
        type: firstReminder.type,
        description: descriptions,
        count: clientReminders.length,
        rawReminders: clientReminders,
      };
    });
  }, [groupedReminders]);

  const focusedClientId = location.state?.clientId || null;
  const focusedReminderType = location.state?.reminderType || null;

  const prioritizedRemindersByClient = useMemo(() => {
    if (!focusedClientId && !focusedReminderType) return remindersByClient;

    return [...remindersByClient].sort((first, second) => {
      const firstMatch = (focusedClientId ? first.client === focusedClientId : true)
        && (focusedReminderType ? first.type === focusedReminderType : true);
      const secondMatch = (focusedClientId ? second.client === focusedClientId : true)
        && (focusedReminderType ? second.type === focusedReminderType : true);

      if (firstMatch === secondMatch) return 0;
      return firstMatch ? -1 : 1;
    });
  }, [remindersByClient, focusedClientId, focusedReminderType]);

  const filteredRemindersByClient = useMemo(() => {
    if (reminderTypeFilter === 'no-filter') {
      return prioritizedRemindersByClient;
    }

    return prioritizedRemindersByClient.filter((reminderGroup) => {
      const reminderTypes = new Set((reminderGroup.rawReminders || []).map((reminder) => reminder.type));

      if (reminderTypeFilter === 'missing-notes') {
        return reminderTypes.has('missing-notes') || reminderGroup.type === 'missing-notes';
      }

      return Array.from(reminderTypes).some((type) => type && type !== 'missing-notes')
        || (reminderGroup.type && reminderGroup.type !== 'missing-notes');
    });
  }, [prioritizedRemindersByClient, reminderTypeFilter]);

  useEffect(() => {
    const shouldFocusReminders = location.hash === '#reminders' || location.state?.focusReminders;

    if (!shouldFocusReminders || loading) return;

    remindersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, location.hash, location.state, prioritizedRemindersByClient.length]);

  // Stats cards data
  const statCards = [
    {
      label: 'Appointments Today',
      value: String(todayAppointments.length),
      sub: `${onlineToday} online, ${inPersonToday} in-person`,
      color: theme.colors.error.border,
      accent: theme.colors.error.text,
    },
    {
      label: 'Outstanding Payments',
      value: formatCurrency(outstandingBalance),
      sub: `${pendingPayments.length} payment${pendingPayments.length === 1 ? '' : 's'} pending`,
      color: theme.colors.secondary.beige,
      accent: theme.colors.primary.dark,
    },
    {
      label: 'Pending Tasks',
      value: String(pendingTodos.length),
      sub: `${todos.length} total task${todos.length === 1 ? '' : 's'} tracked`,
      color: theme.colors.primary.lighter,
      accent: theme.colors.primary.darker,
    },
    {
      label: 'Active Clients',
      value: String(activeClients),
      sub: `${activeClients} active client${activeClients === 1 ? '' : 's'} out of ${totalClients} client${totalClients === 1 ? '' : 's'}`,
      color: theme.colors.secondary.sage,
      accent: theme.colors.primary.DEFAULT,
    },
  ];

  // Todo CRUD
  const handleCreateTodo = async (event) => {
    event.preventDefault();
    const trimmedTitle = todoTitle.trim();

    if (!trimmedTitle) {
      setError('Task title is required');
      return;
    }

    setTodoSubmitting(true);
    setError('');

    try {
      const response = await todosAPI.create({ title: trimmedTitle });
      setTodos((current) => [response.data, ...current]);
      setTodoTitle('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || requestError.message || 'Unable to create task');
    } finally {
      setTodoSubmitting(false);
    }
  };

  const handleToggleTodo = async (todo) => {
    setTodoBusyId(todo.id || todo._id);
    setError('');

    try {
      const response = await todosAPI.update(todo.id || todo._id, {
        completed: !todo.completed,
      });

      setTodos((current) => current.map((item) => (
        (item.id || item._id) === (todo.id || todo._id) ? response.data : item
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || requestError.message || 'Unable to update task');
    } finally {
      setTodoBusyId(null);
    }
  };

  const closeDeleteTodoModal = () => {
    if (deleteTodoBusy) return;
    setShowDeleteTodoModal(false);
    setTodoToDelete(null);
    setDeleteTodoMessage('');
  };

  const handleDeleteTodo = (todoId) => {
    setTodoToDelete({ id: todoId });
    setDeleteTodoMessage('');
    setShowDeleteTodoModal(true);
  };

  const handleConfirmDeleteTodo = async () => {
    if (!todoToDelete?.id) return;

    setDeleteTodoBusy(true);
    setDeleteTodoMessage('');

    try {
      await todosAPI.delete(todoToDelete.id);
      setTodos((current) => current.filter((item) => (item.id || item._id) !== todoToDelete.id));
      closeDeleteTodoModal();
    } catch (requestError) {
      setDeleteTodoMessage(requestError.response?.data?.error || requestError.response?.data?.message || requestError.message || 'Unable to delete task');
    } finally {
      setDeleteTodoBusy(false);
    }
  };

  const handleDeleteAppointmentFromDashboard = async (appointmentId) => {
    if (!appointmentId) return;

    const shouldDelete = window.confirm('Delete this appointment? This cannot be undone.');
    if (!shouldDelete) return;

    setError('');

    try {
      await appointmentsAPI.delete(appointmentId);
      setAppointments((current) => current.filter((item) => String(item.id || item._id) !== String(appointmentId)));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to delete appointment');
    }
  };

  // Render
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}>
      <AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={user} />

      {/* Main content area */}
      <main className="h-screen flex-1 overflow-y-auto">
        <PageHeader
          userName={user?.name}
          now={now}
          actions={(
            <div className="flex flex-wrap justify-end gap-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const compactLabel = action.label === 'Add Client Profile' ? 'Add Client' : action.label;
                const isPrimaryAction = action.label === 'New Appointment';

                return (
                  <Link
                    key={action.label}
                    to={action.to || '/dashboard'}
                    state={action.state}
                    className="inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-semibold no-underline transition-opacity hover:opacity-90"
                    style={isPrimaryAction
                      ? {
                        backgroundColor: theme.colors.primary.DEFAULT,
                        color: theme.colors.gray[50],
                      }
                      : {
                        backgroundColor: withAlpha(theme.colors.secondary.sage, 0.72),
                        color: theme.colors.secondary.charcoal,
                        border: `1px solid ${withAlpha(theme.colors.primary.light, 0.55)}`,
                      }}
                  >
                    <span className="inline-flex h-4.5 w-4.5 items-center justify-center">
                      <Icon />
                    </span>
                    {compactLabel}
                  </Link>
                );
              })}
            </div>
          )}
        />

        <div className="space-y-6 px-6 py-6 md:px-8">
          {/* Error alert */}
          <ErrorAlert message={error} />

          {/* Stats Cards */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          {/* Appointments & Revenue */}
          <section className="grid gap-4 xl:grid-cols-[2.5fr_0.9fr]">
            {/* Appointments Table */}
            <SectionCard title="Today's Upcoming Appointments" bodyClassName="space-y-0" paddingClassName="p-6 pb-3">
              <AppDataTable
                tableClassName="text-base"
                headerCellClassName="text-[0.8rem]"
                columns={[
                  { key: 'time', label: 'Time', widthClassName: 'w-[20%]', headerClassName: 'pl-4 pr-3' },
                  { key: 'client', label: 'Client', widthClassName: 'w-[20%]', headerClassName: 'pl-2 pr-2' },
                  { key: 'location', label: 'Location', widthClassName: 'w-[20%]', headerClassName: 'pl-2 pr-1' },
                  { key: 'status', label: 'Status', widthClassName: 'w-[20%]', headerClassName: 'pl-1 pr-2' },
                  { key: 'action', label: 'Action', widthClassName: 'w-[16%]', headerClassName: 'pl-2 pr-3' },
                ]}
                rows={dashboardUpcomingAppointments}
                rowKey={(appointment) => appointment._id || appointment.id}
                renderRow={(appointment) => {
                  const tone = componentStyles.getStatusTone(appointment.status);
                  const hasZoom = appointment.type === 'online' && appointment.zoomLink;
                  const appointmentId = appointment._id || appointment.id;
                  const appointmentClient = typeof appointment.client === 'object' && appointment.client ? appointment.client : null;
                  const appointmentClientId = appointmentClient?.id || appointmentClient?._id || (typeof appointment.client === 'string' ? appointment.client : '');
                  const clientName = getClientName(appointment.client);

                  return (
                    <>
                      <td className="py-3 pl-4 pr-3 font-medium" style={{ color: theme.colors.secondary.charcoal }}>{formatAppointmentTimeRange(appointment)}</td>
                      <td className="px-2 py-3">
                        {appointmentClientId ? (
                          <Link
                            to={`/clients/${appointmentClientId}`}
                            className="font-medium transition-opacity hover:opacity-70 no-underline"
                            style={{ color: theme.colors.secondary.charcoal }}
                          >
                            {clientName}
                          </Link>
                        ) : (
                          <span className="font-medium" style={{ color: theme.colors.secondary.charcoal }}>{clientName}</span>
                        )}
                      </td>
                      <td className="py-3 pl-2 pr-1">{appointment.type === 'online' ? 'Online' : 'In-person'}</td>
                      <td className="py-3 pl-1 pr-2">
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: tone.background, color: tone.color }}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-start gap-1.5">
                          

                          {hasZoom ? (
                            <a
                              href={appointment.zoomLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                              style={{ backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.16), color: theme.colors.primary.darker }}
                            >
                              <ExternalLinkIcon />
                              Join
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                              style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.65), color: theme.colors.secondary.charcoal }}
                            >
                              <EditIcon />
                              View
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointmentFromDashboard(appointmentId)}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                            style={{ backgroundColor: withAlpha(theme.colors.error.bg, 0.92), color: theme.colors.error.text }}
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  );
                }}
                loading={loading}
                loadingMessage="Loading appointments..."
                emptyMessage="Your schedule is clear today, take a moment for yourself!"
                loadingCellClassName="px-4 py-4 text-sm"
                emptyCellClassName="px-4 py-4 text-sm"
              />

              {!loading && hasMoreUpcomingAppointments && (
                <div className="pt-2 pr-3 flex justify-end">
                  <Link
                    to={`/calendar?view=timeGridWeek&date=${now.toISOString().slice(0, 10)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold no-underline transition-opacity hover:opacity-80"
                    style={{ color: theme.colors.primary.darker }}
                  >
                    View all
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}
            </SectionCard>

            {/* Revenue Overview */}
            <SectionCard
              title="Revenue Overview"
              className="h-full flex flex-col"
              bodyClassName="flex-1 flex flex-col"
              paddingClassName="p-6"
            >

              <div className="border-b pb-5" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9) }}>
                <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>Weekly</p>
                <p className="text-2xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>{formatCurrency(weeklyRevenue)}</p>
                <div className="mt-2 flex items-center gap-2" style={{ color: theme.colors.primary.DEFAULT }}>
                  <ArrowUpIcon />
                  <span className="text-sm font-medium">Paid sessions since {formatLongDate(startWeek)}</span>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>Monthly</p>
                <p className="text-2xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>{formatCurrency(monthlyRevenue)}</p>
                <div className="mt-2 flex items-center gap-2" style={{ color: theme.colors.primary.DEFAULT }}>
                  <ArrowUpIcon />
                  <span className="text-sm font-medium">Paid sessions this month</span>
                </div>
              </div>

              <div className="mt-auto pt-5 flex justify-end">
                <Link
                  to="/payments"
                  className="inline-flex items-center gap-1 text-xs font-semibold no-underline transition-opacity hover:opacity-80"
                  style={{ color: theme.colors.primary.darker }}
                >
                  See More
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </SectionCard>
          </section>

          {/* Reminders & To-Do */}
          <section className="grid items-start gap-4 xl:grid-cols-2">
            {/* Reminders */}
            <SectionCard
              title="Reminders"
              action={(
                <div className="flex items-center gap-2">
                  <label htmlFor="dashboard-reminder-type-filter" className="sr-only">Filter reminders by type</label>
                  <select
                    id="dashboard-reminder-type-filter"
                    value={reminderTypeFilter}
                    onChange={(event) => setReminderTypeFilter(event.target.value)}
                    className="min-w-[11.5rem] rounded-lg pl-2.5 pr-7 py-1 text-xs font-medium outline-none"
                    style={{
                      backgroundColor: withAlpha(theme.colors.secondary.cream, 0.95),
                      border: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.95)}`,
                      color: theme.colors.secondary.charcoal,
                    }}
                  >
                    <option value="no-filter">No filter</option>
                    <option value="missing-notes">Missing notes</option>
                    <option value="missing-profile-details">Missing profile details</option>
                  </select>
                  <span className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.5) }}>
                    {allReminders.length} total
                  </span>
                </div>
              )}
              className="scroll-mt-6 h-[22rem] flex flex-col"
              bodyClassName="space-y-1.5 flex-1 overflow-y-auto pr-1"
            >

              <div className="space-y-1.5">
                {(loading ? [] : filteredRemindersByClient).map((reminderGroup) => {
                  const tone = componentStyles.getReminderTone(reminderGroup.status);
                  const reminderClient = clientLookup[reminderGroup.client] || 'Practice reminder';
                  const isFocusedReminder = Boolean(
                    (focusedClientId ? reminderGroup.client === focusedClientId : true)
                    && (focusedReminderType ? reminderGroup.type === focusedReminderType : true)
                    && (focusedClientId || focusedReminderType),
                  );

                  return (
                    <Link
                      to={`/clients/${reminderGroup.client}`}
                      state={{ openEditClientModal: true }}
                      key={reminderGroup.client}
                      className="group flex items-start gap-2.5 rounded-xl px-2.5 py-1.5 no-underline transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: withAlpha(theme.colors.gray[50], 0.88),
                        border: '1px solid transparent',
                      }}
                    >
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
                      <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.82) }}>
                        <span className="font-semibold underline-offset-2 group-hover:underline" style={{ color: theme.colors.secondary.charcoal }}>{reminderClient}</span>{' '}
                        is {reminderGroup.description}{reminderGroup.count > 1 ? ' (and more)' : ''}.
                      </p>
                    </Link>
                  );
                })}

                {!loading && allReminders.length === 0 && (
                  <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                    No reminders, you're on top of your session notes and client details!
                  </p>
                )}

                {!loading && allReminders.length > 0 && filteredRemindersByClient.length === 0 && (
                  <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                    No reminders found for this type.
                  </p>
                )}
              </div>
            </SectionCard>

            {/* To-Do List */}
            <SectionCard title="To-Do List" className="h-[22rem] flex flex-col" bodyClassName="flex flex-1 flex-col">

              <form onSubmit={handleCreateTodo} className="mb-5 flex gap-3">
                <input
                  type="text"
                  value={todoTitle}
                  onChange={(event) => setTodoTitle(event.target.value)}
                  placeholder="Add a task"
                  className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: withAlpha(theme.colors.secondary.cream, 0.95),
                    border: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.95)}`,
                    color: theme.colors.secondary.charcoal,
                  }}
                />
                <button
                  type="submit"
                  disabled={todoSubmitting}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: todoSubmitting ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
                    color: theme.colors.gray[50],
                    cursor: todoSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Add Task
                </button>
              </form>

              <div className="mt-1 flex-1 space-y-2 overflow-y-auto pr-1">
                {(loading ? [] : todos).map((todo) => (
                  <div key={todo.id || todo._id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors" style={{ backgroundColor: todo.completed ? withAlpha(theme.colors.secondary.sage, 0.55) : 'transparent' }}>
                    <button
                      type="button"
                      aria-label={todo.completed ? 'Mark task incomplete' : 'Mark task complete'}
                      onClick={() => handleToggleTodo(todo)}
                      disabled={todoBusyId === (todo.id || todo._id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{
                        border: `1.5px solid ${todo.completed ? theme.colors.primary.dark : theme.colors.primary.DEFAULT}`,
                        color: theme.colors.gray[50],
                        backgroundColor: todo.completed ? theme.colors.primary.DEFAULT : withAlpha(theme.colors.primary.lighter, 0.18),
                        cursor: todoBusyId === (todo.id || todo._id) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {todo.completed && <CheckIcon />}
                    </button>
                    <p className="flex-1 text-sm leading-tight" style={{ color: todo.completed ? withAlpha(theme.colors.secondary.charcoal, 0.45) : withAlpha(theme.colors.secondary.charcoal, 0.8), textDecoration: todo.completed ? 'line-through' : 'none' }}>
                      {todo.title}
                    </p>
                    <button
                      type="button"
                      aria-label="Delete task"
                      onClick={() => handleDeleteTodo(todo.id || todo._id)}
                      disabled={todoBusyId === (todo.id || todo._id)}
                      className="ml-auto rounded-lg p-1.5"
                      style={{
                        color: withAlpha(theme.colors.secondary.charcoal, 0.55),
                        backgroundColor: withAlpha(theme.colors.secondary.beige, 0.45),
                        cursor: todoBusyId === (todo.id || todo._id) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}

                {!loading && todos.length === 0 && (
                  <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                    No tasks yet. Add your first task above.
                  </p>
                )}
              </div>
            </SectionCard>
          </section>
        </div>

        <ConfirmModal
          isOpen={showDeleteTodoModal}
          title="Delete Task"
          description="This action cannot be undone. Are you sure you want to delete this task?"
          errorMessage={deleteTodoMessage}
          onCancel={closeDeleteTodoModal}
          onConfirm={handleConfirmDeleteTodo}
          isBusy={deleteTodoBusy}
          confirmLabel="Delete Task"
          overlayStyle={{ backgroundColor: 'rgba(18, 24, 28, 0.42)' }}
        />
      </main>
    </div>
  );
}

export default Dashboard;
