import type { ReactNode } from 'react';
import './Hero.css';

interface HeroProps {
    emoji: string;
    eyebrow: string;
    title: ReactNode;
    description: ReactNode;
    compact?: boolean;
}

export function Hero({ emoji, eyebrow, title, description, compact = false }: HeroProps) {
    return (
        <header className={`hero${compact ? ' hero--compact' : ''}`}>
            <span className="hero-icon" aria-hidden="true">
                {emoji}
            </span>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="intro">{description}</p>
        </header>
    );
}
