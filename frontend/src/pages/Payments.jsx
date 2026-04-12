import { useEffect, useMemo, useState } from 'react';
import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AppSidebar } from '../components/AppSidebar';
import { PageHeader } from '../components/PageHeader';
import { PageTitleRow } from '../components/PageTitleRow';
import { ErrorAlert } from '../components/ErrorAlert';
import { ModalShell } from '../components/ModalShell';
import { useLiveNow } from '../hooks/useLiveNow';
import { StatCard } from '../components/StatCard';
import { AppDataTable } from '../components/AppDataTable';
import { useAuth } from '../context/AuthContext';
import { clientsAPI, paymentsAPI } from '../api/api';
import { theme } from '../utils/theme';
import { withAlpha, formatCurrency, getClientName } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';
import { ExternalLinkIcon } from '../utils/icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Filler);

const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getEndOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getStartOfYear = (date) => new Date(date.getFullYear(), 0, 1);

const getEndOfYear = (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

const normalizePaymentStatus = (value) => {
	const status = String(value || '').toLowerCase();
	if (status === 'paid') return 'paid';
	if (status === 'pending') return 'pending';
	if (status === 'failed') return 'failed';
	return 'pending';
};

const formatPaymentStatusLabel = (value) => {
	const normalized = normalizePaymentStatus(value);
	if (normalized === 'pending') return 'Unpaid';
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getStatusStyle = (status) => {
	if (status === 'paid') {
		return {
			backgroundColor: withAlpha(theme.colors.secondary.sage, 0.95),
			color: theme.colors.primary.darker,
		};
	}

	if (status === 'failed') {
		return {
			backgroundColor: withAlpha(theme.colors.error.bg, 0.95),
			color: theme.colors.error.text,
		};
	}

	return {
		backgroundColor: withAlpha(theme.colors.primary.lighter, 0.4),
		color: theme.colors.primary.darker,
	};
};

const getAppointmentDateText = (payment) => {
	const rawDate = payment?.appointment?.date;
	if (!rawDate) return 'No appointment date';

	const parsed = new Date(rawDate);
	if (Number.isNaN(parsed.getTime())) return 'No appointment date';

	return new Intl.DateTimeFormat('en-IE', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(parsed);
};

const getPaymentCreatedText = (payment) => {
	const rawDate = payment?.createdAt;
	if (!rawDate) return 'Unknown date';

	const parsed = new Date(rawDate);
	if (Number.isNaN(parsed.getTime())) return 'Unknown date';

	return new Intl.DateTimeFormat('en-IE', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(parsed);
};

const getPaymentClient = (payment) => payment?.appointment?.client || payment?.client || null;

const groupMonthlyRevenueByWeek = (payments, now) => {
	const monthStart = getStartOfMonth(now);
	const monthEnd = getEndOfMonth(now);
	const weeks = [0, 0, 0, 0, 0];

	payments.forEach((payment) => {
		if (normalizePaymentStatus(payment.status) !== 'paid') return;

		const createdAt = new Date(payment.createdAt);
		if (Number.isNaN(createdAt.getTime())) return;
		if (createdAt < monthStart || createdAt > monthEnd) return;

		const dayOfMonth = createdAt.getDate();
		const weekIndex = Math.min(4, Math.floor((dayOfMonth - 1) / 7));
		weeks[weekIndex] += Number(payment.amount || 0);
	});

	return weeks;
};

const groupYearlyRevenueByMonth = (payments, yearDate) => {
	const yearStart = getStartOfYear(yearDate);
	const yearEnd = getEndOfYear(yearDate);
	const months = Array(12).fill(0);

	payments.forEach((payment) => {
		if (normalizePaymentStatus(payment.status) !== 'paid') return;

		const createdAt = new Date(payment.createdAt);
		if (Number.isNaN(createdAt.getTime())) return;
		if (createdAt < yearStart || createdAt > yearEnd) return;

		months[createdAt.getMonth()] += Number(payment.amount || 0);
	});

	return months;
};

const ReceiptIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
		<path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21Z" />
		<path d="M9 8h6" />
		<path d="M9 12h6" />
	</svg>
);

const LinkIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
		<path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.7 5.22" />
		<path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.1a5 5 0 0 0 7.07 7.07L13.3 18.8" />
	</svg>
);

const CardIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
		<rect x="2.5" y="5" width="19" height="14" rx="2" />
		<path d="M2.5 10h19" />
		<path d="M7 15h3" />
	</svg>
);

export function Payments() {
	const { user } = useAuth();
	const now = useLiveNow();
	const [payments, setPayments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');
	const [revenueMonth, setRevenueMonth] = useState(() => getStartOfMonth(now));
	const [revenueView, setRevenueView] = useState('monthly');
	const [clients, setClients] = useState([]);
	const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
	const [createLinkBusy, setCreateLinkBusy] = useState(false);
	const [createLinkMessage, setCreateLinkMessage] = useState('');
	const [createLinkForm, setCreateLinkForm] = useState({
		clientId: '',
		amount: '',
	});

	useEffect(() => {
		const loadPayments = async () => {
			setLoading(true);
			setError('');

			try {
				const [paymentsResponse, clientsResponse] = await Promise.all([
					paymentsAPI.getAll(),
					clientsAPI.getAll(),
				]);
				setPayments(paymentsResponse.data || []);
				setClients(clientsResponse.data || []);
			} catch (requestError) {
				setError(requestError.response?.data?.message || requestError.message || 'Unable to load payments');
				setPayments([]);
				setClients([]);
			} finally {
				setLoading(false);
			}
		};

		loadPayments();
	}, []);

	const openCreateLinkModal = () => {
		setCreateLinkForm({ clientId: '', amount: '' });
		setCreateLinkMessage('');
		setShowCreateLinkModal(true);
	};

	const closeCreateLinkModal = () => {
		if (createLinkBusy) return;
		setShowCreateLinkModal(false);
		setCreateLinkMessage('');
	};

	const handleCreatePaymentLink = async (event) => {
		event.preventDefault();
		setCreateLinkMessage('');

		const normalizedClientId = String(createLinkForm.clientId || '').trim();
		const normalizedAmount = Number(createLinkForm.amount);

		if (!normalizedClientId) {
			setCreateLinkMessage('Please select a client.');
			return;
		}

		if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
			setCreateLinkMessage('Please enter an amount greater than 0.');
			return;
		}

		setCreateLinkBusy(true);

		try {
			const response = await paymentsAPI.createSession({
				clientId: normalizedClientId,
				amount: normalizedAmount,
				sendNow: true,
			});

			setCreateLinkMessage('Payment link sent successfully.');


			setShowCreateLinkModal(false);
			setCreateLinkForm({ clientId: '', amount: '' });
		} catch (requestError) {
			setCreateLinkMessage(requestError.response?.data?.message || requestError.message || 'Unable to create payment link');
		} finally {
			setCreateLinkBusy(false);
		}
	};

	const dashboardStats = useMemo(() => {
		const monthStart = getStartOfMonth(now);

		const paidThisMonthAmount = payments
			.filter((payment) => normalizePaymentStatus(payment.status) === 'paid')
			.filter((payment) => {
				const createdAt = new Date(payment.createdAt);
				return !Number.isNaN(createdAt.getTime()) && createdAt >= monthStart;
			})
			.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

		const outstandingAmount = payments
			.filter((payment) => normalizePaymentStatus(payment.status) === 'pending')
			.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

		const unpaidCount = payments.filter((payment) => normalizePaymentStatus(payment.status) === 'pending').length;
		const paidCount = payments.filter((payment) => normalizePaymentStatus(payment.status) === 'paid').length;
		const failedCount = payments.filter((payment) => normalizePaymentStatus(payment.status) === 'failed').length;

		return {
			paidThisMonthAmount,
			outstandingAmount,
			unpaidCount,
			paidCount,
			failedCount,
		};
	}, [payments]);

	const selectedRevenueMonth = useMemo(() => getStartOfMonth(revenueMonth), [revenueMonth]);
	const selectedRevenueYear = useMemo(() => getStartOfYear(revenueMonth), [revenueMonth]);
	const selectedRevenueLabel = useMemo(() => (
		revenueView === 'monthly'
			? new Intl.DateTimeFormat('en-IE', { month: 'long', year: 'numeric' }).format(selectedRevenueMonth)
			: new Intl.DateTimeFormat('en-IE', { year: 'numeric' }).format(selectedRevenueYear)
	), [revenueView, selectedRevenueMonth, selectedRevenueYear]);
	const revenuePeriodLabels = useMemo(() => (
		revenueView === 'monthly'
			? ['W1', 'W2', 'W3', 'W4', 'W5']
			: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	), [revenueView]);
	const revenuePeriodSummaryLabels = useMemo(() => (
		revenueView === 'monthly'
			? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
			: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
	), [revenueView]);
	const previousRevenuePeriod = () => {
		setRevenueMonth((current) => new Date(current.getFullYear(), current.getMonth() - (revenueView === 'monthly' ? 1 : 12), 1));
	};
	const nextRevenuePeriod = () => {
		setRevenueMonth((current) => new Date(current.getFullYear(), current.getMonth() + (revenueView === 'monthly' ? 1 : 12), 1));
	};
	const revenueSeries = useMemo(() => (
		revenueView === 'monthly'
			? groupMonthlyRevenueByWeek(payments, selectedRevenueMonth)
			: groupYearlyRevenueByMonth(payments, selectedRevenueYear)
	), [payments, revenueView, selectedRevenueMonth, selectedRevenueYear]);
	const revenueChartData = useMemo(() => ({
		labels: revenuePeriodLabels,
		datasets: [
			{
				label: revenueView === 'monthly' ? 'Collected' : 'Collected by Month',
				data: revenueSeries,
				borderRadius: 14,
				borderSkipped: false,
				backgroundColor: revenueSeries.map((amount, index) => (
					index === revenueSeries.length - 1
						? withAlpha(theme.colors.primary.DEFAULT, 0.95)
						: withAlpha(theme.colors.primary.DEFAULT, 0.72)
				)),
				borderColor: withAlpha(theme.colors.primary.DEFAULT, 0.65),
				barPercentage: 0.72,
				categoryPercentage: 0.74,
			},
		],
	}), [revenuePeriodLabels, revenueSeries, revenueView]);

	const revenueChartOptions = useMemo(() => ({
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				backgroundColor: theme.colors.secondary.charcoal,
				padding: 12,
				cornerRadius: 14,
				displayColors: false,
				callbacks: {
					title: (items) => `Week ${Number(items?.[0]?.dataIndex || 0) + 1}`,
					label: (context) => formatCurrency(context.raw || 0),
				},
			},
		},
		scales: {
			x: {
				grid: {
					display: false,
				},
				ticks: {
					color: componentStyles.subtleText,
					font: {
						size: 12,
						weight: '600',
					},
				},
			},
			y: {
				beginAtZero: true,
				grid: {
					color: withAlpha(theme.colors.secondary.charcoal, 0.08),
				},
				ticks: {
					color: componentStyles.subtleText,
					callback: (value) => formatCurrency(value),
					font: {
						size: 12,
						weight: '600',
					},
				},
			},
		},
	}), []);

	const maxWeeklyRevenue = useMemo(() => Math.max(...revenueSeries, 1), [revenueSeries]);

	const filteredPayments = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return [...payments]
			.filter((payment) => {
				if (statusFilter === 'all') return true;
				return normalizePaymentStatus(payment.status) === statusFilter;
			})
			.filter((payment) => {
				if (!normalizedSearch) return true;

				const clientName = getClientName(getPaymentClient(payment)).toLowerCase();
				const appointmentDate = getAppointmentDateText(payment).toLowerCase();
				const status = formatPaymentStatusLabel(payment.status).toLowerCase();

				return clientName.includes(normalizedSearch)
					|| appointmentDate.includes(normalizedSearch)
					|| status.includes(normalizedSearch);
			})
			.sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0));
	}, [payments, searchTerm, statusFilter]);

	const summaryCards = [
		{
			id: 'paid-this-month',
			label: 'Paid This Month',
			value: formatCurrency(dashboardStats.paidThisMonthAmount),
			sub: `${dashboardStats.paidCount} payment${dashboardStats.paidCount === 1 ? '' : 's'} completed`,
			color: theme.colors.secondary.sage,
			accent: theme.colors.primary.DEFAULT,
		},
		{
			id: 'unpaid',
			label: 'Outstanding Payments',
			value: formatCurrency(dashboardStats.outstandingAmount),
			sub: `${dashboardStats.unpaidCount} unpaid session${dashboardStats.unpaidCount === 1 ? '' : 's'}`,
			color: theme.colors.secondary.beige,
			accent: theme.colors.primary.dark,
		},
		{
			id: 'paid-count',
			label: 'Successful Payments',
			value: String(dashboardStats.paidCount),
			sub: 'Transactions marked paid',
			color: theme.colors.primary.lighter,
			accent: theme.colors.primary.darker,
		},
		{
			id: 'failed-count',
			label: 'Failed Payments',
			value: String(dashboardStats.failedCount),
			sub: 'Needs follow-up',
			color: theme.colors.error.border,
			accent: theme.colors.error.text,
		},
	];

	const quickActions = [
		{ id: 'view-invoices', label: 'View Invoices', icon: ReceiptIcon },
		{ id: 'view-links', label: 'View Payment Links', icon: LinkIcon },
		{ id: 'view-transactions', label: 'View Transactions', icon: CardIcon },
	];

	return (
		<div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}>
			<AppSidebar activeNav="Payments" onNavSelect={() => {}} user={user} />

			<main className="h-screen flex-1 overflow-y-auto">
				<PageHeader userName={user?.name} now={now} />

				<div className="space-y-4 px-6 py-5 md:px-8">
					<PageTitleRow
						title="Payments"
						actions={(
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={openCreateLinkModal}
									className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
									style={{ backgroundColor: theme.colors.primary.light, color: theme.colors.gray[50] }}
								>
									<span aria-hidden="true" className="text-base leading-none">+</span>
									Create Payment Link
								</button>
							</div>
						)}
					/>

					<ErrorAlert message={error} />

					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						{summaryCards.map((card) => (
							<StatCard key={card.id} {...card} />
						))}
					</div>

					<div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2.25fr)_minmax(280px,1fr)]">
						<section className="rounded-3xl p-5" style={componentStyles.card}>
							<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
								<div>
									<h2 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>Payment Records</h2>
									
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<input
										type="search"
										value={searchTerm}
										onChange={(event) => setSearchTerm(event.target.value)}
										placeholder="Search client, date, status"
										className="rounded-xl px-3 py-2 text-sm outline-none"
										style={{
											backgroundColor: withAlpha(theme.colors.secondary.cream, 0.95),
											border: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.95)}`,
											color: theme.colors.secondary.charcoal,
										}}
									/>
									<select
										value={statusFilter}
										onChange={(event) => setStatusFilter(event.target.value)}
										className="rounded-xl px-3 py-2 text-sm outline-none"
										style={{
											backgroundColor: withAlpha(theme.colors.secondary.cream, 0.95),
											border: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.95)}`,
											color: theme.colors.secondary.charcoal,
										}}
									>
										<option value="all">All</option>
										<option value="paid">Paid</option>
										<option value="pending">Unpaid</option>
										<option value="failed">Failed</option>
									</select>
								</div>
							</div>

							<AppDataTable
								columns={[
									{ key: 'client', label: 'Client', widthClassName: 'w-[19%]', headerClassName: 'pl-3' },
									{ key: 'appointmentDate', label: 'Appointment Date', widthClassName: 'w-[19%]' },
									{ key: 'amount', label: 'Amount', widthClassName: 'w-[14%]' },
									{ key: 'status', label: 'Status', widthClassName: 'w-[15%]' },
									{ key: 'created', label: 'Created', widthClassName: 'w-[17%]' },
									{ key: 'actions', label: 'Actions', widthClassName: 'w-[16%]', headerClassName: 'pr-3' },
								]}
								rows={filteredPayments}
								rowKey={(payment, index) => payment._id || payment.id || `payment-row-${index}`}
								renderRow={(payment) => {
									const normalizedStatus = normalizePaymentStatus(payment.status);

									return (
										<>
											<td className="px-3 py-3" style={{ color: theme.colors.secondary.charcoal }}>
												{getClientName(getPaymentClient(payment))}
											</td>
											<td className="px-3 py-3" style={{ color: theme.colors.secondary.charcoal }}>
												{getAppointmentDateText(payment)}
											</td>
											<td className="px-3 py-3 font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
												{formatCurrency(payment.amount)}
											</td>
											<td className="px-3 py-3">
												<span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={getStatusStyle(normalizedStatus)}>
													{formatPaymentStatusLabel(normalizedStatus)}
												</span>
											</td>
											<td className="px-3 py-3">{getPaymentCreatedText(payment)}</td>
											<td className="px-3 py-3">
												{normalizedStatus === 'pending' ? (
													<button
														type="button"
														className="rounded-lg px-2.5 py-1 text-xs font-semibold"
														style={{ backgroundColor: withAlpha(theme.colors.error.bg, 0.9), color: theme.colors.error.text }}
													>
														Send Reminder
													</button>
												) : payment.receiptURL ? (
													<a
														href={payment.receiptURL}
														target="_blank"
														rel="noreferrer"
														className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
														style={{ backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.14), color: theme.colors.primary.darker }}
													>
														View Receipt
														<ExternalLinkIcon />
													</a>
												) : (
													<span>None</span>
												)}
											</td>
										</>
									);
								}}
								loading={loading}
								loadingMessage="Loading payments..."
								emptyMessage="No payments found for the current filter."
								minWidthClassName="min-w-[760px]"
								headerCellClassName="px-3"
							/>
						</section>

						<aside className="rounded-3xl p-4" style={componentStyles.card}>
							<div className="mb-3 flex items-start justify-between gap-2">
								<div>
									<h2 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>Revenue Overview</h2>
									<p className="text-sm" style={{ color: componentStyles.subtleText }}>
										{selectedRevenueLabel}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-1">
									<div className="mr-2 inline-flex rounded-full border p-1" style={{ borderColor: componentStyles.subtleBorder, backgroundColor: withAlpha(theme.colors.gray[50], 0.75) }}>
										<button
											type="button"
											onClick={() => setRevenueView('monthly')}
											className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
											style={{
												backgroundColor: revenueView === 'monthly' ? theme.colors.primary.DEFAULT : 'transparent',
												color: revenueView === 'monthly' ? theme.colors.gray[50] : theme.colors.secondary.charcoal,
											}}
										>
											Monthly
										</button>
										<button
											type="button"
											onClick={() => setRevenueView('yearly')}
											className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
											style={{
												backgroundColor: revenueView === 'yearly' ? theme.colors.primary.DEFAULT : 'transparent',
												color: revenueView === 'yearly' ? theme.colors.gray[50] : theme.colors.secondary.charcoal,
											}}
										>
											Yearly
										</button>
									</div>
									<button
										type="button"
										onClick={previousRevenuePeriod}
										className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/70"
										style={{ borderColor: componentStyles.subtleBorder, color: theme.colors.secondary.charcoal }}
									>
										‹
										Prev
									</button>
									<button
										type="button"
										onClick={nextRevenuePeriod}
										className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/70"
										style={{ borderColor: componentStyles.subtleBorder, color: theme.colors.secondary.charcoal }}
									>
										Next
										›
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-2">
								<div className="rounded-xl border px-3 py-2" style={{ borderColor: componentStyles.lightBorder, backgroundColor: withAlpha(theme.colors.secondary.beige, 0.44) }}>
									<p className="text-xs uppercase tracking-[0.12em]" style={{ color: componentStyles.subtleText }}>Outstanding</p>
									<p className="mt-1 text-sm font-semibold" style={{ color: theme.colors.primary.dark }}>{formatCurrency(dashboardStats.outstandingAmount)}</p>
								</div>
							</div>

							<div className="mt-3 rounded-2xl border p-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.8), background: `linear-gradient(180deg, ${withAlpha(theme.colors.secondary.sage, 0.24)} 0%, ${withAlpha(theme.colors.gray[50], 0.98)} 72%)` }}>
								<div className="h-[260px]">
									<Bar data={revenueChartData} options={revenueChartOptions} />
								</div>
							</div>

							<div className="mt-3 space-y-2">
								{revenueSeries.map((amount, index) => (
									<div key={`week-summary-${index}`} className="space-y-1">
										<div className="flex items-center justify-between text-xs">
											<span style={{ color: componentStyles.subtleText }}>{revenuePeriodSummaryLabels[index]}</span>
											<span className="font-semibold" style={{ color: theme.colors.secondary.charcoal }}>{formatCurrency(amount)}</span>
										</div>
										<div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.55) }}>
											<div
												className="h-full rounded-full"
												style={{
													width: `${Math.max(8, (amount / maxWeeklyRevenue) * 100)}%`,
													backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.86),
												}}
											/>
										</div>
									</div>
								))}
							</div>
						</aside>
					</div>
				</div>
			</main>

			<ModalShell
				isOpen={showCreateLinkModal}
				title="Create Payment Link"
				onClose={closeCreateLinkModal}
				closeDisabled={createLinkBusy}
				className="max-h-[90vh] overflow-y-auto"
			>
				<form className="space-y-4" onSubmit={handleCreatePaymentLink}>
					<div>
						<label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
							Client <span style={{ color: theme.colors.error.text }}>*</span>
						</label>
						<select
							value={createLinkForm.clientId}
							onChange={(event) => setCreateLinkForm((current) => ({ ...current, clientId: event.target.value }))}
							required
							className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
							style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
						>
							<option value="">Select a client</option>
							{clients.map((client) => {
								const clientId = client.id || client._id;
								return (
									<option key={clientId} value={clientId}>
										{getClientName(client)}
									</option>
								);
							})}
						</select>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
							Amount (EUR) <span style={{ color: theme.colors.error.text }}>*</span>
						</label>
						<input
							type="number"
							min="0.01"
							step="0.01"
							value={createLinkForm.amount}
							onChange={(event) => setCreateLinkForm((current) => ({ ...current, amount: event.target.value }))}
							required
							className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
							style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
						/>
					</div>

					{createLinkMessage && (
						<div
							className="rounded-xl px-3 py-2 text-sm"
							style={{
								backgroundColor: withAlpha(theme.colors.error.bg, 0.9),
								border: `1px solid ${theme.colors.error.border}`,
								color: theme.colors.error.text,
							}}
						>
							{createLinkMessage}
						</div>
					)}

					<div className="flex items-center justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={closeCreateLinkModal}
							disabled={createLinkBusy}
							className="rounded-xl px-4 py-2 text-sm font-medium"
							style={{
								backgroundColor: withAlpha(theme.colors.secondary.beige, 0.7),
								color: theme.colors.secondary.charcoal,
							}}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={createLinkBusy}
							className="rounded-xl px-4 py-2 text-sm font-semibold"
							style={{
								backgroundColor: createLinkBusy ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
								color: theme.colors.gray[50],
							}}
						>
							{createLinkBusy ? 'Sending...' : 'Create & Send Now'}
						</button>
					</div>
				</form>
			</ModalShell>
		</div>
	);
}
