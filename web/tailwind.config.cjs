const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		path.resolve(__dirname, 'index.html'),
		path.resolve(__dirname, 'src/**/*.{js,ts,jsx,tsx}')
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: '#814AC8',
				secondary: '#8b5cf6',
				'background-light': '#f7f6f8',
				'background-dark': '#000000',
				sidebar: '#1e293b',
				'border-color': '#334155',
				success: '#10b981',
				error: '#f43f5e',
				warning: '#f59e0b',
				surface: '#1e293b'
			},
			fontFamily: {
				display: ['Spline Sans', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			},
			borderRadius: {
				DEFAULT: '0.25rem',
				lg: '0.5rem',
				xl: '0.75rem',
				full: '9999px'
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				glow: 'glow 2s ease-in-out infinite alternate',
				'slide-in-right': 'slide-in-right 0.2s ease-out',
				'fade-in': 'fade-in 0.2s ease-out',
				'loading-bar': 'loading-bar 1.5s ease-in-out infinite'
			},
			keyframes: {
				glow: {
					'0%': {boxShadow: '0 0 5px #6366f1'},
					'100%': {boxShadow: '0 0 20px #8b5cf6, 0 0 10px #6366f1'}
				},
				'slide-in-right': {
					from: {transform: 'translateX(100%)', opacity: '0'},
					to: {transform: 'translateX(0)', opacity: '1'}
				},
				'fade-in': {
					from: {opacity: '0'},
					to: {opacity: '1'}
				},
				'loading-bar': {
					'0%': {transform: 'translateX(-100%)', width: '30%'},
					'50%': {width: '60%'},
					'100%': {transform: 'translateX(350%)', width: '30%'}
				}
			}
		}
	},
	plugins: []
};

