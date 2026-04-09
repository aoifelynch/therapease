import { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { PageHeader } from '../components/PageHeader';
import { PageTitleRow } from '../components/PageTitleRow';
import { ErrorAlert } from '../components/ErrorAlert';
import { useLiveNow } from '../hooks/useLiveNow';
import { StatCard } from '../components/StatCard';
import { AppDataTable } from '../components/AppDataTable';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../api/api';
import { theme } from '../utils/theme';
import { withAlpha, formatCurrency, getClientName } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';
import { ExternalLinkIcon } from '../utils/icons';

const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getEndOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

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

const buildSparklinePoints = (
	values,
	{
		width = 360,
		height = 170,
		topPadding = 20,
		bottomPadding = 28,
	} = {},
) => {
	const maxValue = Math.max(...values, 1);
	const drawableHeight = height - topPadding - bottomPadding;
	const stepX = width / (values.length - 1 || 1);

	return values.map((value, index) => {
		const x = index * stepX;
		const normalized = value / maxValue;
		const y = (height - bottomPadding) - (normalized * drawableHeight);
		return { x, y, value };
	});
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

	useEffect(() => {
		const loadPayments = async () => {
			setLoading(true);
			setError('');

			try {
				const response = await paymentsAPI.getAll();
				setPayments(response.data || []);
			} catch (requestError) {
				setError(requestError.response?.data?.message || requestError.message || 'Unable to load payments');
				setPayments([]);
			} finally {
				setLoading(false);
			}
		};

		loadPayments();
	}, []);

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

	const monthlyRevenueByWeek = useMemo(() => groupMonthlyRevenueByWeek(payments, now), [payments, now]);
	const selectedRevenueMonth = useMemo(() => getStartOfMonth(revenueMonth), [revenueMonth]);
	const selectedRevenueMonthEnd = useMemo(() => getEndOfMonth(revenueMonth), [revenueMonth]);
	const selectedMonthLabel = useMemo(() => new Intl.DateTimeFormat('en-IE', { month: 'long', year: 'numeric' }).format(selectedRevenueMonth), [selectedRevenueMonth]);
	const previousRevenueMonth = () => {
		setRevenueMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
	};
	const nextRevenueMonth = () => {
		setRevenueMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
	};
	const revenueBySelectedMonth = useMemo(() => groupMonthlyRevenueByWeek(payments, selectedRevenueMonth), [payments, selectedRevenueMonth]);
	const sparklinePoints = useMemo(() => buildSparklinePoints(revenueBySelectedMonth), [revenueBySelectedMonth]);
	const sparklinePath = sparklinePoints.map((point) => `${point.x},${point.y}`).join(' ');
	const maxWeeklyRevenue = useMemo(() => Math.max(...revenueBySelectedMonth, 1), [revenueBySelectedMonth]);

	const filteredPayments = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return [...payments]
			.filter((payment) => {
				if (statusFilter === 'all') return true;
				return normalizePaymentStatus(payment.status) === statusFilter;
			})
			.filter((payment) => {
				if (!normalizedSearch) return true;

				const clientName = getClientName(payment?.appointment?.client).toLowerCase();
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
												{getClientName(payment?.appointment?.client)}
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
										{selectedMonthLabel}
									</p>
								</div>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={previousRevenueMonth}
										className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/70"
										style={{ borderColor: componentStyles.subtleBorder, color: theme.colors.secondary.charcoal }}
									>
										‹
										Prev
									</button>
									<button
										type="button"
										onClick={nextRevenueMonth}
										className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/70"
										style={{ borderColor: componentStyles.subtleBorder, color: theme.colors.secondary.charcoal }}
									>
										Next
										›
									</button>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-xl border px-3 py-2" style={{ borderColor: componentStyles.lightBorder, backgroundColor: withAlpha(theme.colors.secondary.sage, 0.36) }}>
									<p className="text-xs uppercase tracking-[0.12em]" style={{ color: componentStyles.subtleText }}>Collected</p>
									<p className="mt-1 text-sm font-semibold" style={{ color: theme.colors.primary.DEFAULT }}>{formatCurrency(revenueBySelectedMonth.reduce((sum, amount) => sum + amount, 0))}</p>
								</div>
								<div className="rounded-xl border px-3 py-2" style={{ borderColor: componentStyles.lightBorder, backgroundColor: withAlpha(theme.colors.secondary.beige, 0.44) }}>
									<p className="text-xs uppercase tracking-[0.12em]" style={{ color: componentStyles.subtleText }}>Outstanding</p>
									<p className="mt-1 text-sm font-semibold" style={{ color: theme.colors.primary.dark }}>{formatCurrency(dashboardStats.outstandingAmount)}</p>
								</div>
							</div>

							<div className="mt-3 rounded-2xl border p-2" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.8), background: `linear-gradient(180deg, ${withAlpha(theme.colors.secondary.sage, 0.32)} 0%, ${withAlpha(theme.colors.gray[50], 0.98)} 72%)` }}>
								<svg viewBox="0 0 360 170" className="w-full" aria-label="Monthly revenue overview">
									<defs>
										<linearGradient id="paymentsRevenueArea" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stopColor={withAlpha(theme.colors.primary.DEFAULT, 0.3)} />
											<stop offset="100%" stopColor={withAlpha(theme.colors.primary.DEFAULT, 0.02)} />
										</linearGradient>
									</defs>

									{[48, 82, 116].map((gridY) => (
										<line
											key={`grid-${gridY}`}
											x1="0"
											y1={gridY}
											x2="360"
											y2={gridY}
											stroke={withAlpha(theme.colors.secondary.charcoal, 0.08)}
											strokeWidth="1"
										/>
									))}

									<line x1="0" y1="142" x2="360" y2="142" stroke={withAlpha(theme.colors.secondary.charcoal, 0.2)} strokeWidth="1.1" />

									{sparklinePoints.length > 0 && (
										<path
											d={`M ${sparklinePoints[0].x} 142 L ${sparklinePath.replace(/,/g, ' ')} L ${sparklinePoints[sparklinePoints.length - 1].x} 142 Z`}
											fill="url(#paymentsRevenueArea)"
										/>
									)}

									<polyline
										points={sparklinePath}
										fill="none"
										stroke={withAlpha(theme.colors.primary.DEFAULT, 0.95)}
										strokeWidth="3"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>

									{sparklinePoints.map((point, index) => (
										<g key={`pt-${index}`}>
											<circle cx={point.x} cy={point.y} r="3.5" fill={theme.colors.gray[50]} stroke={withAlpha(theme.colors.primary.DEFAULT, 0.9)} strokeWidth="1.7" />
											<text x={point.x} y="163" textAnchor="middle" fontSize="12" fill={withAlpha(theme.colors.secondary.charcoal, 0.62)}>
												W{index + 1}
											</text>
										</g>
									))}
								</svg>
							</div>

							<div className="mt-3 space-y-2">
								{revenueBySelectedMonth.map((amount, index) => (
									<div key={`week-summary-${index}`} className="space-y-1">
										<div className="flex items-center justify-between text-xs">
											<span style={{ color: componentStyles.subtleText }}>Week {index + 1}</span>
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
		</div>
	);
}
