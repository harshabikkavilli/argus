import { ReactNode } from 'react';

interface BadgeProps {
	children: ReactNode;
	variant?: 'active' | 'success' | 'error' | 'replay' | 'warning' | 'completed' | 'default';
	className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
	const variantClasses = {
		active: 'bg-success text-white',
		success: 'bg-success text-white',
		error: 'bg-error text-white',
		replay: 'bg-purple text-white',
		warning: 'bg-warning text-black',
		completed: 'bg-text-secondary text-white',
		default: 'bg-bg-tertiary text-text-primary'
	};

	return (
		<span
			className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${variantClasses[variant]} ${className}`}
		>
			{children}
		</span>
	);
}

