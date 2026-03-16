export const withAlpha = (hex, alpha) => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const isSameDay = (first, second) => (
  first.getFullYear() === second.getFullYear()
  && first.getMonth() === second.getMonth()
  && first.getDate() === second.getDate()
);

export const startOfWeek = (date) => {
  const start = new Date(date);
  const offset = (date.getDay() + 6) % 7;
  start.setDate(date.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const formatCurrency = (amount) => new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(amount || 0);

export const formatLongDate = (value) => new Intl.DateTimeFormat('en-IE', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}).format(value);

export const formatClock = (value) => new Intl.DateTimeFormat('en-IE', {
  hour: 'numeric',
  minute: '2-digit',
}).format(value).toLowerCase();

export const formatTime = (appointment) => {
  if (appointment.startTime) {
    const [hours, minutes] = appointment.startTime.split(':');
    const value = new Date(appointment.date);
    value.setHours(Number(hours), Number(minutes), 0, 0);
    return formatClock(value);
  }
  return formatClock(new Date(appointment.date));
};

export const getClientName = (client) => {
  if (!client) return 'Client unavailable';
  if (typeof client === 'string') return client;
  return [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Client unavailable';
};
