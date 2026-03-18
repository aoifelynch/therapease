import { useEffect, useState } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { appointmentsAPI, clientsAPI, paymentsAPI, remindersAPI, todosAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../utils/theme';
import { withAlpha, isSameDay, startOfWeek, startOfMonth, formatCurrency, formatLongDate, formatClock, formatTime, getClientName } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';
import { quickActions } from '../constants/sidebarConstants';
import {
  ExternalLinkIcon, EditIcon, CheckIcon, ArrowUpIcon, TrashIcon,
} from '../utils/icons';

export function Dashboard() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todoTitle, setTodoTitle] = useState('');
  const [todoSubmitting, setTodoSubmitting] = useState(false);
  const [todoBusyId, setTodoBusyId] = useState(null);
  const [now, setNow] = useState(new Date());
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [clientsResponse, appointmentsResponse, paymentsResponse, remindersResponse, todosResponse] = await Promise.all([
          clientsAPI.getAll(),
          appointmentsAPI.getAll(),
          paymentsAPI.getAll(),
          remindersAPI.getAll(),
          todosAPI.getAll(),
        ]);

        setClients(clientsResponse.data || []);
        setAppointments(appointmentsResponse.data || []);
        setPayments(paymentsResponse.data || []);
        setReminders(remindersResponse.data || []);
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
  const activeClients = clients.filter(Boolean).length;

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
      sub: activeClients === 1 ? '1 client profile' : `${activeClients} client profiles`,
      color: theme.colors.secondary.sage,
      accent: theme.colors.primary.DEFAULT,
    },
  ];

  // Event handlers - Todo CRUD
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
  const handleDeleteTodo = async (todoId) => {
    setTodoBusyId(todoId);
    setError('');

    try {
      await todosAPI.delete(todoId);
      setTodos((current) => current.filter((item) => (item.id || item._id) !== todoId));
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || requestError.message || 'Unable to delete task');
    } finally {
      setTodoBusyId(null);
    }
  };

  // Render
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}>
      <AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={user} />

      {/* Main content area */}
      <main className="h-screen flex-1 overflow-y-auto">
        {/* Header */}
        <header
          className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4 md:px-8"
          style={{
            backgroundColor: withAlpha(theme.colors.gray[50], 0.92),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}`,
          }}
        >
          <div>
            <h1 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
              Welcome, {user?.name?.split(' ')[0] || 'there'}
            </h1>
          </div>
          <span className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>
            {formatLongDate(now)} {formatClock(now)}
          </span>
        </header>

        <div className="space-y-6 px-6 py-6 md:px-8">
          {/* Error alert */}
          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text, border: `1px solid ${theme.colors.error.border}` }}>
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.label} className="overflow-hidden rounded-3xl" style={componentStyles.card}>
                <div className="px-4 py-2" style={{ backgroundColor: card.color }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.colors.secondary.charcoal }}>
                    {card.label}
                  </p>
                </div>
                <div className="px-4 py-5">
                  <p className="text-3xl font-semibold" style={{ color: card.accent }}>{card.value}</p>
                  <p className="mt-1 text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>{card.sub}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Quick Actions & Reminders */}
          <section className="grid gap-4 xl:grid-cols-2">
            {/* Quick Actions */}
            <div className="rounded-3xl p-6" style={componentStyles.card}>
              <h2 className="mb-5 text-xl font-semibold" style={componentStyles.sectionTitle}>Quick Actions</h2>
              <div className="flex flex-wrap justify-around gap-5">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button key={action.label} type="button" className="flex min-w-[120px] flex-col items-center gap-3">
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
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reminders */}
            <div className="rounded-3xl p-6" style={componentStyles.card}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold" style={componentStyles.sectionTitle}>Reminders</h2>
                <span className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.5) }}>
                  {reminders.length} total
                </span>
              </div>

              <div className="space-y-3">
                {(loading ? [] : reminders.slice(0, 4)).map((reminder) => {
                  const tone = componentStyles.getReminderTone(reminder.status);
                  const reminderClient = clientLookup[reminder.client] || 'Practice reminder';

                  return (
                    <div key={reminder._id || reminder.id} className="flex items-start gap-3 rounded-2xl px-3 py-3" style={{ backgroundColor: tone.background }}>
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tone.dot }} />
                      <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.82) }}>
                        <span className="font-semibold" style={{ color: theme.colors.secondary.charcoal }}>{reminderClient}</span>{' '}
                        {reminder.description}
                      </p>
                    </div>
                  );
                })}

                {!loading && reminders.length === 0 && (
                  <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                    No reminders yet.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Appointments & Revenue */}
          <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            {/* Appointments Table */}
            <div className="rounded-3xl p-6" style={componentStyles.card}>
              <h2 className="mb-2 text-xl font-semibold" style={componentStyles.sectionTitle}>Upcoming Appointments</h2>
              <p className="mb-6 text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.5) }}>
                {formatLongDate(now)}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[16%]" />
                    <col className="w-[26%]" />
                    <col className="w-[24%]" />
                    <col className="w-[18%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}`, color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                      <th className="pb-2 pl-4 text-left text-xs font-semibold uppercase tracking-[0.16em]">Time</th>
                      <th className="pb-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">Client</th>
                      <th className="pb-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">Location</th>
                      <th className="pb-2 text-left text-xs font-semibold uppercase tracking-[0.16em]">Status</th>
                      <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-[0.16em]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((appointment, index) => {
                      const tone = componentStyles.getStatusTone(appointment.status);
                      const hasZoom = appointment.type === 'online' && appointment.zoomLink;
                      const rowBackground = componentStyles.getZebraRow(index);

                      return (
                        <tr key={appointment._id || appointment.id} style={{ borderBottom: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.45)}`, color: withAlpha(theme.colors.secondary.charcoal, 0.78), backgroundColor: rowBackground }}>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!loading && upcomingAppointments.length === 0 && (
                <p className="pt-4 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                  No appointments scheduled yet.
                </p>
              )}
            </div>

            {/* Revenue Overview */}
            <div className="rounded-3xl p-6" style={componentStyles.card}>
              <h2 className="mb-4 text-xl font-semibold" style={componentStyles.sectionTitle}>Revenue Overview</h2>

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
            </div>
          </section>

          {/* Todos & Unpaid Sessions */}
          <section className="grid gap-4 xl:grid-cols-2">
            {/* To-Do List */}
            <div className="rounded-3xl p-6" style={componentStyles.card}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold" style={componentStyles.sectionTitle}>To-Do List</h2>
               
              </div>

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
            </div>

            {/* Unpaid Sessions */}
            <div className="rounded-3xl p-6" style={componentStyles.card}>
              <h2 className="mb-4 text-xl font-semibold" style={componentStyles.sectionTitle}>Unpaid Sessions</h2>
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
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
