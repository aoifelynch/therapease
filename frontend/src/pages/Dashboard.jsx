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
import { withAlpha, isSameDay, startOfWeek, startOfMonth, formatCurrency, formatLongDate, formatTime, getClientName } from '../utils/formatters';
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

  const todayAppointments = appointments.filter((appointment) => isSameDay(new Date(appointment.date), now));
  const upcomingAppointments = todayAppointments
    .filter((appointment) => {
      if (appointment.status !== 'upcoming') return false;
      const appointmentEndTime = toAppointmentDateTime(appointment, appointment.endTime);
      return appointmentEndTime ? appointmentEndTime > now : false;
    })
    .sort((first, second) => {
      const firstEnd = toAppointmentDateTime(first, first.endTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const secondEnd = toAppointmentDateTime(second, second.endTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return firstEnd - secondEnd;
    })
    .slice(0, 5);
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

  // Render
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}>
      <AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={user} />

      {/* Main content area */}
      <main className="h-screen flex-1 overflow-y-auto">
        <PageHeader userName={user?.name} now={now} />

        <div className="space-y-6 px-6 py-6 md:px-8">
          {/* Error alert */}
          <ErrorAlert message={error} />

          {/* Stats Cards */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          {/* Quick Actions & Reminders */}
          <section className="grid gap-4 xl:grid-cols-2">
            {/* Quick Actions */}
            <SectionCard title="Quick Actions">
              <div className="flex flex-wrap justify-around gap-5">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.label}
                      to={action.to || '/dashboard'}
                      state={action.state}
                      className="flex min-w-[120px] flex-col items-center gap-3 no-underline"
                    >
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-full transition-colors"
                        style={{
                          backgroundColor: theme.colors.primary.DEFAULT,
                          color: theme.colors.gray[50],
                          boxShadow: `0 10px 18px ${withAlpha(theme.colors.primary.dark, 0.25)}`,
                        }}
                      >
                        <Icon />
                      </div>
                      <span className="max-w-[100px] text-center text-sm font-medium leading-tight" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72) }}>
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </SectionCard>

            {/* Reminders */}
            <SectionCard
              title="Reminders"
              action={(
                <span className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.5) }}>
                  {allReminders.length} total
                </span>
              )}
              className="scroll-mt-6"
              bodyClassName="space-y-3"
            >

              {(loading ? [] : prioritizedRemindersByClient.slice(0, 6)).map((reminderGroup) => {
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
                      key={reminderGroup.client}
                      className="flex items-start gap-3 rounded-2xl px-3 py-3 no-underline transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: tone.background,
                        border: isFocusedReminder ? `1px solid ${withAlpha(theme.colors.primary.DEFAULT, 0.55)}` : '1px solid transparent',
                      }}
                    >
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
                      <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.82) }}>
                        <span className="font-semibold" style={{ color: theme.colors.secondary.charcoal }}>{reminderClient}</span>{' '}
                        is {reminderGroup.description}{reminderGroup.count > 1 ? ' (and more)' : ''}.
                      </p>
                    </Link>
                  );
                })}

                {!loading && allReminders.length === 0 && (
                  <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                    No reminders yet.
                  </p>
                )}
            </SectionCard>
          </section>

          {/* Appointments & Revenue */}
          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            {/* Appointments Table */}
            <SectionCard title="Upcoming Appointments" bodyClassName="space-y-0">
              <p className="mb-6 text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.5) }}>
                {formatLongDate(now)}
              </p>

              <AppDataTable
                columns={[
                  { key: 'time', label: 'Time', widthClassName: 'w-[16%]', headerClassName: 'pl-4 pr-3' },
                  { key: 'client', label: 'Client', widthClassName: 'w-[26%]' },
                  { key: 'location', label: 'Location', widthClassName: 'w-[24%]' },
                  { key: 'status', label: 'Status', widthClassName: 'w-[18%]' },
                  { key: 'action', label: 'Action', widthClassName: 'w-[16%]', headerClassName: 'pl-3 pr-4' },
                ]}
                rows={upcomingAppointments}
                rowKey={(appointment) => appointment._id || appointment.id}
                renderRow={(appointment) => {
                  const tone = componentStyles.getStatusTone(appointment.status);
                  const hasZoom = appointment.type === 'online' && appointment.zoomLink;

                  return (
                    <>
                      <td className="py-3 pl-4 font-medium" style={{ color: theme.colors.secondary.charcoal }}>{formatTime(appointment)}</td>
                      <td className="py-3">{getClientName(appointment.client)}</td>
                      <td className="py-3">{appointment.type === 'online' ? 'Online' : 'In-person'}</td>
                      <td className="py-3">
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ backgroundColor: tone.background, color: tone.color }}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {hasZoom ? (
                          <a
                            href={appointment.zoomLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            style={{ backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.16), color: theme.colors.primary.darker }}
                          >
                            <ExternalLinkIcon />
                            Join Zoom
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold"
                            style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.65), color: theme.colors.secondary.charcoal }}
                          >
                            <EditIcon />
                            View
                          </button>
                        )}
                      </td>
                    </>
                  );
                }}
                loading={loading}
                loadingMessage="Loading appointments..."
                emptyMessage="No appointments scheduled yet."
              />
            </SectionCard>

            {/* Revenue Overview */}
            <SectionCard title="Revenue Overview" bodyClassName="space-y-0">

              <div className="mb-5">
                <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>Weekly</p>
                <p className="text-2xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>{formatCurrency(weeklyRevenue)}</p>
                <div className="mt-2 flex items-center gap-2" style={{ color: theme.colors.primary.DEFAULT }}>
                  <ArrowUpIcon />
                  <span className="text-xs font-medium">Paid sessions since {formatLongDate(startWeek)}</span>
                </div>
              </div>

              <div className="border-t pt-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9) }}>
                <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>Monthly</p>
                <p className="text-2xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>{formatCurrency(monthlyRevenue)}</p>
                <div className="mt-2 flex items-center gap-2" style={{ color: theme.colors.primary.DEFAULT }}>
                  <ArrowUpIcon />
                  <span className="text-xs font-medium">Paid sessions this month</span>
                </div>
              </div>
            </SectionCard>
          </section>

          {/* Todos & Unpaid Sessions */}
          <section className="grid gap-4 xl:grid-cols-2">
            {/* To-Do List */}
            <SectionCard title="To-Do List">

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

              <div className="space-y-3">
                {(loading ? [] : todos.slice(0, 8)).map((todo) => (
                  <div key={todo.id || todo._id} className="flex items-start gap-3 rounded-2xl px-2 py-2 transition-colors" style={{ backgroundColor: todo.completed ? withAlpha(theme.colors.secondary.sage, 0.55) : 'transparent' }}>
                    <button
                      type="button"
                      aria-label={todo.completed ? 'Mark task incomplete' : 'Mark task complete'}
                      onClick={() => handleToggleTodo(todo)}
                      disabled={todoBusyId === (todo.id || todo._id)}
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{
                        border: `1.5px solid ${todo.completed ? theme.colors.primary.dark : theme.colors.primary.DEFAULT}`,
                        color: theme.colors.gray[50],
                        backgroundColor: todo.completed ? theme.colors.primary.DEFAULT : withAlpha(theme.colors.primary.lighter, 0.18),
                        cursor: todoBusyId === (todo.id || todo._id) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {todo.completed && <CheckIcon />}
                    </button>
                    <p className="flex-1 text-sm" style={{ color: todo.completed ? withAlpha(theme.colors.secondary.charcoal, 0.45) : withAlpha(theme.colors.secondary.charcoal, 0.8), textDecoration: todo.completed ? 'line-through' : 'none' }}>
                      {todo.title}
                    </p>
                    <button
                      type="button"
                      aria-label="Delete task"
                      onClick={() => handleDeleteTodo(todo.id || todo._id)}
                      disabled={todoBusyId === (todo.id || todo._id)}
                      className="rounded-xl p-2"
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

            {/* Unpaid Sessions */}
            <SectionCard title="Unpaid Sessions">
              <div className="space-y-3">
                {(loading ? [] : pendingPayments.slice(0, 5)).map((payment) => {
                  const appointmentClient = payment.appointment?.client;

                  return (
                    <div key={payment._id || payment.id} className="flex items-start gap-3 rounded-2xl px-3 py-3" style={{ backgroundColor: withAlpha(theme.colors.error.bg, 0.6) }}>
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: theme.colors.error.text }} />
                      <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.82) }}>
                        <span className="font-semibold" style={{ color: theme.colors.secondary.charcoal }}>{getClientName(appointmentClient)}</span>{' '}
                        outstanding for {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  );
                })}

                {!loading && pendingPayments.length === 0 && (
                  <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                    No outstanding payments.
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
        />
      </main>
    </div>
  );
}

export default Dashboard;
