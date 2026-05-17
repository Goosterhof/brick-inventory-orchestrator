import {defineConfig, presetAttributify, presetIcons, presetUno} from 'unocss';

export default defineConfig({
    presets: [presetUno(), presetAttributify(), presetIcons({scale: 1.2, warn: true})],
    shortcuts: {
        'brick-border': 'border-3 border-[var(--brick-border-color)] border-solid',
        'brick-shadow': 'shadow-[4px_4px_0px_0px_var(--brick-shadow-color)]',
        'brick-shadow-hover': 'shadow-[6px_6px_0px_0px_var(--brick-shadow-color)]',
        'brick-shadow-active': 'shadow-[2px_2px_0px_0px_var(--brick-shadow-color)]',
        'brick-shadow-error': 'shadow-[4px_4px_0px_0px_#C41A16]',
        'brick-shadow-error-hover': 'shadow-[6px_6px_0px_0px_#C41A16]',
        'brick-shadow-danger': 'shadow-[4px_4px_0px_0px_#C41A16]',
        'brick-label': 'text-sm text-[var(--brick-page-text)] font-bold uppercase tracking-wide',
        'brick-disabled':
            'bg-[var(--brick-surface-subtle)] border-[var(--brick-border-color)] text-[var(--brick-muted-text)] cursor-not-allowed shadow-none',
        'brick-transition':
            'transition-property-[box-shadow,background-color] transition-duration-150 transition-ease-[cubic-bezier(0.2,0,0,1)]',
        'brick-stud-grid': 'bg-[radial-gradient(circle,rgba(0,0,0,0.06)_22%,transparent_22%)] bg-[size:24px_24px]',
        'brick-stud-grid-hover':
            'hover:bg-[radial-gradient(circle,rgba(0,0,0,0.08)_22%,transparent_22%)] hover:bg-[size:24px_24px]',
        'brick-focus': 'outline-3 outline-offset-2 outline-brick-ink',
    },
    theme: {
        fontFamily: {heading: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif']},
        colors: {
            brick: {
                ink: '#000000',
                surface: '#FFFFFF',
                yellow: {DEFAULT: '#F5C518', subtle: '#FDF0C4'},
                red: {DEFAULT: '#C41A16', light: '#F8D0CF', dark: '#9B1510'},
                blue: '#0055BF',
            },
            baseplate: {green: '#237841'},
        },
    },
    rules: [],
});
