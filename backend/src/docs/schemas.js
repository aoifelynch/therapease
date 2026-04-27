export const components = {
  schemas: {
    RegisterRequest: {
      type: 'object',
      required: ['email', 'name', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
        password: { type: 'string' }
      }
    },
    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    },
    RefreshTokenRequest: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string' }
      }
    },
    UpdateProfileRequest: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        currentPassword: { type: 'string' },
        newPassword: { type: 'string' },
        defaultOnlineFee: { type: 'number' },
        defaultInPersonFee: { type: 'number' },
        intakeFee: { type: 'number' }
      }
    },
    DeleteAccountRequest: {
      type: 'object',
      required: ['password'],
      properties: {
        password: { type: 'string' }
      }
    },
    AppointmentCreateRequest: {
      type: 'object',
      required: ['clientId', 'date', 'startTime', 'endTime', 'type'],
      properties: {
        clientId: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        type: { type: 'string', enum: ['in-person', 'online'] },
        zoomLink: { type: 'string', format: 'uri' },
        status: { type: 'string', enum: ['upcoming', 'completed', 'cancelled'] },
        paymentLinkTiming: { type: 'string', enum: ['none', 'before', 'after', 'now'] },
        autoSendPaymentLink: { type: 'boolean' },
        quotedAmount: { type: 'number' }
      }
    },
    AppointmentUpdateRequest: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        type: { type: 'string', enum: ['in-person', 'online'] },
        zoomLink: { type: 'string', format: 'uri' },
        status: { type: 'string', enum: ['upcoming', 'completed', 'cancelled'] },
        paymentLinkTiming: { type: 'string', enum: ['none', 'before', 'after', 'now'] },
        autoSendPaymentLink: { type: 'boolean' },
        quotedAmount: { type: 'number' }
      }
    },
    ClientRequest: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'phone'],
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
        address: { type: 'string' },
        profileNotes: { type: 'string' },
        emergencyContact: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' }
          }
        }
      }
    },
    NoteCreateRequest: {
      type: 'object',
      required: ['clientId', 'content'],
      properties: {
        clientId: { type: 'string' },
        appointmentId: { type: 'string' },
        templateType: { type: 'string' },
        content: { type: 'string' }
      }
    },
    ClientNoteCreateRequest: {
      type: 'object',
      required: ['content'],
      properties: {
        appointmentId: { type: 'string' },
        templateType: { type: 'string' },
        content: { type: 'string' }
      }
    },
    NoteUpdateRequest: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        templateType: { type: 'string' },
        content: { type: 'string' }
      }
    },
    PaymentSessionRequest: {
      type: 'object',
      required: ['clientId', 'amount'],
      properties: {
        clientId: { type: 'string' },
        appointmentId: { type: 'string' },
        amount: { type: 'number' },
        clientEmail: { type: 'string', format: 'email' },
        sendNow: { type: 'boolean' }
      }
    },
    ReminderRequest: {
      type: 'object',
      required: ['description'],
      properties: {
        clientId: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'sent', 'cancelled'] }
      }
    },
    TodoCreateRequest: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        completed: { type: 'boolean' }
      }
    },
    TodoUpdateRequest: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        completed: { type: 'boolean' }
      }
    },
    TwoFactorVerifyRequest: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string' },
        tempUserId: { type: 'string' }
      }
    },
    FileUploadRequest: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
};