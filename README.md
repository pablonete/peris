# Peris

A minimalist ledger book application for financial tracking based on GitHub repos.

## Features

- 📊 **Quarterly Organization** - Track finances by quarters (Q1-Q4)
- 💰 **Invoice Management** - Record and monitor sent invoices with payment dates
- 🧾 **Expense Tracking** - Log business expenses with VAT calculations
- 💵 **Cashflow View** - Monitor bank balance and transaction flow over time
- 🌍 **Bilingual Support** - Switch between Spanish (ES) and English (EN)

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Recharts](https://recharts.org/) - Data visualization

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/pablonete/peris.git
cd peris
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Navigation

- Use the **sidebar** to select quarters and navigate between different views
- Click on **quarter names** (e.g., "2024.Q1") to expand and view options
- Choose between **Invoices**, **Expenses**, or **Cashflow** views

### Language Toggle

Switch between Spanish and English using the **ES | EN** toggle at the bottom of the sidebar.

### Views

- **Welcome** - Overview of all quarters with key financial metrics
- **Invoices** - Detailed list of sent invoices with totals and payment dates
- **Expenses** - Business expenses with VAT breakdown
- **Cashflow** - Month-by-month bank balance and transactions

## Development

### Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

### Project Structure

```
peris/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # Reusable UI components (Radix-based)
│   ├── *-view.tsx   # Main view components
│   └── ledger-sidebar.tsx
├── lib/             # Utilities and data
│   ├── i18n-context.tsx   # Internationalization
│   ├── translations.ts    # Language dictionaries
│   └── sample-data.ts     # Demo financial data
└── public/          # Static assets
```

## Deployment

### GitHub Pages

The app can be deployed to GitHub Pages:

1. Enable GitHub Pages in repository settings (Source: GitHub Actions)
2. Push to `main` branch to trigger automatic deployment
3. Visit: `https://[username].github.io/peris`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

Started with v0 and then developed with Copilot on GitHub.
