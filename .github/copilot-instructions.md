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
- **Code comments**: Set a high bar - only explain non-obvious logic or the "why", never describe what code obviously does. Self-explanatory code with clear variable/function names is preferred over comments.

### Internationalization (i18n)

- All user-facing strings must be translatable
- Use `t("key.path")` from `useLanguage()` hook
- Add entries to both `es` and `en` objects in `translations.ts`
- Test both languages before committing

### Component Structure

- Use "use client" directive for interactive components
- Follow the established naming: `*-view.tsx` for main views
- Use Tailwind CSS classes following the existing theme
- Use shared helpers from `lib/ledger-utils.ts`
- **Data fetching**: Use `useStorageData()` and `useStorageQuarters()` hooks (powered by TanStack React Query). These handle caching (5-min stale time) and provide `data`, `isPending`, and `error` states
- **Use `ErrorBanner` component** from `components/error-banner.tsx` for displaying errors consistently

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
- `lib/ledger-utils.ts` - Shared formatting helpers
- `lib/use-storage-data.ts` - GitHub-backed data loader hook
- `lib/use-storage-quarters.ts` - GitHub-backed quarters hook
- `components/ledger-sidebar.tsx` - Main navigation
- `components/error-banner.tsx` - Shared error display component
- `app/layout.tsx` - Root layout with providers

## Remember

📝 **Update README.md whenever you add features, change usage patterns, or modify the tech stack.**
