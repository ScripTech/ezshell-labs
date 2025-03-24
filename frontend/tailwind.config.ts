import type { Config } from "tailwindcss"

const config = {
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
  		typography: '({ theme }: any) => ({\n        DEFAULT: {\n          css: {\n            "--tw-prose-body": "hsl(var(--primary))",\n            "--tw-prose-headings": "hsl(var(--primary))",\n            "--tw-prose-lead": theme("colors.blue[700]"),\n            "--tw-prose-links": theme("colors.blue[900]"),\n            "--tw-prose-bold": theme("colors.blue[900]"),\n            "--tw-prose-counters": theme("colors.blue[600]"),\n            "--tw-prose-bullets": theme("colors.blue[400]"),\n            "--tw-prose-hr": theme("colors.blue[300]"),\n            "--tw-prose-quotes": theme("colors.blue[900]"),\n            "--tw-prose-quote-borders": theme("colors.blue[300]"),\n            "--tw-prose-captions": theme("colors.blue[700]"),\n            "--tw-prose-code": theme("colors.blue[600]"),\n            "--tw-prose-pre-code": theme("colors.blue[100]"),\n            "--tw-prose-pre-bg": "hsl(var(--background))",\n            "--tw-prose-th-borders": theme("colors.blue[300]"),\n            "--tw-prose-td-borders": theme("colors.blue[200]"),\n            "--tw-prose-invert-body": theme("colors.blue[200]"),\n            "--tw-prose-invert-headings": theme("colors.white"),\n            "--tw-prose-invert-lead": theme("colors.blue[300]"),\n            "--tw-prose-invert-links": theme("colors.white"),\n            "--tw-prose-invert-bold": theme("colors.white"),\n            "--tw-prose-invert-counters": theme("colors.blue[400]"),\n            "--tw-prose-invert-bullets": theme("colors.blue[600]"),\n            "--tw-prose-invert-hr": theme("colors.blue[700]"),\n            "--tw-prose-invert-quotes": theme("colors.blue[100]"),\n            "--tw-prose-invert-quote-borders": theme("colors.blue[700]"),\n            "--tw-prose-invert-captions": theme("colors.blue[400]"),\n            "--tw-prose-invert-code": theme("colors.white"),\n            "--tw-prose-invert-pre-code": theme("colors.blue[300]"),\n            "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)",\n            "--tw-prose-invert-th-borders": "hsl(var(--border))",\n            "--tw-prose-invert-td-borders": "hsl(var(--border))",\n          },\n        },\n      })',
  		colors: {
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
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
} satisfies Config;

export default config
