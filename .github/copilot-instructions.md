# GitHub Copilot Instructions

## Project Overview

This is Peris - a minimalist ledger book application for personal accounting and financial tracking.

## Development Guidelines

### When Adding New Features

- **Always update the README.md** with the new feature in the Features section
- Update relevant sections (Usage, Views, etc.) if the feature changes user interaction
- Add new scripts to the "Available Scripts" section if applicable
- Update the project structure if new directories or significant files are added

### Code Standards

- Use TypeScript with strict typing
- Follow existing component patterns (see `components/*-view.tsx`)
- Use the established i18n system (`useLanguage()` hook) for all user-facing text
- Add translations to `lib/translations.ts` for both ES and EN
- Use Radix UI components from `components/ui/` for consistency
- Follow the ledger-inspired design aesthetic (serif fonts, minimal colors)
- **Format code with Prettier (no semicolons)**: Run `pnpm format` before committing

### Internationalization (i18n)

- All user-facing strings must be translatable
- Use `t("key.path")` from `useLanguage()` hook
- Add entries to both `es` and `en` objects in `translations.ts`
- Test both languages before committing

### Component Structure

- Use "use client" directive for interactive components
- Keep data logic in `lib/sample-data.ts`
- Follow the established naming: `*-view.tsx` for main views
- Use Tailwind CSS classes following the existing theme

### Git Workflow

- **Do not commit changes unless explicitly asked** - Always wait for user confirmation before running `git commit`
- Create feature branches prefixed with the author, e.g. `pablonete/feature-description`
- Link to GitHub issues in PR descriptions
- Keep commits focused and atomic
- Update documentation before merging
- **PR descriptions should be brief** - Ideally 4-5 lines max, focusing on what changed and why

## Key Files

- `README.md` - Main documentation (update with features)
- `lib/translations.ts` - All translatable strings
- `lib/sample-data.ts` - Demo data and data models
- `components/ledger-sidebar.tsx` - Main navigation
- `app/layout.tsx` - Root layout with providers

## Remember

📝 **Update README.md whenever you add features, change usage patterns, or modify the tech stack.**
