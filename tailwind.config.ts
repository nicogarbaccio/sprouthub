import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'sans': [
					'-apple-system',
					'BlinkMacSystemFont',
					'"SF Pro Display"',
					'"SF Pro Text"',
					'"Segoe UI"',
					'Roboto',
					'"Helvetica Neue"',
					'Arial',
					'sans-serif'
				],
				'sf': [
					'-apple-system',
					'BlinkMacSystemFont',
					'"SF Pro Display"',
					'"SF Pro Text"',
					'sans-serif'
				],
			},
			colors: {
				// Brand Palette
				'sprout': {
					// Primary Green Spectrum
					'dark': '#1d3c28',      // Dark forest green for headers, navigation, primary text
					'primary': '#2d5a3a',   // Main forest green for card sections, primary backgrounds
					'medium': '#4a7c59',    // Medium forest green for hover states, secondary elements
					'light': '#7ba987',     // Sage green for borders, subtle accents
					'pale': '#f0f4f1',      // Soft mint for card backgrounds, page sections
					
					// Accent & Functional Colors
					'success': '#00a643',   // Bright green for success states, "Easy" difficulty tags
					'cream': '#dfc490',     // Warm cream for CTAs, highlights, adding warmth
					'warning': '#ff8b47',   // Terracotta orange for warnings, "Medium" difficulty tags
					'water': '#0fa3b1',     // Water blue for watering reminders, info states
					'error': '#ff0000',     // Red for error states, "Hard" difficulty tags
					
					// Base colors
					'white': '#ffffff',     // Pure white for text backgrounds, clean spaces
					'black': '#000000'      // Pure black (use sparingly, prefer neutral-dark)
				},

				// Neutrals (with green undertones)
				'neutral': {
					'light': '#e8ebe8',     // Warm light gray for page backgrounds, dividers
					'medium': '#9ca39c',    // Sage gray for secondary text, icons
					'dark': '#3a423a',      // Charcoal green for body text, strong accents
				},

				// Keep existing shadcn colors
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'theme-transition': {
					'0%': {
						opacity: '0.8'
					},
					'100%': {
						opacity: '1'
					}
				},
				'toast-bounce-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.3) translateY(10px)'
					},
					'50%': {
						opacity: '0.8',
						transform: 'scale(1.05) translateY(-5px)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1) translateY(0)'
					}
				},
				'toast-slide-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(100%)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'toast-pulse': {
					'0%, 100%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.9',
						transform: 'scale(1.02)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'theme-transition': 'theme-transition 0.3s ease-out',
				'toast-bounce-in': 'toast-bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'toast-slide-up': 'toast-slide-up 0.3s ease-out',
				'toast-pulse': 'toast-pulse 2s ease-in-out infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
