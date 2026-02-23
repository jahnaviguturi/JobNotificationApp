---
description: How to maintain and extend the Job Notification App design system
---

# Design System Guidelines

This document outlines the core principles and workflows for maintaining the Job Notification App design system.

## 1. Spacing Scale
Never use arbitrary values. Only use the following scale defined in `style.css`:
- `var(--space-1)`: 8px
- `var(--space-2)`: 16px
- `var(--space-3)`: 24px
- `var(--space-4)`: 40px
- `var(--space-5)`: 64px

## 2. Color Palette
Stick to the 4-color maximum rule:
- Background: `#F7F6F3` (`--color-bg`)
- Text: `#111111` (`--color-text-primary`)
- Accent: `#8B0000` (`--color-accent`)
- Success/Warning: Muted shades as defined in `style.css`.

## 3. Typography
- Headings MUST use 'Playfair Display' (Serif).
- Body text MUST use 'Inter' (Sans-serif).
- Text blocks should never exceed 720px for optimal readability.

## 4. Components
- **Buttons**: Use `.btn-primary` for the main action (solid deep red) and `.btn-secondary` for others (outlined).
- **Cards**: Use `.card`. Do not add box-shadows or gradients. Ensure borders are subtle.
- **Inputs**: Use `.input-base`. Focus states should use the accent color.

## 5. Layout
Maintain the header -> context -> workspace + panel -> footer structure.
- Workspace: 70% width
- Secondary Panel: 30% width (used for explanations, secondary actions, and prompts).

## 6. Interactions
- Keep transitions between 150-200ms.
- Use `ease-in-out`.
- No bounce animations.
