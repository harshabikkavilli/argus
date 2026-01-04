/**
 * Loading screen component - shown while connecting to MCP server
 */

export function LoadingScreen() {
	return (
		<div className='fixed inset-0 flex items-center justify-center bg-background-dark'>
			{/* Background grid pattern */}
			<div
				className='absolute inset-0 opacity-[0.02]'
				style={{
					backgroundImage: `
						linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
						linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
					`,
					backgroundSize: '60px 60px'
				}}
			/>

			{/* Content card */}
			<div className='relative z-10 flex flex-col items-center'>
				{/* Glass card container */}
				<div className='glass-panel rounded-2xl p-10 shadow-2xl'>
					{/* Logo */}
					<div className='flex flex-col items-center mb-8'>
						<div className='w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 mb-6'>
							<span className='material-symbols-outlined text-white text-[40px]'>
								visibility
							</span>
						</div>
						<h1 className='text-3xl font-bold text-white tracking-tight gradient-text mb-1'>
							Argus
						</h1>
						<p className='text-xs text-slate-500 tracking-[0.3em] uppercase font-medium'>
							Observability Platform
						</p>
					</div>

					{/* Loading indicator */}
					<div className='flex flex-col items-center'>
						{/* Progress bar */}
						<div className='w-48 h-1 bg-slate-700/50 rounded-full overflow-hidden mb-4'>
							<div className='h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-loading-bar' />
						</div>
						<p className='text-sm text-slate-400 font-mono'>
							Connecting to MCP Server...
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
