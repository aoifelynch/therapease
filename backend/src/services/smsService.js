import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const normalizePhoneNumber = (value) => {
  const compact = String(value || '').trim().replace(/[\s()-]/g, '');
  if (!compact) return compact;

  if (/^08\d+$/u.test(compact)) {
    return `+353${compact.slice(1)}`;
  }

  if (/^3538\d+$/u.test(compact)) {
    return `+${compact}`;
  }

  if (/^003538\d+$/u.test(compact)) {
    return `+${compact.slice(2)}`;
  }

  return compact;
};

export const sendSMS = async ({ to, message }) => {
  const formattedNumber = normalizePhoneNumber(to);
  
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formattedNumber
  });
};