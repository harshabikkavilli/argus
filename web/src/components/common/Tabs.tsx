import { ReactNode } from 'react';

interface Tab {
	id: string;
	label: string;
}

interface TabsProps {
	tabs: Tab[];
	activeTab: string;
	onChange: (tabId: string) => void;
	className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
	return (
		<div className={`flex gap-1 border-b border-border ${className}`}>
			{tabs.map((tab) => (
				<button
					key={tab.id}
					onClick={() => onChange(tab.id)}
					className={`
						px-4 py-2 text-sm font-medium border-b-2 transition-colors
						${
							activeTab === tab.id
								? 'text-accent border-accent'
								: 'text-text-secondary border-transparent hover:text-text-primary'
						}
					`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}

