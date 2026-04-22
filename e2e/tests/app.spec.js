import { expect, test } from '@playwright/test';

const baseUser = {
  id: 'user-1',
  name: 'Ava Murphy',
  email: 'ava@example.com',
  twoFactorEnabled: true,
  createdAt: '2026-01-10T10:00:00.000Z',
};

const buildDashboardFixtures = () => {
  const now = new Date();
  const appointmentStart = new Date(now.getTime() + 60 * 60 * 1000);
  const appointmentEnd = new Date(now.getTime() + 90 * 60 * 1000);

  return {
    clients: [
      {
        id: 'client-1',
        firstName: 'Ava',
        lastName: 'Murphy',
      },
    ],
    appointments: [
      {
        id: 'appointment-1',
        client: 'client-1',
        date: now.toISOString(),
        startTime: appointmentStart.toTimeString().slice(0, 5),
        endTime: appointmentEnd.toTimeString().slice(0, 5),
        status: 'upcoming',
        type: 'online',
      },
    ],
    reminderIssues: [
      {
        id: 'reminder-1',
        client: 'client-1',
        status: 'open',
        type: 'missing-notes',
        description: 'is missing a note.',
      },
    ],
    payments: [
      {
        id: 'payment-1',
        status: 'pending',
        amount: 120,
        createdAt: now.toISOString(),
      },
    ],
    todos: [
      {
        id: 'todo-1',
        title: 'Send follow-up note',
        completed: false,
      },
    ],
  };
};

const setAuthenticatedSession = async (page, user = baseUser) => {
  await page.addInitScript((payload) => {
    window.localStorage.setItem('user', JSON.stringify(payload.user));
    window.localStorage.setItem('accessToken', payload.accessToken);
    window.localStorage.setItem('refreshToken', payload.refreshToken);
  }, {
    user,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  });
};

const mockDashboardApis = async (page, fixtures = buildDashboardFixtures()) => {
  await page.route('**/api/clients', async (route) => {
    await route.fulfill({ json: fixtures.clients });
  });

  await page.route('**/api/appointments', async (route) => {
    await route.fulfill({ json: fixtures.appointments });
  });

  await page.route('**/api/reminders/issues', async (route) => {
    await route.fulfill({ json: fixtures.reminderIssues });
  });

  await page.route('**/api/payments', async (route) => {
    await route.fulfill({ json: fixtures.payments });
  });

  await page.route('**/api/todos', async (route) => {
    await route.fulfill({ json: fixtures.todos });
  });

  return fixtures;
};

const mockClientsPageApis = async (page, overrides = {}) => {
  let clients = overrides.clients ?? [
    {
      id: 'client-1',
      firstName: 'Ava',
      lastName: 'Murphy',
      email: 'ava.client@example.com',
      phone: '+3531234567',
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    },
  ];

  const appointments = overrides.appointments ?? [];
  const issues = overrides.issues ?? [];

  await page.route('**/api/clients', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { data: clients } });
      return;
    }

    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const createdClient = {
        id: 'client-new',
        ...body,
        createdAt: '2026-02-01T11:00:00.000Z',
        updatedAt: '2026-02-01T11:00:00.000Z',
      };
      clients = [createdClient, ...clients];
      await route.fulfill({
        json: {
          data: createdClient,
        },
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/clients/*', async (route) => {
    const method = route.request().method();
    const clientId = route.request().url().split('/').pop();

    if (method === 'PUT') {
      const body = route.request().postDataJSON();
      const existingClient = clients.find((item) => String(item.id || item._id) === String(clientId)) || {};
      const updatedClient = {
        ...existingClient,
        ...body,
        id: existingClient.id || existingClient._id || clientId,
        updatedAt: '2026-02-02T11:00:00.000Z',
      };

      clients = clients.map((item) => (
        String(item.id || item._id) === String(clientId)
          ? updatedClient
          : item
      ));

      await route.fulfill({ json: { data: updatedClient } });
      return;
    }

    if (method === 'DELETE') {
      clients = clients.filter((item) => String(item.id || item._id) !== String(clientId));
      await route.fulfill({ json: { data: { success: true } } });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/appointments', async (route) => {
    await route.fulfill({ json: { data: appointments } });
  });

  await page.route('**/api/reminders/issues', async (route) => {
    await route.fulfill({ json: { data: issues } });
  });
};

const mockCalendarApis = async (page, overrides = {}) => {
  const clients = overrides.clients ?? [
    {
      id: 'client-1',
      firstName: 'Ava',
      lastName: 'Murphy',
    },
  ];

  let appointments = overrides.appointments ?? [
    {
      id: 'appointment-existing',
      client: clients[0],
      date: '2026-04-24T00:00:00.000Z',
      startTime: '10:00',
      endTime: '11:00',
      type: 'online',
      status: 'upcoming',
      paymentLinkTiming: 'none',
      autoSendPaymentLink: false,
    },
  ];

  await page.route('**/api/appointments', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { data: appointments } });
      return;
    }

    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const createdAppointment = {
        id: 'appointment-created',
        client: clients.find((item) => String(item.id || item._id) === String(body.clientId)) || clients[0],
        ...body,
      };
      appointments = [...appointments, createdAppointment];
      await route.fulfill({
        json: {
          data: createdAppointment,
        },
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/appointments/*', async (route) => {
    const method = route.request().method();
    const appointmentId = route.request().url().split('/').pop();

    if (method === 'PATCH') {
      const body = route.request().postDataJSON();
      const existingAppointment = appointments.find((item) => String(item.id || item._id) === String(appointmentId)) || {};
      const updatedAppointment = {
        ...existingAppointment,
        ...body,
        id: existingAppointment.id || existingAppointment._id || appointmentId,
        client: clients.find((item) => String(item.id || item._id) === String(body.clientId)) || existingAppointment.client || clients[0],
      };

      appointments = appointments.map((item) => (
        String(item.id || item._id) === String(appointmentId)
          ? updatedAppointment
          : item
      ));

      await route.fulfill({ json: { data: updatedAppointment } });
      return;
    }

    if (method === 'DELETE') {
      appointments = appointments.filter((item) => String(item.id || item._id) !== String(appointmentId));
      await route.fulfill({ json: { data: { success: true } } });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/clients', async (route) => {
    await route.fulfill({ json: { data: clients } });
  });
};

const mockPaymentsApis = async (page) => {
  const clients = [
    {
      id: 'client-1',
      firstName: 'Ava',
      lastName: 'Murphy',
    },
  ];

  const payments = [
    {
      id: 'payment-1',
      status: 'pending',
      amount: 80,
      createdAt: '2026-04-20T09:00:00.000Z',
      appointment: {
        date: '2026-04-21T00:00:00.000Z',
        client: clients[0],
      },
    },
  ];

  await page.route('**/api/payments', async (route) => {
    await route.fulfill({ json: { data: payments } });
  });

  await page.route('**/api/clients', async (route) => {
    await route.fulfill({ json: { data: clients } });
  });

  await page.route('**/api/payments/create-session', async (route) => {
    await route.fulfill({ json: { data: { ok: true } } });
  });

  await page.route('**/api/payments/*/send-reminder', async (route) => {
    await route.fulfill({ json: { data: { success: true } } });
  });
};

const mockSettingsApis = async (page, user = baseUser) => {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: { user } });
  });

  await page.route('**/api/auth/profile', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        json: {
          user: {
            ...user,
            name: body.name,
            email: body.email,
          },
        },
      });
      return;
    }

    if (route.request().method() === 'DELETE') {
      await route.fulfill({ json: { success: true } });
      return;
    }

    await route.continue();
  });
};

const mockClientProfileApis = async (page) => {
  let notes = [];

  await page.route('**/api/clients/client-1', async (route) => {
    await route.fulfill({
      json: {
        data: {
          client: {
            id: 'client-1',
            firstName: 'Ava',
            lastName: 'Murphy',
            email: 'ava.client@example.com',
            phone: '+3531234567',
            profileNotes: 'Weekly therapy client',
            createdAt: '2026-01-10T10:00:00.000Z',
          },
          appointments: [
            {
              id: 'appointment-1',
              date: '2026-04-23T00:00:00.000Z',
              startTime: '10:00',
              endTime: '11:00',
              type: 'online',
              status: 'upcoming',
            },
          ],
          files: [],
          notes,
          payments: [],
        },
      },
    });
  });

  await page.route('**/api/clients/client-1/notes', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const createdNote = {
        id: `note-${notes.length + 1}`,
        content: body.content,
        templateType: body.templateType || null,
        appointment: body.appointmentId,
        createdAt: '2026-04-23T11:00:00.000Z',
      };
      notes = [createdNote, ...notes];

      await route.fulfill({ json: { data: createdNote } });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/notes/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      const noteId = route.request().url().split('/').pop();
      notes = notes.filter((note) => String(note.id || note._id) !== String(noteId));
      await route.fulfill({ json: { data: { success: true } } });
      return;
    }

    await route.continue();
  });
};

test('redirects protected routes to login when the visitor is not authenticated', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('shows login validation when the form is submitted empty', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Email and password are required')).toBeVisible();
});

test('signs up from the landing page and lands on the dashboard', async ({ page }) => {
  await mockDashboardApis(page);

  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: 'user-1',
          name: 'Ava Murphy',
          twoFactorEnabled: true,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /untangle your/i })).toBeVisible();

  await page.getByPlaceholder('Full Name').fill('Ava Murphy');
  await page.getByPlaceholder('Email').first().fill('ava@example.com');
  await page.getByPlaceholder('Password').nth(0).fill('password123');
  await page.getByPlaceholder('Confirm Password').fill('password123');
  await page.getByRole('button', { name: 'Sign Up' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Appointments Today')).toBeVisible();
  await expect(page.getByText('Ava Murphy').first()).toBeVisible();
});

test('handles login with 2FA verification and then opens dashboard', async ({ page }) => {
  await mockDashboardApis(page);

  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      json: {
        requires2FA: true,
        tempUserId: 'temp-user-1',
        user: {
          ...baseUser,
          twoFactorEnabled: true,
        },
      },
    });
  });

  await page.route('**/api/2fa/verify-login', async (route) => {
    await route.fulfill({
      json: {
        user: {
          ...baseUser,
          twoFactorEnabled: true,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('ava@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/2fa-verify$/);
  await page.getByLabel('Authentication Code').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Appointments Today')).toBeVisible();
});

test('forces 2FA setup for authenticated users without 2FA and can complete setup', async ({ page }) => {
  await setAuthenticatedSession(page, {
    ...baseUser,
    twoFactorEnabled: false,
  });
  await mockDashboardApis(page);

  await page.route('**/api/2fa/setup', async (route) => {
    await route.fulfill({
      json: {
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
        secret: 'ABCDEF123456',
      },
    });
  });

  await page.route('**/api/2fa/verify-setup', async (route) => {
    await route.fulfill({
      json: {
        user: {
          ...baseUser,
          twoFactorEnabled: true,
        },
      },
    });
  });

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/setup-2fa$/);

  await page.getByRole('button', { name: 'Get Started' }).click();
  await expect(page.getByText('Step 1: Scan QR code')).toBeVisible();

  await page.getByPlaceholder('000000').fill('123456');
  await page.getByRole('button', { name: 'Verify & Enable 2FA' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Appointments Today')).toBeVisible();
});

test('creates a new client from the client list', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockClientsPageApis(page);

  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Client List' })).toBeVisible();

  await page.getByRole('button', { name: 'Add Client Profile' }).click();
  await expect(page.getByRole('heading', { name: 'Add Client' })).toBeVisible();

  await page.getByPlaceholder('First name').fill('Noah');
  await page.getByPlaceholder('Last name').fill('Walsh');
  await page.getByPlaceholder('client@email.com').fill('noah@example.com');
  await page.getByPlaceholder('+353...').first().fill('+3531111111');
  await page.getByRole('button', { name: 'Create Client' }).click();

  await expect(page.getByRole('link', { name: 'Noah Walsh' })).toBeVisible();
});

test('edits and deletes a client from the client list', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockClientsPageApis(page);

  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Client List' })).toBeVisible();

  await page.getByRole('button', { name: /Edit Ava Murphy/i }).click();
  const editClientModal = page
    .getByRole('heading', { name: 'Edit Client' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(editClientModal).toBeVisible();

  await editClientModal.locator('input').first().fill('Ava Marie');
  await editClientModal.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('link', { name: 'Ava Marie Murphy' })).toBeVisible();

  await page.getByRole('button', { name: /Delete Ava Marie Murphy/i }).click();
  await expect(page.getByRole('heading', { name: 'Delete Client' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Client' }).click();

  await expect(page.getByRole('link', { name: 'Ava Marie Murphy' })).not.toBeVisible();
});

test('creates an appointment from the calendar page', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockCalendarApis(page);

  await page.goto('/calendar');
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();

  await page.getByRole('button', { name: 'Create Appointment' }).first().click();
  const createAppointmentModal = page
    .getByRole('heading', { name: 'Create Appointment' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(createAppointmentModal).toBeVisible();

  await createAppointmentModal.locator('select').nth(0).selectOption('client-1');
  await createAppointmentModal.locator('input[type="date"]').fill('2026-04-25');
  await createAppointmentModal.locator('select').nth(1).selectOption('09:00');
  await createAppointmentModal.locator('select').nth(2).selectOption('10:00');
  await createAppointmentModal.locator('select').nth(3).selectOption('online');
  await createAppointmentModal.getByRole('button', { name: 'Create Appointment' }).click();

  await expect(page.getByText('Ava Murphy').first()).toBeVisible();
});

test('shows appointment conflict errors without closing the modal', async ({ page }) => {
  await setAuthenticatedSession(page);

  await page.route('**/api/appointments', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { data: [] } });
      return;
    }

    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 409,
        json: {
          message: 'There is already someone booked for that day and time.',
        },
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/clients', async (route) => {
    await route.fulfill({ json: { data: [{ id: 'client-1', firstName: 'Ava', lastName: 'Murphy' }] } });
  });

  await page.goto('/calendar');
  await page.getByRole('button', { name: 'Create Appointment' }).first().click();

  const createAppointmentModal = page
    .getByRole('heading', { name: 'Create Appointment' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await createAppointmentModal.locator('select').nth(0).selectOption('client-1');
  await createAppointmentModal.locator('input[type="date"]').fill('2026-04-25');
  await createAppointmentModal.locator('select').nth(1).selectOption('09:00');
  await createAppointmentModal.locator('select').nth(2).selectOption('10:00');
  await createAppointmentModal.locator('select').nth(3).selectOption('online');
  await createAppointmentModal.getByRole('button', { name: 'Create Appointment' }).click();

  await expect(createAppointmentModal.getByText('There is already someone booked for that day and time.')).toBeVisible();
});

test('dismisses unsaved calendar changes with the discard modal', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockCalendarApis(page);

  await page.goto('/calendar');
  await page.getByRole('button', { name: 'Create Appointment' }).first().click();

  const createAppointmentModal = page
    .getByRole('heading', { name: 'Create Appointment' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(createAppointmentModal).toBeVisible();

  await createAppointmentModal.locator('select').nth(0).selectOption('client-1');
  await createAppointmentModal.getByRole('button', { name: 'Cancel' }).click();

  const discardChangesModal = page
    .getByRole('heading', { name: 'Discard Changes?' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(discardChangesModal).toBeVisible();

  await discardChangesModal.getByRole('button', { name: 'Keep Editing' }).click();
  await expect(createAppointmentModal).toBeVisible();

  await createAppointmentModal.getByRole('button', { name: 'Cancel' }).click();
  await discardChangesModal.getByRole('button', { name: 'Exit' }).click();
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
});

test('edits and deletes an appointment from calendar', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockCalendarApis(page);

  await page.goto('/calendar');
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();

  await page.locator('.fc-event').first().click();
  await expect(page.getByRole('heading', { name: 'Appointment Details' })).toBeVisible();

  await page.getByRole('button', { name: 'Edit Appointment' }).click();
  const editAppointmentModal = page
    .getByRole('heading', { name: 'Edit Appointment' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(editAppointmentModal).toBeVisible();
  await editAppointmentModal.locator('select').nth(4).selectOption('cancelled');
  await editAppointmentModal.getByRole('button', { name: 'Save Changes' }).click();

  await page.locator('.fc-event').first().click();
  await page.getByRole('button', { name: 'Delete Appointment' }).click();
  const deleteAppointmentModal = page
    .getByRole('heading', { name: 'Delete Appointment' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(deleteAppointmentModal).toBeVisible();
  await deleteAppointmentModal.getByRole('button', { name: 'Delete Appointment' }).click();

  await expect(page.locator('.fc-event')).toHaveCount(0);
});

test('creates and sends a payment link from payments', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockPaymentsApis(page);

  await page.goto('/payments');
  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();

  await page.getByRole('button', { name: 'Create Payment Link' }).click();
  const createPaymentModal = page
    .getByRole('heading', { name: 'Create Payment Link' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(createPaymentModal).toBeVisible();

  await createPaymentModal.locator('select').first().selectOption('client-1');
  await createPaymentModal.locator('input[type="number"]').fill('95');
  await page.getByRole('button', { name: 'Create & Send Now' }).click();

  await expect(page.getByRole('heading', { name: 'Create Payment Link' })).not.toBeVisible();
  await expect(page.getByText('Payment Records')).toBeVisible();
});

test('sends a payment reminder for pending payments', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockPaymentsApis(page);

  await page.goto('/payments');
  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();

  await page.getByRole('button', { name: 'Send Reminder' }).click();
  await expect(page.getByText('A reminder text has been sent')).toBeVisible();
});

test('loads client profile details', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockClientProfileApis(page);

  await page.goto('/clients/client-1');

  await expect(page.getByRole('heading', { name: 'Ava Murphy' })).toBeVisible();
  await expect(page.getByText('Weekly therapy client')).toBeVisible();
  await expect(page.getByRole('button', { name: '+ New Session Note' })).toBeVisible();
});

test('creates and deletes a client note from profile', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockClientProfileApis(page);

  await page.goto('/clients/client-1');
  await expect(page.getByRole('heading', { name: 'Ava Murphy' })).toBeVisible();

  await page.getByRole('button', { name: '+ New Session Note' }).click();
  await page.getByRole('button', { name: 'SOAP' }).click();
  await page.getByRole('combobox').first().selectOption('appointment-1');
  await page.getByRole('button', { name: 'Save Note' }).click();

  await expect(page.getByText('Your note is saved.')).toBeVisible();

  await page.getByRole('button', { name: 'Files' }).first().click();
  await page.getByRole('button', { name: 'Delete note' }).first().click();
  const deleteNoteModal = page
    .getByRole('heading', { name: 'Delete Note' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(deleteNoteModal).toBeVisible();
  await deleteNoteModal.getByRole('button', { name: 'Delete Note' }).click();

  await expect(page.getByText('No notes yet.')).toBeVisible();
});

test('updates profile settings and can logout', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockSettingsApis(page);

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByLabel('Full name').fill('Ava M. Murphy');
  await page.getByLabel('Email address').fill('ava.m@example.com');
  await page.getByRole('button', { name: 'Save Profile' }).click();

  await expect(page.getByText('Ava M. Murphy')).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
});

test('deletes the account from settings and logs out', async ({ page }) => {
  await setAuthenticatedSession(page);
  await mockSettingsApis(page);

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete Account' }).first().click();
  const deleteAccountModal = page
    .getByRole('heading', { name: 'Confirm Account Deletion' })
    .locator('xpath=ancestor::div[contains(@class, "max-w")][1]');
  await expect(deleteAccountModal).toBeVisible();

  await deleteAccountModal.getByPlaceholder('Password').fill('password123');
  await deleteAccountModal.getByRole('button', { name: 'Delete Account' }).click();

  await expect(page).toHaveURL(/\/login$/);
});