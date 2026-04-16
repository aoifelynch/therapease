const HTTP_CODE_PREFIX_PATTERN = /^\s*(?:\[\s*\d{3}\s*\]|(?:http\s*)?\d{3})\s*[:-]?\s*/i;
const AXIOS_STATUS_PATTERN = /^request failed with status code\s+\d{3}\.?$/i;

export const cleanErrorMessage = (value) => {
  if (typeof value !== 'string') return '';

  let message = value.trim();
  if (!message) return '';

  if (AXIOS_STATUS_PATTERN.test(message)) {
    return '';
  }

  while (HTTP_CODE_PREFIX_PATTERN.test(message)) {
    message = message.replace(HTTP_CODE_PREFIX_PATTERN, '').trim();
  }

  if (/^error\s*:/i.test(message)) {
    message = message.replace(/^error\s*:/i, '').trim();
  }

  if (AXIOS_STATUS_PATTERN.test(message)) {
    return '';
  }

  return message;
};

export const getFormErrorMessage = (error, fallbackMessage = 'Something went wrong.') => {
  const candidates = [
    error?.response?.data?.message,
    error?.response?.data?.error,
    error?.message,
    fallbackMessage,
  ];

  for (const candidate of candidates) {
    const cleaned = cleanErrorMessage(candidate);
    if (cleaned) {
      return cleaned;
    }
  }

  return fallbackMessage;
};
