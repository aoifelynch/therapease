export const getTodayDateKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPaymentLinkTimingLabel = (value) => {
  if (value === 'before') return 'Before Session';
  if (value === 'after') return 'After Session';
  if (value === 'now') return 'Sent Instantly';
  return 'No Automatic Link';
};

export const getAppointmentNotes = (appointment, allNotes) => {
  const appointmentId = appointment?.id || appointment?._id;
  if (!appointmentId) return [];

  return allNotes.filter((note) => {
    const noteAppointmentId = note?.appointment?.id || note?.appointment?._id || note?.appointment;
    return String(noteAppointmentId || '') === String(appointmentId);
  });
};

export const formatShortDate = (value) => new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(value));

export const isImageFile = (file) => {
  const fileType = String(file.fileType || '').toLowerCase();
  const fileName = String(file.fileName || file.name || '').toLowerCase();
  return fileType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(fileName);
};
