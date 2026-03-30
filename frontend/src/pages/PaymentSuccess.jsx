import { Link } from 'react-router-dom';
import { theme } from '../utils/theme';
import { withAlpha } from '../utils/formatters';

export function PaymentSuccess() {
	return (
		<main className="flex min-h-screen items-center justify-center px-6 py-10" style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}>
			<section className="w-full max-w-lg rounded-3xl p-8 text-center" style={{ backgroundColor: theme.colors.gray[50], border: `1px solid ${withAlpha(theme.colors.secondary.beige, 0.9)}` }}>
				<h1 className="text-2xl font-semibold">Payment received</h1>
				<p className="mt-3 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72) }}>
					Thank you. Your payment was completed successfully.
				</p>
				<Link
					to="/"
					className="mt-6 inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
					style={{ backgroundColor: theme.colors.primary.DEFAULT, color: theme.colors.gray[50] }}
				>
					Return to home
				</Link>
			</section>
		</main>
	);
}
