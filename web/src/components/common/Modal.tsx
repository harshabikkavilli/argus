import { ReactNode, useEffect } from 'react';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
			onClick={onClose}
		>
			<div
				className="bg-bg-secondary border border-border rounded-2xl w-[90%] max-w-4xl max-h-[85vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center p-6 border-b border-border">
					<h2 className="text-lg font-semibold">{title}</h2>
					<button
						onClick={onClose}
						className="text-text-secondary hover:text-text-primary text-2xl leading-none"
					>
						×
					</button>
				</div>
				<div className="p-6 overflow-y-auto flex-1">{children}</div>
				{footer && <div className="p-6 border-t border-border flex justify-end gap-3">{footer}</div>}
			</div>
		</div>
	);
}

