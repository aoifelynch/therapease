import { DashboardIcon, CalendarIcon, ClientsIcon, PaymentsIcon, ReportsIcon, PlusIcon } from '../utils/icons';

export const navItems = [
  { label: 'Dashboard', icon: DashboardIcon },
  { label: 'Calendar', icon: CalendarIcon },
  { label: 'Clients', icon: ClientsIcon },
  { label: 'Payments', icon: PaymentsIcon },
];

export const quickActions = [
  {
    label: 'New Appointment',
    icon: CalendarIcon,
    to: '/calendar',
    state: { openCreateAppointmentModal: true },
  },
  {
    label: 'Add Client Profile',
    icon: PlusIcon,
    to: '/clients',
    state: { openCreateClientModal: true },
  },
  { label: 'View Payments', icon: PaymentsIcon, to: '/payments' },
];
