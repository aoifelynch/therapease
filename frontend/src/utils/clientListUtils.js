export const getAppointmentDateTime = (appointment) => {
  if (!appointment?.date) return null;

  const value = new Date(appointment.date);
  if (appointment.startTime) {
    const [hours, minutes] = String(appointment.startTime).split(':').map(Number);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      value.setHours(hours, minutes, 0, 0);
    }
  }

  return Number.isNaN(value.getTime()) ? null : value;
};

export const formatAppointmentDate = (value) => {
  if (!value) return 'No appointment';

  return new Intl.DateTimeFormat('en-IE', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
};

export const getTodayDateKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
