import { useTranslation } from 'react-i18next';
import { isTooLong } from '@/api/fieldLimits';

interface TooLongErrorProps {
	value: string;
	max: number;
	className?: string;
}

/**
 * Reports that a value is longer than the backend will store, and by how much. Renders nothing while the value fits,
 * so a field only draws attention once it is actually blocking a save. The editor showing this is responsible for
 * refusing to send the value — the message explains a save that will not happen, it does not prevent it.
 */
export function TooLongError({ value, max, className }: TooLongErrorProps) {
	const { t } = useTranslation();
	if (!isTooLong(value, max)) {
		return null;
	}
	return (
		<p className={`text-sm text-error ${className ?? ''}`}>
			{t('validation.tooLong', { length: value.length, max })}
		</p>
	);
}
