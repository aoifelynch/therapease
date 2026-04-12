export const getWeekStart = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseFeeValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return '';
  return numeric.toFixed(2);
};

export const getAppointmentClientId = (appointment) => {
  const clientValue = appointment?.client;

  if (!clientValue) return '';
  if (typeof clientValue === 'string') return clientValue;

  return clientValue.id || clientValue._id || '';
};

export const getPaymentLinkTimingLabel = (value) => {
  if (value === 'before') return 'Before Session';
  if (value === 'after') return 'After Session';
  if (value === 'now') return 'Sent Instantly';
  return 'No Payment Link Sent';
};

export const getCalendarDateFromQuery = (value) => {
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

export const buildDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const [hours, minutes] = String(timeValue).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const addHoursToTime = (timeValue, hoursToAdd = 1) => {
  if (!timeValue) return '';

  const [hoursValue, minutesValue] = String(timeValue).split(':').map(Number);
  if (Number.isNaN(hoursValue) || Number.isNaN(minutesValue)) return '';

  const totalMinutes = ((hoursValue * 60) + minutesValue + (hoursToAdd * 60)) % (24 * 60);
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
};

export const buildTimeOptions = ({ startHour = 0, endHour = 23, minuteStep = 5 } = {}) => {
  const options = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += minuteStep) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }

  return options;
};

export const getViewRangeLabel = (rangeStart, rangeEnd) => {
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

export const formatEventTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};
