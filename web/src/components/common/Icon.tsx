interface IconProps {
	name: string;
	size?: number;
	className?: string;
}

export function Icon({ name, size = 20, className = '' }: IconProps) {
	return (
		<span
			className={`material-symbols-outlined ${className}`}
			style={{ fontSize: `${size}px` }}
		>
			{name}
		</span>
	);
}

