import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { PageHeader } from '../components/PageHeader';
import { PageTitleRow } from '../components/PageTitleRow';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmModal } from '../components/ConfirmModal';
import { DiscardChangesModal } from '../components/DiscardChangesModal';
import { ClientFormModal } from '../components/client/ClientFormModal';
import { ClientListControls } from '../components/client/ClientListControls';
import { useLiveNow } from '../hooks/useLiveNow';
import { SectionCard } from '../components/SectionCard';
import { AppDataTable } from '../components/AppDataTable';
import { appointmentsAPI, clientsAPI, remindersAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';
import { EditIcon, TrashIcon } from '../utils/icons';
import { getFormErrorMessage } from '../utils/errorMessages';
import { formatAppointmentDate, getAppointmentDateTime, getTodayDateKey } from '../utils/clientListUtils';

const EMPTY_CLIENT_FORM = {
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	dateOfBirth: '',
	address: '',
	profileNotes: '',
	emergencyContactName: '',
	emergencyContactPhone: '',
};

export function ClientList() {
	const { user } = useAuth();
	const location = useLocation();

	const [activeNav, setActiveNav] = useState('Clients');
	const now = useLiveNow();
	const [clients, setClients] = useState([]);
	const [appointments, setAppointments] = useState([]);
	const [reminderIssues, setReminderIssues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [sortBy, setSortBy] = useState('newest');
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [createBusy, setCreateBusy] = useState(false);
	const [createMessage, setCreateMessage] = useState('');
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingClientId, setEditingClientId] = useState('');
	const [editBusy, setEditBusy] = useState(false);
	const [editMessage, setEditMessage] = useState('');
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [clientToDelete, setClientToDelete] = useState(null);
	const [deleteBusy, setDeleteBusy] = useState(false);
	const [deleteMessage, setDeleteMessage] = useState('');
	const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
	const [pendingUnsavedCloseAction, setPendingUnsavedCloseAction] = useState('');
	const [createForm, setCreateForm] = useState(EMPTY_CLIENT_FORM);
	const [initialCreateForm, setInitialCreateForm] = useState(EMPTY_CLIENT_FORM);
	const [editForm, setEditForm] = useState(EMPTY_CLIENT_FORM);
	const [initialEditForm, setInitialEditForm] = useState(EMPTY_CLIENT_FORM);
	const [filters, setFilters] = useState({
		upcomingAppointment: false,
		actionsNeeded: false,
		active: false,
		inactive: false,
	});
	const todayDateKey = getTodayDateKey();
	const hasUnsavedCreateChanges = JSON.stringify(createForm) !== JSON.stringify(initialCreateForm);
	const hasUnsavedEditChanges = JSON.stringify(editForm) !== JSON.stringify(initialEditForm);

	const requestUnsavedChangesConfirmation = (action) => {
		setPendingUnsavedCloseAction(action);
		setShowUnsavedChangesModal(true);
	};

	const closeUnsavedChangesModal = () => {
		setShowUnsavedChangesModal(false);
		setPendingUnsavedCloseAction('');
	};

	const handleConfirmUnsavedChangesClose = () => {
		const action = pendingUnsavedCloseAction;
		closeUnsavedChangesModal();

		if (action === 'create') {
			closeCreateModal(true);
			return;
		}

		if (action === 'edit') {
			closeEditModal(true);
		}
	};

	const resetCreateForm = () => {
		setCreateForm(EMPTY_CLIENT_FORM);
		setInitialCreateForm(EMPTY_CLIENT_FORM);
		setCreateMessage('');
	};

	const closeCreateModal = (forceClose = false) => {
		const shouldForceClose = forceClose === true;
		if (createBusy) return;

		if (!shouldForceClose && hasUnsavedCreateChanges) {
			requestUnsavedChangesConfirmation('create');
			return;
		}

		setShowCreateModal(false);
		resetCreateForm();
	};

	const resetEditForm = () => {
		setEditForm(EMPTY_CLIENT_FORM);
		setInitialEditForm(EMPTY_CLIENT_FORM);
		setEditMessage('');
	};

	const openEditModal = (client) => {
		setEditingClientId(client.id || client._id || '');
		const nextEditForm = {
			firstName: client.firstName || '',
			lastName: client.lastName || '',
			email: client.email || '',
			phone: client.phone || '',
			dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
			address: client.address || '',
			profileNotes: client.profileNotes || '',
			emergencyContactName: client.emergencyContact?.name || '',
			emergencyContactPhone: client.emergencyContact?.phone || '',
		};
		setEditForm(nextEditForm);
		setInitialEditForm(nextEditForm);
		setEditMessage('');
		setShowEditModal(true);
	};

	const closeEditModal = (forceClose = false) => {
		const shouldForceClose = forceClose === true;
		if (editBusy) return;

		if (!shouldForceClose && hasUnsavedEditChanges) {
			requestUnsavedChangesConfirmation('edit');
			return;
		}

		setShowEditModal(false);
		setEditingClientId('');
		resetEditForm();
	};

	const closeDeleteModal = () => {
		if (deleteBusy) return;
		setShowDeleteModal(false);
		setClientToDelete(null);
		setDeleteMessage('');
	};

	const handleCreateClient = async (event) => {
		event.preventDefault();
		setCreateMessage('');

		const normalizedFirstName = createForm.firstName.trim().replace(/\s+/g, ' ');
		const normalizedLastName = createForm.lastName.trim().replace(/\s+/g, ' ');
		const normalizedEmail = createForm.email.trim().toLowerCase();
		const normalizedPhone = createForm.phone.trim();
		const normalizedDateOfBirth = createForm.dateOfBirth.trim();
		const normalizedAddress = createForm.address.trim();
		const normalizedProfileNotes = createForm.profileNotes.trim();
		const normalizedEmergencyContactName = createForm.emergencyContactName.trim();
		const normalizedEmergencyContactPhone = createForm.emergencyContactPhone.trim();

		if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedPhone) {
			setCreateMessage('First name, last name, email, and phone are required.');
			return;
		}

		if (normalizedDateOfBirth && normalizedDateOfBirth > todayDateKey) {
			setCreateMessage('Date of birth cannot be in the future.');
			return;
		}

		setCreateBusy(true);

		try {
			const response = await clientsAPI.create({
				firstName: normalizedFirstName,
				lastName: normalizedLastName,
				email: normalizedEmail,
				phone: normalizedPhone,
				dateOfBirth: normalizedDateOfBirth || undefined,
				address: normalizedAddress || undefined,
				profileNotes: normalizedProfileNotes || undefined,
				emergencyContact: (normalizedEmergencyContactName || normalizedEmergencyContactPhone)
					? {
						name: normalizedEmergencyContactName || undefined,
						phone: normalizedEmergencyContactPhone || undefined,
					}
					: undefined,
			});

			setClients((current) => [response.data, ...current]);

			const issuesResponse = await remindersAPI.getIssues();
			setReminderIssues(issuesResponse.data || []);

			closeCreateModal(true);
		} catch (requestError) {
			setCreateMessage(getFormErrorMessage(requestError, 'Unable to create client'));
		} finally {
			setCreateBusy(false);
		}
	};

	const handleEditClient = async (event) => {
		event.preventDefault();
		setEditMessage('');

		if (!editingClientId) {
			setEditMessage('No client selected for editing.');
			return;
		}

		const normalizedFirstName = editForm.firstName.trim().replace(/\s+/g, ' ');
		const normalizedLastName = editForm.lastName.trim().replace(/\s+/g, ' ');
		const normalizedEmail = editForm.email.trim().toLowerCase();
		const normalizedPhone = editForm.phone.trim();
		const normalizedDateOfBirth = editForm.dateOfBirth.trim();
		const normalizedAddress = editForm.address.trim();
		const normalizedProfileNotes = editForm.profileNotes.trim();
		const normalizedEmergencyContactName = editForm.emergencyContactName.trim();
		const normalizedEmergencyContactPhone = editForm.emergencyContactPhone.trim();

		if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedPhone) {
			setEditMessage('First name, last name, email, and phone are required.');
			return;
		}

		if (normalizedDateOfBirth && normalizedDateOfBirth > todayDateKey) {
			setEditMessage('Date of birth cannot be in the future.');
			return;
		}

		setEditBusy(true);

		try {
			const response = await clientsAPI.update(editingClientId, {
				firstName: normalizedFirstName,
				lastName: normalizedLastName,
				email: normalizedEmail,
				phone: normalizedPhone,
				dateOfBirth: normalizedDateOfBirth || undefined,
				address: normalizedAddress || undefined,
				profileNotes: normalizedProfileNotes || undefined,
				emergencyContact: (normalizedEmergencyContactName || normalizedEmergencyContactPhone)
					? {
						name: normalizedEmergencyContactName || undefined,
						phone: normalizedEmergencyContactPhone || undefined,
					}
					: undefined,
			});

			setClients((current) => current.map((item) => {
				const itemId = item.id || item._id;
				return itemId === editingClientId ? response.data : item;
			}));

			const issuesResponse = await remindersAPI.getIssues();
			setReminderIssues(issuesResponse.data || []);

			closeEditModal(true);
		} catch (requestError) {
			setEditMessage(getFormErrorMessage(requestError, 'Unable to update client'));
		} finally {
			setEditBusy(false);
		}
	};

	const handleDeleteClient = async () => {
		if (!clientToDelete?.clientId && !clientToDelete?.id && !clientToDelete?._id) {
			setDeleteMessage('No client selected for deletion.');
			return;
		}

		const deleteClientId = clientToDelete.clientId || clientToDelete.id || clientToDelete._id;
		setDeleteMessage('');
		setDeleteBusy(true);

		try {
			await clientsAPI.delete(deleteClientId);
			setClients((current) => current.filter((item) => (item.id || item._id) !== deleteClientId));
			setAppointments((current) => current.filter((item) => {
				const appointmentClientId = typeof item.client === 'string'
					? item.client
					: item.client?.id || item.client?._id;
				return appointmentClientId !== deleteClientId;
			}));

			const issuesResponse = await remindersAPI.getIssues();
			setReminderIssues(issuesResponse.data || []);

			closeDeleteModal();
		} catch (requestError) {
			setDeleteMessage(requestError.response?.data?.message || requestError.message || 'Unable to delete client');
		} finally {
			setDeleteBusy(false);
		}
	};

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

	useEffect(() => {
		if (!location.state?.openCreateClientModal) return;

		setCreateMessage('');
		resetCreateForm();
		setShowCreateModal(true);
	}, [location.state]);

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
			const missingEmergencyContact = clientIssues.find((issue) => issue.type === 'missing-emergency-contact');
			const missingAddress = clientIssues.find((issue) => issue.type === 'missing-address');
		const missingDateOfBirth = clientIssues.find((issue) => issue.type === 'missing-dob');
		const hasEmergencyContactName = Boolean(String(client.emergencyContact?.name || '').trim());
		const hasEmergencyContactPhone = Boolean(String(client.emergencyContact?.phone || '').trim());
		const hasEmergencyContactDetails = hasEmergencyContactName && hasEmergencyContactPhone;
		const hasAddress = Boolean(String(client.address || '').trim());
		const hasDateOfBirth = Boolean(client.dateOfBirth);
		const missingNotesCount = missingNotes?.missingNotesCount || 0;
		const status = nextAppointment ? 'active' : 'inactive';
		const actionsNeeded = [];

		if (missingNotes) {
			actionsNeeded.push(`Write ${missingNotesCount} session note${missingNotesCount === 1 ? '' : 's'}`);
		}

		if (missingEmergencyContact || !hasEmergencyContactDetails) {
			actionsNeeded.push('Add emergency contact');
		}

		if (missingAddress || !hasAddress) {
			actionsNeeded.push('Add address');
		}

		if (missingDateOfBirth || !hasDateOfBirth) {
			actionsNeeded.push('Add date of birth');
			}

			const actionsNeededDetails = actionsNeeded.join(' • ');
			const actionsNeededLabel = actionsNeeded.length === 0
				? 'None'
				: actionsNeeded.length === 1
					? actionsNeeded[0]
					: `${actionsNeeded[0]} +${actionsNeeded.length - 1} more`;

			return {
				...client,
				clientId,
				name,
				status,
				actionsNeeded,
				nextAppointment,
				actionsNeededLabel,
				actionsNeededDetails,
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
			case 'alphabetical':
				return filteredRows.sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: 'base' }));
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
		{ value: 'alphabetical', label: 'Alphabetical (A-Z)' },
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
				<PageHeader userName={user?.name} now={now} />

				<div className="space-y-6 px-6 py-6 md:px-8">
					<PageTitleRow
						title="Client List"
						actions={(
							<button
								type="button"
								onClick={() => setShowCreateModal(true)}
								className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
								style={{
									backgroundColor: theme.colors.primary.light,
									color: theme.colors.gray[50],
								}}
							>
								<span aria-hidden="true" className="text-base leading-none">+</span>
								Add Client Profile
							</button>
						)}
					/>

					<ErrorAlert message={error} />

					<SectionCard paddingClassName="p-5 md:p-6" bodyClassName="space-y-0">
						<ClientListControls
							searchTerm={searchTerm}
							onSearchTermChange={setSearchTerm}
							showFilters={showFilters}
							onToggleFilters={() => setShowFilters((current) => !current)}
							sortOptions={sortOptions}
							sortBy={sortBy}
							onSortByChange={setSortBy}
							filters={filters}
							onToggleFilter={toggleFilter}
						/>

						<div className="overflow-hidden rounded-2xl border" style={{ borderColor: componentStyles.subtleBorder }}>
							<AppDataTable
								columns={[
									{ key: 'name', label: 'Name', widthClassName: 'w-[18%]', headerClassName: 'px-4' },
									{ key: 'email', label: 'Email', widthClassName: 'w-[20%]' },
									{ key: 'phone', label: 'Phone', widthClassName: 'w-[12%]' },
									{ key: 'status', label: 'Status', widthClassName: 'w-[10%]' },
									{ key: 'nextAppointment', label: 'Next Appointment', widthClassName: 'w-[15%]' },
									{ key: 'actionsNeeded', label: 'Actions Needed', widthClassName: 'w-[17%]' },
									{ key: 'actions', label: '', widthClassName: 'w-[8%]', headerClassName: 'pl-2 pr-4 text-right' },
								]}
								rows={rows}
								rowKey={(row) => row.clientId}
								renderRow={(row) => (
									<>
										<td className="px-4 py-3">
											<Link
												to={`/clients/${row.clientId}`}
												className="font-medium transition-opacity hover:opacity-70"
												style={{ color: theme.colors.secondary.charcoal, textDecoration: 'none' }}
											>
												{row.name}
											</Link>
										</td>
										<td className="px-3 py-3">{row.email || '-'}</td>
										<td className="px-3 py-3">{row.phone || '-'}</td>
										<td className="px-4 py-3">
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
										<td className="px-4 py-3">{row.nextAppointment ? formatAppointmentDate(row.nextAppointment.dateTime) : 'Not Scheduled'}</td>
										<td
											className="group px-4 py-3"
											title={row.actionsNeededDetails || row.actionsNeededLabel}
											style={{ color: withAlpha(theme.colors.primary.darker, 0.78) }}
										>
											<span className={row.actionsNeeded?.length > 1 ? 'block truncate whitespace-nowrap group-hover:hidden' : 'block truncate whitespace-nowrap'}>
												{row.actionsNeededLabel}
											</span>
											{row.actionsNeeded?.length > 1 ? (
												<div className="hidden whitespace-normal text-xs leading-relaxed group-hover:block">
													{row.actionsNeeded.join(' • ')}
												</div>
											) : null}
										</td>
										<td className="py-3 pl-2 pr-4">
											<div className="flex items-center justify-end gap-2">
												<button
													type="button"
													onClick={() => openEditModal(row)}
													aria-label={`Edit ${row.name}`}
													title={`Edit ${row.name}`}
												>
													<EditIcon />
												</button>
												<button
													type="button"
													onClick={() => {
														setClientToDelete(row);
														setDeleteMessage('');
														setShowDeleteModal(true);
													}}
													aria-label={`Delete ${row.name}`}
													title={`Delete ${row.name}`}
												>
													<TrashIcon />
												</button>
											</div>
										</td>
									</>
								)}
								loading={loading}
								loadingMessage="Loading clients..."
								emptyMessage="No clients found."
								minWidthClassName="min-w-[980px]"
								emptyCellClassName="px-4 py-10 text-center"
								loadingCellClassName="px-4 py-10 text-center"
							/>
						</div>
					</SectionCard>
				</div>
			</main>
			<ClientFormModal
				isOpen={showCreateModal}
				title="Add Client"
				onClose={closeCreateModal}
				closeDisabled={createBusy}
				form={createForm}
				setForm={setCreateForm}
				onSubmit={handleCreateClient}
				isBusy={createBusy}
				message={createMessage}
				todayDateKey={todayDateKey}
				submitLabel="Create Client"
				emailPlaceholder="client@email.com"
				phonePlaceholder="+353..."
				addressPlaceholder="Home address"
				profileNotesPlaceholder="Add profile notes..."
				emergencyContactNamePlaceholder="Emergency contact"
				emergencyContactPhonePlaceholder="+353..."
			/>
			<ClientFormModal
				isOpen={showEditModal}
				title="Edit Client"
				onClose={closeEditModal}
				closeDisabled={editBusy}
				form={editForm}
				setForm={setEditForm}
				onSubmit={handleEditClient}
				isBusy={editBusy}
				message={editMessage}
				todayDateKey={todayDateKey}
				submitLabel="Save Changes"
				emailPlaceholder="client@email.com"
				phonePlaceholder="+353..."
				addressPlaceholder="Home address"
				profileNotesPlaceholder="Add profile notes..."
				emergencyContactNamePlaceholder="Emergency contact"
				emergencyContactPhonePlaceholder="+353..."
			/>
			<ConfirmModal
				isOpen={showDeleteModal}
				title="Delete Client"
				description={`This action cannot be undone. Are you sure you want to delete ${clientToDelete?.name || 'this client'}?`}
				errorMessage={deleteMessage}
				onCancel={closeDeleteModal}
				onConfirm={handleDeleteClient}
				isBusy={deleteBusy}
				confirmLabel="Delete Client"
			/>
			<DiscardChangesModal
				isOpen={showUnsavedChangesModal}
				onCancel={closeUnsavedChangesModal}
				onConfirm={handleConfirmUnsavedChangesClose}
			/>
		</div>
	);
}
