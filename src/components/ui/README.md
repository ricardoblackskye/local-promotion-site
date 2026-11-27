# UI Components

## Overview
Atomic design system components including forwardRef buttons, cards, badges, animated counters, typewriter text carousels, and interactive canvas graphics.

## Interface
- `Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>` — Interactive button supporting primary, secondary, and ghost variants.
- `Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>` — Container card supporting default and interactive hover states.
- `Badge: ({ children, variant, className }: BadgeProps) => JSX.Element` — Visual status and category tag.
- `TypewriterText: ({ phrases, typingSpeed, deletingSpeed, pauseDuration, className }: TypewriterTextProps) => JSX.Element` — Animated typewriter cycling text.
- `AnimatedCounter: ({ value, prefix, suffix, duration, className }: AnimatedCounterProps) => JSX.Element` — Viewport-triggered animated numeric tally.
- `NeuralCanvas: ({ className }: { className?: string }) => JSX.Element` — Particle network interactive canvas background.
- `AnimatedSectionHeader: ({ children, className, inView }: AnimatedSectionHeaderProps) => JSX.Element` — Motion header component with viewport reveal.

## Invariants
- `Button` and `Card` forward DOM refs to underlying HTML elements while preserving custom class variants.
- `AnimatedCounter` executes number easing once on viewport intersection and cleanly cancels animation frame on unmount.
- `NeuralCanvas` dynamically observes canvas size via `ResizeObserver` and caps particle network simulation at 60 nodes.
- `TypewriterText` continuously cycles phrase array with configurable typing, deleting, and pause intervals.

## Side Effects
- Schedules and clears window timeouts (`setTimeout`/`clearTimeout`) in `TypewriterText`.
- Schedules and cancels animation frames (`requestAnimationFrame`/`cancelAnimationFrame`) in `AnimatedCounter` and `NeuralCanvas`.
- Binds `ResizeObserver` to canvas DOM element in `NeuralCanvas`.

## Verification
- Run: `npm test`
