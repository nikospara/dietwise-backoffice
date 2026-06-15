import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
	const { t } = useTranslation();
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4">
			<h1>404 — {t('notFound.title')}</h1>
			<Link to="/" className="btn btn-primary">
				{t('notFound.backHome')}
			</Link>
		</div>
	);
}
