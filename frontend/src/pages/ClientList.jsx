import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { appointmentsAPI, clientsAPI, remindersAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../utils/theme';
import { withAlpha, formatLongDate, formatClock } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';
import { EditIcon, TrashIcon, PlusIcon } from '../utils/icons';

const getAppointmentDateTime = (appointment) => {
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

const formatAppointmentDate = (value) => {
	if (!value) return 'No appointment';

	return new Intl.DateTimeFormat('en-IE', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	}).format(value);
};

export function ClientList() {
	const { user } = useAuth();

	const [activeNav, setActiveNav] = useState('Clients');
	const [now, setNow] = useState(new Date());
	const [clients, setClients] = useState([]);
	const [appointments, setAppointments] = useState([]);
	const [reminderIssues, setReminderIssues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [sortBy, setSortBy] = useState('newest');
	const [filters, setFilters] = useState({
		upcomingAppointment: false,
		actionsNeeded: false,
		active: false,
		inactive: false,
	});

	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 60000);
		return () => window.clearInterval(timer);
	}, []);

	useEffect(() => {
		const loadClientData = async () => {
			setLoading(true);
			setError('');

			try {
				const [clientsResponse, appointmentsResponse, issuesResponse] = await Promise.all([
					clientsAPI.getAll(),
					appointmentsAPI.getAll(),
					remindersAPI.getIssues(),
				]);

				setClients(clientsResponse.data || []);
				setAppointments(appointmentsResponse.data || []);
				setReminderIssues(issuesResponse.data || []);
			} catch (requestError) {
				setError(requestError.response?.data?.message || requestError.message || 'Unable to load clients');
			} finally {
				setLoading(false);
			}
		};

		loadClientData();
	}, []);

	const appointmentsByClient = useMemo(() => {
		const groupedAppointments = {};

		appointments.forEach((appointment) => {
			const clientId = typeof appointment.client === 'string'
				? appointment.client
				: appointment.client?.id || appointment.client?._id;
			if (!clientId) return;

			if (!groupedAppointments[clientId]) {
				groupedAppointments[clientId] = [];
			}

			groupedAppointments[clientId].push(appointment);
		});

		return groupedAppointments;
	}, [appointments]);

	const issuesByClient = useMemo(() => (
		reminderIssues.reduce((lookup, issue) => {
			const clientId = typeof issue.client === 'string'
				? issue.client
				: issue.client?.id || issue.client?._id;
			if (!clientId) return lookup;

			if (!lookup[clientId]) {
				lookup[clientId] = [];
			}

			lookup[clientId].push(issue);
			return lookup;
		}, {})
	), [reminderIssues]);

	const rows = useMemo(() => {
		const lowerSearch = searchTerm.trim().toLowerCase();

		const normalizedRows = clients.map((client) => {
			const clientId = client.id || client._id;
			const name = [client.firstName, client.lastName].filter(Boolean).join(' ').trim() || 'Unnamed client';
			const clientAppointments = appointmentsByClient[clientId] || [];
			const clientIssues = issuesByClient[clientId] || [];

			const nextAppointment = clientAppointments
				.filter((appointment) => appointment.status !== 'cancelled')
				.map((appointment) => ({
					...appointment,
					dateTime: getAppointmentDateTime(appointment),
				}))
				.filter((appointment) => appointment.dateTime && appointment.dateTime >= now)
				.sort((first, second) => first.dateTime - second.dateTime)[0] || null;

			const missingContact = clientIssues.find((issue) => issue.type === 'missing-contact');
			const missingNotes = clientIssues.find((issue) => issue.type === 'missing-notes');
			const missingNotesCount = missingNotes?.missingNotesCount || 0;
			const status = nextAppointment ? 'active' : 'inactive';
			let actionsNeededLabel = 'None';

			if (missingContact && missingNotes) {
				actionsNeededLabel = `Add contact + ${missingNotesCount} missing note${missingNotesCount === 1 ? '' : 's'}`;
			} else if (missingContact) {
				actionsNeededLabel = 'Add contact details';
			} else if (missingNotes) {
				actionsNeededLabel = `Write ${missingNotesCount} session note${missingNotesCount === 1 ? '' : 's'}`;
			}

			return {
				...client,
				clientId,
				name,
				status,
				nextAppointment,
				actionsNeededLabel,
				createdAtValue: new Date(client.createdAt || 0),
				updatedAtValue: new Date(client.updatedAt || client.createdAt || 0),
			};
		});

		const filteredRows = normalizedRows.filter((row) => {
			const matchesSearch = !lowerSearch
				|| row.name.toLowerCase().includes(lowerSearch)
				|| String(row.email || '').toLowerCase().includes(lowerSearch);

			const hasStatusFilter = filters.active || filters.inactive;
			const matchesStatus = !hasStatusFilter
				|| (filters.active && row.status === 'active')
				|| (filters.inactive && row.status === 'inactive');

			const matchesUpcoming = !filters.upcomingAppointment || Boolean(row.nextAppointment);
			const matchesActionsNeeded = !filters.actionsNeeded || row.actionsNeededLabel !== 'None';

			return matchesSearch && matchesStatus && matchesUpcoming && matchesActionsNeeded;
		});

		switch (sortBy) {
			case 'oldest':
				return filteredRows.sort((first, second) => first.createdAtValue - second.createdAtValue);
			case 'recentlyEdited':
				return filteredRows.sort((first, second) => second.updatedAtValue - first.updatedAtValue);
			case 'upcomingAppointment':
				return filteredRows.sort((first, second) => {
					const firstValue = first.nextAppointment?.dateTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
					const secondValue = second.nextAppointment?.dateTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
					return firstValue - secondValue;
				});
			case 'newest':
			default:
				return filteredRows.sort((first, second) => second.createdAtValue - first.createdAtValue);
		}
	}, [appointmentsByClient, clients, filters, issuesByClient, now, searchTerm, sortBy]);

	const toggleFilter = (key) => {
		setFilters((current) => ({
			...current,
			[key]: !current[key],
		}));
	};

	const sortOptions = [
		{ value: 'newest', label: 'Newest first' },
		{ value: 'oldest', label: 'Oldest first' },
		{ value: 'recentlyEdited', label: 'Recently edited' },
		{ value: 'upcomingAppointment', label: 'Upcoming appointment' },
	];

	return (
		<div
			className="flex h-screen overflow-hidden"
			style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}
		>
			<AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={user} />

			<main className="h-screen flex-1 overflow-y-auto">
				<header
					className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4 md:px-8"
					style={{
						backgroundColor: withAlpha(theme.colors.gray[50], 0.92),
						backdropFilter: 'blur(12px)',
						borderBottom: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}`,
					}}
				>
					<h1 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
						Welcome, {user?.name?.split(' ')[0] || '!'}
					</h1>
					<span className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>
						{formatLongDate(now)} {formatClock(now)}
					</span>
				</header>

				<div className="space-y-5 px-6 py-6 md:px-8">
					{error && (
						<div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text, border: `1px solid ${theme.colors.error.border}` }}>
							{error}
						</div>
					)}

					<section className="rounded-3xl p-5 md:p-6" style={componentStyles.card}>
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<h2 className="text-3xl font-semibold" style={componentStyles.sectionTitle}>Client List</h2>

							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
								style={{
									backgroundColor: theme.colors.primary.light,
									color: theme.colors.gray[50],
								}}
							>
								<PlusIcon />
								Add Client
							</button>
						</div>

						<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
							<label className="relative block w-full max-w-md">
								<span className="sr-only">Search clients</span>
								<input
									type="search"
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
									placeholder="Search"
									className="w-full rounded-xl border bg-white py-2 pl-3 pr-10 text-sm outline-none transition focus:ring-2"
									style={{
										borderColor: componentStyles.border,
										color: theme.colors.secondary.charcoal,
									}}
								/>
								<span
									className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
									style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.55) }}
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
										<circle cx="11" cy="11" r="7" />
										<path d="m20 20-3.5-3.5" />
									</svg>
								</span>
							</label>

							<div className="relative">
								<button
									type="button"
									onClick={() => setShowFilters((current) => !current)}
									className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium"
									style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
								>
									Filter / Sort
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
										<path d="m6 9 6 6 6-6" />
									</svg>
								</button>

								{showFilters && (
									<div
										className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border bg-white p-3 shadow-lg"
										style={{ borderColor: componentStyles.border }}
									>
										<p className="px-1 pb-1 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.52) }}>
											Sort
										</p>
										{sortOptions.map((option) => (
											<label key={option.value} className="flex items-center gap-2 px-1 py-1.5 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.85) }}>
												<input
													type="radio"
													name="client-sort"
													checked={sortBy === option.value}
													onChange={() => setSortBy(option.value)}
													className="h-4 w-4 border"
												/>
												{option.label}
											</label>
										))}

										<div className="my-2 h-px" style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.8) }} />

										<p className="px-1 pb-1 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.52) }}>
											Filters
										</p>
										{[
											['upcomingAppointment', 'Has upcoming appointment'],
											['actionsNeeded', 'Actions needed'],
											['active', 'Active'],
											['inactive', 'Inactive'],
										].map(([key, label]) => (
											<label key={key} className="flex items-center gap-2 px-1 py-1.5 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.85) }}>
												<input
													type="checkbox"
													checked={filters[key]}
													onChange={() => toggleFilter(key)}
													className="h-4 w-4 rounded border"
												/>
												{label}
											</label>
										))}
									</div>
								)}
							</div>
						</div>

						<div className="overflow-hidden rounded-2xl border" style={{ borderColor: componentStyles.subtleBorder }}>
							<div className="overflow-x-auto">
								<table className="w-full table-fixed text-left text-sm">
									<thead style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.5), color: withAlpha(theme.colors.secondary.charcoal, 0.8) }}>
										<tr>
											<th className="w-[18%] px-4 py-3 font-semibold">Name</th>
											<th className="w-[22%] px-4 py-3 font-semibold">Email</th>
											<th className="w-[14%] px-4 py-3 font-semibold">Phone</th>
											<th className="w-[10%] px-4 py-3 font-semibold">Status</th>
											<th className="w-[16%] px-4 py-3 font-semibold">Next Appointment</th>
											<th className="w-[14%] px-4 py-3 font-semibold">Actions Needed</th>
											<th className="w-[6%] py-3 pl-2 pr-4 text-right font-semibold">Actions</th>
										</tr>
									</thead>
									<tbody style={{ backgroundColor: theme.colors.gray[50] }}>
										{!loading && rows.map((row, index) => (
											<tr key={row.clientId} style={{ backgroundColor: componentStyles.getZebraRow(index) }}>
												<td className="border-t px-4 py-3" style={{ borderColor: componentStyles.subtleBorder }}>
													<Link
														to={`/clients/${row.clientId}`}
														className="font-medium transition-opacity hover:opacity-70"
														style={{ color: theme.colors.secondary.charcoal, textDecoration: 'none' }}
													>
														{row.name}
													</Link>
												</td>
												<td className="border-t px-4 py-3" style={{ borderColor: componentStyles.subtleBorder }}>{row.email || '-'}</td>
												<td className="border-t px-4 py-3" style={{ borderColor: componentStyles.subtleBorder }}>{row.phone || '-'}</td>
												<td className="border-t px-4 py-3" style={{ borderColor: componentStyles.subtleBorder }}>
													<span
														className="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize"
														style={{
															backgroundColor: row.status === 'active' ? withAlpha(theme.colors.secondary.sage, 0.95) : withAlpha(theme.colors.secondary.beige, 0.7),
															color: row.status === 'active' ? theme.colors.primary.darker : withAlpha(theme.colors.secondary.charcoal, 0.75),
														}}
													>
														{row.status}
													</span>
												</td>
												<td className="border-t px-4 py-3" style={{ borderColor: componentStyles.subtleBorder }}>
													{row.nextAppointment ? formatAppointmentDate(row.nextAppointment.dateTime) : 'Not Scheduled'}
												</td>
												<td className="border-t px-4 py-3" style={{ borderColor: componentStyles.subtleBorder, color: withAlpha(theme.colors.primary.darker, 0.78) }}>
													{row.actionsNeededLabel}
												</td>
												<td className="border-t py-3 pl-2 pr-4" style={{ borderColor: componentStyles.subtleBorder }}>
													<div className="flex items-center justify-end gap-2">
														<button type="button" aria-label={`Edit ${row.name}`} title={`Edit ${row.name}`}>
															<EditIcon />
														</button>
														<button type="button" aria-label={`Delete ${row.name}`} title={`Delete ${row.name}`}>
															<TrashIcon />
														</button>
													</div>
												</td>
											</tr>
										))}

										{loading && (
											<tr>
												<td colSpan="7" className="px-4 py-10 text-center" style={{ color: componentStyles.subtleText }}>
													Loading clients...
												</td>
											</tr>
										)}

										{!loading && rows.length === 0 && (
											<tr>
												<td colSpan="7" className="px-4 py-10 text-center" style={{ color: componentStyles.subtleText }}>
													No clients found.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}
