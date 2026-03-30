import { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '../components/AppSidebar';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../api/api';
import { theme } from '../utils/theme';
import { withAlpha, formatLongDate, formatClock, formatCurrency, getClientName } from '../utils/formatters';
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

const buildSparklinePoints = (values) => {
	const maxValue = Math.max(...values, 1);
	const width = 520;
	const height = 160;
	const stepX = width / (values.length - 1 || 1);

	return values.map((value, index) => {
		const x = index * stepX;
		const normalized = value / maxValue;
		const y = height - (normalized * 120) - 18;
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
	const [now, setNow] = useState(new Date());
	const [payments, setPayments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');

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

	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 60000);
		return () => window.clearInterval(timer);
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
	const sparklinePoints = useMemo(() => buildSparklinePoints(monthlyRevenueByWeek), [monthlyRevenueByWeek]);
	const sparklinePath = sparklinePoints.map((point) => `${point.x},${point.y}`).join(' ');

	const chartSummary = useMemo(() => {
		const totalRevenue = dashboardStats.paidThisMonthAmount;
		const outstanding = dashboardStats.outstandingAmount;
		const refunded = 0;

		return { totalRevenue, outstanding, refunded };
	}, [dashboardStats]);

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

	const statCards = [
		{
			id: 'paid-this-month',
			label: 'Paid This Month',
			value: formatCurrency(dashboardStats.paidThisMonthAmount),
			subtext: 'Revenue collected',
			tone: {
				backgroundColor: withAlpha(theme.colors.secondary.sage, 0.8),
				color: theme.colors.primary.darker,
			},
		},
		{
			id: 'unpaid',
			label: `${dashboardStats.unpaidCount} Unpaid Session(s)`,
			value: formatCurrency(dashboardStats.outstandingAmount),
			subtext: 'Awaiting payment',
			tone: {
				backgroundColor: withAlpha('#F59E0B', 0.16),
				color: '#D97706',
			},
		},
		{
			id: 'paid-count',
			label: 'Paid Count',
			value: String(dashboardStats.paidCount),
			subtext: 'This month',
			tone: {
				backgroundColor: withAlpha(theme.colors.secondary.beige, 0.7),
				color: theme.colors.secondary.charcoal,
			},
		},
		{
			id: 'failed-count',
			label: 'Refunds Issued',
			value: String(dashboardStats.failedCount),
			subtext: 'This month',
			tone: {
				backgroundColor: withAlpha('#4F46E5', 0.13),
				color: '#4338CA',
			},
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
				<header
					className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4 md:px-8"
					style={{
						backgroundColor: withAlpha(theme.colors.gray[50], 0.92),
						backdropFilter: 'blur(12px)',
						borderBottom: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}`,
					}}
				>
					<h1 className="text-xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
						Welcome, {user?.name?.split(' ')[0] || 'there'}
					</h1>
					<span className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>
						{formatLongDate(now)} {formatClock(now)}
					</span>
				</header>

				<div className="space-y-5 px-6 py-6 md:px-8">
					<section className="rounded-3xl p-6" style={componentStyles.card}>
						<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2 className="text-2xl font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
									Payments
								</h2>
								<p className="mt-1 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72) }}>
									Track invoices, payment links, and Stripe outcomes in one place.
								</p>
							</div>

							<div className="flex flex-col gap-2">
								<button
									type="button"
									className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
									style={{ backgroundColor: theme.colors.primary.DEFAULT, color: theme.colors.gray[50] }}
								>
									Create Payment Link
								</button>
								<button
									type="button"
									className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
									style={{ backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.82), color: theme.colors.gray[50] }}
								>
									Create Invoice
								</button>
							</div>
						</div>

						{error && (
							<div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text, border: `1px solid ${theme.colors.error.border}` }}>
								{error}
							</div>
						)}

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							{statCards.map((card) => (
								<article key={card.id} className="rounded-2xl border px-4 py-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: theme.colors.gray[50] }}>
									<p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.54) }}>
										{card.label}
									</p>
									<p className="mt-2 inline-flex rounded-lg px-2.5 py-1.5 text-lg font-semibold" style={card.tone}>
										{card.value}
									</p>
									<p className="mt-2 text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.63) }}>
										{card.subtext}
									</p>
								</article>
							))}
						</div>

						<div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
							<article className="rounded-2xl border p-5" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: theme.colors.gray[50] }}>
								<h3 className="text-lg font-semibold" style={{ color: theme.colors.secondary.charcoal }}>Quick Actions</h3>
								<div className="mt-5 grid grid-cols-3 gap-3">
									{quickActions.map((action) => {
										const ActionIcon = action.icon;

										return (
											<button
												key={action.id}
												type="button"
												className="flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
												style={{ color: theme.colors.secondary.charcoal }}
											>
												<span
													className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full"
													style={{ backgroundColor: withAlpha('#5D8B90', 0.95), color: theme.colors.gray[50] }}
												>
													<ActionIcon />
												</span>
												{action.label}
											</button>
										);
									})}
								</div>
							</article>

							<article className="rounded-2xl border p-5" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9), backgroundColor: theme.colors.gray[50] }}>
								<div className="mb-3 flex items-center justify-between gap-3">
									<h3 className="text-lg font-semibold" style={{ color: theme.colors.secondary.charcoal }}>Revenue Overview</h3>
									<span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.92), color: withAlpha(theme.colors.secondary.charcoal, 0.72) }}>
										{new Intl.DateTimeFormat('en-IE', { month: 'short' }).format(now)} 01 - {new Intl.DateTimeFormat('en-IE', { month: 'short', day: 'numeric' }).format(getEndOfMonth(now))}
									</span>
								</div>

								<svg viewBox="0 0 520 180" className="w-full" aria-label="Monthly revenue overview">
									<line x1="0" y1="142" x2="520" y2="142" stroke={withAlpha(theme.colors.secondary.charcoal, 0.2)} strokeWidth="1" />
									<polyline
										points={sparklinePath}
										fill="none"
										stroke={withAlpha(theme.colors.primary.DEFAULT, 0.9)}
										strokeWidth="3"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									{sparklinePoints.map((point, index) => (
										<g key={`pt-${index}`}>
											<circle cx={point.x} cy={point.y} r="4.5" fill={theme.colors.gray[50]} stroke={withAlpha(theme.colors.primary.DEFAULT, 0.95)} strokeWidth="2" />
											<text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="12" fill={withAlpha(theme.colors.secondary.charcoal, 0.72)}>
												{point.value > 0 ? formatCurrency(point.value) : '€0'}
											</text>
											<text x={point.x} y="168" textAnchor="middle" fontSize="12" fill={withAlpha(theme.colors.secondary.charcoal, 0.55)}>
												Week {index + 1}
											</text>
										</g>
									))}
								</svg>

								<div className="mt-4 grid gap-2 sm:grid-cols-3">
									<div className="rounded-xl px-3 py-2" style={{ backgroundColor: withAlpha(theme.colors.secondary.sage, 0.75) }}>
										<p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>Total Revenue</p>
										<p className="text-lg font-semibold" style={{ color: theme.colors.primary.darker }}>{formatCurrency(chartSummary.totalRevenue)}</p>
									</div>
									<div className="rounded-xl px-3 py-2" style={{ backgroundColor: withAlpha('#F59E0B', 0.13) }}>
										<p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>Outstanding</p>
										<p className="text-lg font-semibold" style={{ color: '#D97706' }}>{formatCurrency(chartSummary.outstanding)}</p>
									</div>
									<div className="rounded-xl px-3 py-2" style={{ backgroundColor: withAlpha('#4F46E5', 0.12) }}>
										<p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>Refunded</p>
										<p className="text-lg font-semibold" style={{ color: '#4338CA' }}>{formatCurrency(chartSummary.refunded)}</p>
									</div>
								</div>
							</article>
						</div>
					</section>

					<section className="rounded-3xl p-5" style={componentStyles.card}>
						<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
							<h3 className="text-lg font-semibold" style={{ color: theme.colors.secondary.charcoal }}>Payment Links</h3>

							<div className="flex flex-wrap items-center gap-2">
								<input
									type="search"
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
									placeholder="Search client, date, status"
									className="rounded-xl border bg-white px-3 py-2 text-sm outline-none"
									style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
								/>
								<select
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
									className="rounded-xl border bg-white px-3 py-2 text-sm outline-none"
									style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
								>
									<option value="all">All</option>
									<option value="paid">Paid</option>
									<option value="pending">Unpaid</option>
									<option value="failed">Failed</option>
								</select>
							</div>
						</div>

						{loading ? (
							<p className="py-6 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.65) }}>
								Loading payments...
							</p>
						) : filteredPayments.length === 0 ? (
							<p className="py-6 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.65) }}>
								No payments found for the current filter.
							</p>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full border-separate border-spacing-0">
									<thead>
										<tr>
											<th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em]" style={{ borderColor: componentStyles.lightBorder, color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
												Client
											</th>
											<th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em]" style={{ borderColor: componentStyles.lightBorder, color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
												Appointment Date
											</th>
											<th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em]" style={{ borderColor: componentStyles.lightBorder, color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
												Amount
											</th>
											<th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em]" style={{ borderColor: componentStyles.lightBorder, color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
												Status
											</th>
											<th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em]" style={{ borderColor: componentStyles.lightBorder, color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
												Created
											</th>
											<th className="border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em]" style={{ borderColor: componentStyles.lightBorder, color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredPayments.map((payment, index) => {
											const normalizedStatus = normalizePaymentStatus(payment.status);

											return (
												<tr key={payment._id || payment.id || `payment-row-${index}`} style={{ backgroundColor: componentStyles.getZebraRow(index) }}>
													<td className="px-3 py-3 text-sm" style={{ color: theme.colors.secondary.charcoal }}>
														{getClientName(payment?.appointment?.client)}
													</td>
													<td className="px-3 py-3 text-sm" style={{ color: theme.colors.secondary.charcoal }}>
														{getAppointmentDateText(payment)}
													</td>
													<td className="px-3 py-3 text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
														{formatCurrency(payment.amount)}
													</td>
													<td className="px-3 py-3 text-sm">
														<span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={getStatusStyle(normalizedStatus)}>
															{formatPaymentStatusLabel(normalizedStatus)}
														</span>
													</td>
													<td className="px-3 py-3 text-sm">
														{getPaymentCreatedText(payment)}
													</td>
													<td className="px-3 py-3 text-sm">
														{normalizedStatus === 'pending' ? (
															<button
																type="button"
																className="rounded-lg px-2.5 py-1 text-xs font-semibold"
																style={{ backgroundColor: withAlpha('#F59E0B', 0.18), color: '#D97706' }}
															>
																Send Reminder
															</button>
														) : payment.receiptURL ? (
															<a
																href={payment.receiptURL}
																target="_blank"
																rel="noreferrer"
																className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
																style={{ backgroundColor: withAlpha('#4F46E5', 0.14), color: '#4338CA' }}
															>
																View Receipt
																<ExternalLinkIcon />
															</a>
														) : (
															<span className="text-sm">
																None
															</span>
														)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</section>
				</div>
			</main>
		</div>
	);
}
