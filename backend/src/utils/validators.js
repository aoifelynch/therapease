import mongoose from 'mongoose';

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeIrishPhoneNumber = (value) => {
  if (typeof value !== 'string') return value;

  const compact = value.trim().replace(/[\s()-]/g, '');
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

// User validators (kept for auth routes)
export const registerSchema = {
  email: {
    in: ['body'],
    notEmpty: { errorMessage: "'email' field is required" },
    isEmail: { errorMessage: "'email' must be a valid email address" }
  },
  name: {
    in: ['body'],
    notEmpty: { errorMessage: "'name' field is required" },
    isString: { errorMessage: "'name' must be a string" },
    isLength: { options: { min: 1, max: 100 }, errorMessage: "'name' must be 1-100 chars" },
    trim: true
  },
  password: {
    in: ['body'],
    notEmpty: { errorMessage: "'password' field is required" },
    isStrongPassword: {
      options: { minLength: 8, minNumbers: 1, minUppercase: 1, minSymbols: 0 },
      errorMessage:
        "'password' must be at least 8 characters, include a number and an uppercase letter"
    }
  }
};

export const updateProfileSchema = {
  name: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'name' must be a string" },
    isLength: { options: { min: 1, max: 100 }, errorMessage: "'name' must be 1-100 chars" },
    trim: true
  },
  email: {
    in: ['body'],
    optional: true,
    isEmail: { errorMessage: "'email' must be a valid email address" }
  },
  currentPassword: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'currentPassword' must be a string" }
  },
  newPassword: {
    in: ['body'],
    optional: true,
    isStrongPassword: {
      options: { minLength: 8, minNumbers: 1, minUppercase: 1, minSymbols: 0 },
      errorMessage:
        "'newPassword' must be at least 8 characters, include a number and an uppercase letter"
    }
  }
};

export const deleteAccountSchema = {
  password: {
    in: ['body'],
    notEmpty: { errorMessage: "'password' field is required" },
    isString: { errorMessage: "'password' must be a string" }
  }
};

export const loginSchema = {
  email: {
    in: ['body'],
    notEmpty: { errorMessage: "'email' field is required" },
    isEmail: { errorMessage: "'email' must be a valid email address" }
  },
  password: {
    in: ['body'],
    notEmpty: { errorMessage: "'password' field is required" },
    isString: { errorMessage: "'password' must be a string" }
  }
};

export const refreshTokenSchema = {
  refreshToken: {
    in: ['body'],
    notEmpty: { errorMessage: "'refreshToken' field is required" },
    isString: { errorMessage: "'refreshToken' must be a string" }
  }
};

// Reusable ObjectId validator for any param name
export const objectIdParam = (paramName = 'id') => ({
  [paramName]: {
    in: ['params'],
    custom: {
      options: isObjectId,
      errorMessage: `Parameter '${paramName}' must be a valid ObjectId`
    }
  }
});

// Client validators
export const clientSchema = {
  firstName: {
    in: ['body'],
    notEmpty: { errorMessage: "'firstName' field is required" },
    isString: { errorMessage: "'firstName' must be a string" },
    isLength: { options: { min: 1, max: 100 }, errorMessage: "'firstName' must be 1-100 chars" },
    trim: true
  },
  lastName: {
    in: ['body'],
    notEmpty: { errorMessage: "'lastName' field is required" },
    isString: { errorMessage: "'lastName' must be a string" },
    isLength: { options: { min: 1, max: 100 }, errorMessage: "'lastName' must be 1-100 chars" },
    trim: true
  },
  email: {
    in: ['body'],
    notEmpty: { errorMessage: "'email' field is required" },
    isEmail: { errorMessage: "'email' must be a valid email address" },
    normalizeEmail: true
  },
  phone: {
    in: ['body'],
    notEmpty: { errorMessage: "'phone' field is required" },
    customSanitizer: {
      options: normalizeIrishPhoneNumber,
    },
    isString: { errorMessage: "'phone' must be a string" },
    isLength: { options: { max: 30 }, errorMessage: "'phone' max length is 30 chars" },
    trim: true
  },
  dateOfBirth: {
    in: ['body'],
    optional: true,
    isISO8601: { errorMessage: "'dateOfBirth' must be an ISO8601 date" }
  },
  address: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'address' must be a string" },
    isLength: { options: { max: 300 }, errorMessage: "'address' max length is 300 chars" },
    trim: true
  },
  'emergencyContact.name': {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'emergencyContact.name' must be a string" },
    isLength: { options: { max: 100 }, errorMessage: "'emergencyContact.name' max length is 100 chars" },
    trim: true
  },
  'emergencyContact.phone': {
    in: ['body'],
    optional: true,
    customSanitizer: {
      options: normalizeIrishPhoneNumber,
    },
    isString: { errorMessage: "'emergencyContact.phone' must be a string" },
    isLength: { options: { max: 30 }, errorMessage: "'emergencyContact.phone' max length is 30 chars" },
    trim: true
  }
};

export const clientIdParam = {
  id: {
    in: ['params'],
    custom: {
      options: isObjectId,
      errorMessage: "Client ID 'id' parameter must be a valid ObjectId"
    }
  }
};

// Appointment validators
export const appointmentSchema = {
  clientId: {
    in: ['body'],
    notEmpty: { errorMessage: "'clientId' is required" },
    custom: {
      options: isObjectId,
      errorMessage: "'clientId' must be a valid ObjectId"
    }
  },
  date: {
    in: ['body'],
    notEmpty: { errorMessage: "'date' is required" },
    isISO8601: { errorMessage: "'date' must be an ISO8601 date" }
  },
  startTime: {
    in: ['body'],
    notEmpty: { errorMessage: "'startTime' is required" },
    isString: { errorMessage: "'startTime' must be a string" },
    isLength: { options: { max: 20 }, errorMessage: "'startTime' max length is 20 chars" }
  },
  endTime: {
    in: ['body'],
    notEmpty: { errorMessage: "'endTime' is required" },
    isString: { errorMessage: "'endTime' must be a string" },
    isLength: { options: { max: 20 }, errorMessage: "'endTime' max length is 20 chars" }
  },
  type: {
    in: ['body'],
    notEmpty: { errorMessage: "'type' is required" },
    isIn: { options: [['in-person', 'online']], errorMessage: "'type' must be 'in-person' or 'online'" }
  },
  zoomLink: {
    in: ['body'],
    optional: { options: { nullable: true, checkFalsy: true } },
    isURL: { errorMessage: "'zoomLink' must be a valid URL" }
  },
  status: {
    in: ['body'],
    optional: true,
    isIn: { options: [['upcoming', 'completed', 'cancelled']], errorMessage: "'status' must be 'upcoming', 'completed', or 'cancelled'" }
  }
};

export const appointmentUpdateSchema = {
  clientId: {
    in: ['body'],
    optional: true,
    custom: {
      options: isObjectId,
      errorMessage: "'clientId' must be a valid ObjectId"
    }
  },
  date: {
    in: ['body'],
    optional: true,
    isISO8601: { errorMessage: "'date' must be an ISO8601 date" }
  },
  startTime: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'startTime' must be a string" },
    isLength: { options: { max: 20 }, errorMessage: "'startTime' max length is 20 chars" }
  },
  endTime: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'endTime' must be a string" },
    isLength: { options: { max: 20 }, errorMessage: "'endTime' max length is 20 chars" }
  },
  type: {
    in: ['body'],
    optional: true,
    isIn: { options: [['in-person', 'online']], errorMessage: "'type' must be 'in-person' or 'online'" }
  },
  zoomLink: {
    in: ['body'],
    optional: { options: { nullable: true, checkFalsy: true } },
    isURL: { errorMessage: "'zoomLink' must be a valid URL" }
  },
  status: {
    in: ['body'],
    optional: true,
    isIn: { options: [['upcoming', 'completed', 'cancelled']], errorMessage: "'status' must be 'upcoming', 'completed', or 'cancelled'" }
  }
};

export const appointmentIdParam = {
  id: {
    in: ['params'],
    custom: {
      options: isObjectId,
      errorMessage: "Appointment ID 'id' parameter must be a valid ObjectId"
    }
  }
};


// Note validators
export const noteSchema = {
  clientId: {
    in: ['body'],
    notEmpty: { errorMessage: "'clientId' is required" },
    custom: {
      options: isObjectId,
      errorMessage: "'clientId' must be a valid ObjectId"
    }
  },
  appointmentId: {
    in: ['body'],
    optional: true,
    custom: {
      options: (value) => !value || isObjectId(value),
      errorMessage: "'appointmentId' must be a valid ObjectId"
    }
  },
  templateType: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'templateType' must be a string" },
    isLength: { options: { max: 100 }, errorMessage: "'templateType' max length is 100 chars" }
  },
  content: {
    in: ['body'],
    notEmpty: { errorMessage: "'content' is required" },
    isString: { errorMessage: "'content' must be a string" },
    isLength: { options: { max: 5000 }, errorMessage: "'content' max length is 5000 chars" }
  }
};

// Payment validators
export const paymentSchema = {
  appointmentId: {
    in: ['body'],
    notEmpty: { errorMessage: "'appointmentId' is required" },
    custom: {
      options: isObjectId,
      errorMessage: "'appointmentId' must be a valid ObjectId"
    }
  },
  stripePaymentIntentId: {
    in: ['body'],
    notEmpty: { errorMessage: "'stripePaymentIntentId' is required" },
    isString: { errorMessage: "'stripePaymentIntentId' must be a string" }
  },
  amount: {
    in: ['body'],
    notEmpty: { errorMessage: "'amount' is required" },
    isFloat: { options: { min: 0 }, errorMessage: "'amount' must be a non-negative number" }
  },
  currency: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'currency' must be a string" },
    isLength: { options: { min: 3, max: 6 }, errorMessage: "'currency' must be 3-6 chars" }
  },
  status: {
    in: ['body'],
    optional: true,
    isIn: { options: [['pending', 'paid', 'failed']], errorMessage: "'status' must be 'pending', 'paid', or 'failed'" }
  },
  receiptURL: {
    in: ['body'],
    optional: true,
    isURL: { errorMessage: "'receiptURL' must be a valid URL" }
  }
};

// Payment session validators for Stripe checkout
export const paymentSessionSchema = {
  clientId: {
    in: ['body'],
    notEmpty: { errorMessage: "'clientId' is required" },
    custom: {
      options: isObjectId,
      errorMessage: "'clientId' must be a valid ObjectId"
    }
  },
  appointmentId: {
    in: ['body'],
    notEmpty: { errorMessage: "'appointmentId' is required" },
    custom: {
      options: isObjectId,
      errorMessage: "'appointmentId' must be a valid ObjectId"
    }
  },
  amount: {
    in: ['body'],
    notEmpty: { errorMessage: "'amount' is required" },
    isFloat: { options: { min: 0.01 }, errorMessage: "'amount' must be greater than 0" }
  },
  clientEmail: {
    in: ['body'],
    notEmpty: { errorMessage: "'clientEmail' is required" },
    isEmail: { errorMessage: "'clientEmail' must be a valid email address" }
  }
};

// Reminder validators
export const reminderSchema = {
  clientId: {
    in: ['body'],
    optional: true,
    custom: {
      options: (value) => !value || isObjectId(value),
      errorMessage: "'clientId' must be a valid ObjectId"
    }
  },
  description: {
    in: ['body'],
    notEmpty: { errorMessage: "'description' is required" },
    isString: { errorMessage: "'description' must be a string" },
    isLength: { options: { max: 1000 }, errorMessage: "'description' max length is 1000 chars" }
  },
  status: {
    in: ['body'],
    optional: true,
    isIn: { options: [['pending', 'sent', 'cancelled']], errorMessage: "'status' must be 'pending', 'sent', or 'cancelled'" }
  }
};

export const todoCreateSchema = {
  title: {
    in: ['body'],
    notEmpty: { errorMessage: "'title' field is required" },
    isString: { errorMessage: "'title' must be a string" },
    isLength: { options: { min: 1, max: 200 }, errorMessage: "'title' must be 1-200 chars" },
    trim: true,
  },
  completed: {
    in: ['body'],
    optional: true,
    isBoolean: { errorMessage: "'completed' must be a boolean" },
    toBoolean: true,
  },
};

export const todoUpdateSchema = {
  title: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: "'title' must be a string" },
    isLength: { options: { min: 1, max: 200 }, errorMessage: "'title' must be 1-200 chars" },
    trim: true,
  },
  completed: {
    in: ['body'],
    optional: true,
    isBoolean: { errorMessage: "'completed' must be a boolean" },
    toBoolean: true,
  },
};