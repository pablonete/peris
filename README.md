# Peris

A minimalist ledger book application for financial tracking based on GitHub repos.

## Features

- 📊 **Quarterly Organization** - Track finances by quarters (Q1-Q4)
- 💰 **Invoice Management** - Record and monitor sent invoices with payment dates
- 🧾 **Expense Tracking** - Log business expenses with VAT (multiple), IRPF (15%), payment dates, and the attached document
- 💵 **Cashflow View** - Monitor bank balance and transaction flow over time with multi-bank support and category tagging
- 🌍 **Bilingual Support** - Switch between Spanish (ES) and English (EN)
- 🔗 **GitHub Data Storage** - Store and sync your financial data from GitHub repositories

## Data Storage

### Overview

Peris stores financial data in GitHub repositories as JSON files. This allows you to:

- Keep your data in version control with traceability
- Access from anywhere, GitHub is your backend

### Sample Data

The app comes with sample data that's read from a public repository. This is perfect for exploring Peris without setting up your own data.

### Setting Up Your Own Repository

To use your own financial data:

1. **Create a GitHub Repository**
   - Create a new repository (can be private)
   - Optionally, organize your data in a folder (e.g., `data/` or `financials/`) so the same repo may contain multiple companies

2. **Create JSON Data Files**
   - Create one folder per quarter: `2025.1Q/`, `2025.2Q/`, etc.
   - Inside each quarter folder, create three JSON files:
     - `invoices.json` - List of invoices for that quarter
     - `expenses.json` - List of expenses for that quarter
     - `cashflow.json` - Bank transactions for that quarter
   - Example structure: `peris-data/finances/2025.4Q/invoices.json`
   - [See sample](https://github.com/pablonete/peris-sample-data)

3. **Create a Fine-Grained Personal Access Token** ⚠️ **SECURITY WARNING**
   - Go to GitHub Settings → Developer Settings → Personal access tokens → Fine-grained tokens
   - Click "Generate new token"
   - **Token settings:**
     - **Expiration**: Set an expiration date (recommended: 90 days or less)
     - **Resource owner**: Select the repository owner
     - **Repository access**: Select "Only select repositories" → Choose your Peris data repository
     - **Permissions**: Select "Repository permissions" → Contents: either Read-only or Read and write if you want to commit changes
   - Copy the token immediately (you'll only see it once!)
   - Never commit tokens to version control
   - **Alternative**: If you prefer, [classic personal access tokens](https://github.com/settings/tokens) still work (select `repo` scope) but it gives access to all your private repos

4. **Add Your Repository to Peris**
   - Click the **"Manage storages"** button at the bottom of the sidebar
   - Click **"Add new storage"**
   - Fill in:
     - **Name**: A name for your storage (e.g., "My Company 2025")
     - **Repository URL**: Your GitHub repository URL with token and path
       - Format: `https://[PAT@]github.com/owner/repo/path/to/quarters`
       - Example: `https://ghp_xxxxxxxxxxxx@github.com/pablonete/peris-data/finances`
       - The path should point to the folder containing your quarter folders (e.g., `finances/` where your `2025.1Q/`, `2025.2Q/` folders are)
   - **Save to localStorage**: Check to remember this connection on personal computers; uncheck on shared/public ones
   - Click **"Test connection"** to verify access
   - Click **"Add"** to save

5. **Switch Between Storages**
   - Use the dropdown at the bottom of the sidebar to switch between storages
   - All views will update to show data from the selected storage

6. **Creating New Quarters**
   - Once you have a storage connected with write permissions, you can create new quarters directly with the **"+"** button next to "Quarters" in the sidebar

When you edit data in Peris, changes are kept in memory until you commit them

### Data Structure

Your repository structure should look like:

```
finances/
├── peris.json
├── 2025.1Q/
│   ├── invoices.json
│   ├── expenses.json
│   └── cashflow.json
├── 2025.2Q/
│   ├── invoices.json
│   ├── expenses.json
│   └── cashflow.json
└── ...
```

**peris.json** - Optional global configuration at the root of the data path:

```json
{
  "categories": [
    "tax",
    "tax.vat",
    "tax.labour-retention",
    "payroll",
    "internet",
    "bank"
  ]
}
```

**invoices.json** - Array of invoices:

```json
[
  {
    "id": "inv-001",
    "date": "2025-01-15",
    "number": "001",
    "client": "Client Name",
    "concept": "Services",
    "subtotal": 1000,
    "vat": 210,
    "total": 1210,
    "paymentDate": "2025-02-01"
  }
]
```

**expenses.json** - Array of expenses:

```json
[
  {
    "id": "exp-001",
    "date": "2025-01-10",
    "number": "001",
    "vendor": "Vendor Name",
    "concept": "Office supplies",
    "vat": [{ "subtotal": 100, "rate": 21, "amount": 21 }],
    "taxRetention": 15,
    "paymentDate": "2025-01-15"
  }
]
```

**cashflow.json** - Array of transactions with metadata:

```json
{
  "companyName": "Your Company Name",
  "entries": [
    {
      "date": "2025-01-15",
      "concept": "Invoice received",
      "bankName": "Unicaja",
      "bankSequence": 1,
      "income": 1210,
      "balance": 6210,
      "category": "tax.vat"
    }
  ]
}
```

### Security Considerations

- **Token Storage**: Your PAT is stored in browser `localStorage`. This is suitable for:
  - Personal computers
  - Private machines
  - Development environments
  - **Not recommended**: Public computers or shared machines

- **Token Restrictions**: Always create tokens with minimum required permissions:
  - **Recommended**: Use Fine-Grained Personal Access Tokens scoped to a single repository with read-only "Contents" permission
  - **Alternative**: Classic PATs with `repo` scope (read-only) also work but have broader permissions
  - Each storage should use a separate token if possible
  - Regularly review and revoke unused tokens
  - Set token expiration dates (90 days recommended)

- **Private Repositories**: Create a private repository for sensitive financial data

- **No Backend**: All operations are client-side via GitHub API. Peris never stores your data on external servers.

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Recharts](https://recharts.org/) - Data visualization
- [Vitest](https://vitest.dev/) - Unit testing framework
- [Storybook](https://storybook.js.org/) - Component development and documentation

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

- Use the **sidebar** to switch between quarters and views
- Click on **quarter names** to expand and view available reports

### Language Toggle

Switch between Spanish and English using the **ES | EN** toggle at the bottom of the sidebar.

### Views

- **Welcome** - Overview of all quarters with key financial metrics
- **Invoices** - Detailed list of sent invoices with totals and payment dates
- **Expenses** - Business expenses with VAT rates (multiple), IRPF tax withholding, payment dates, PDFs, and paid/pending status summary
- **Cashflow** - Month-by-month bank balance and transactions

## Development

### Available Scripts

```bash
pnpm dev            # Start development server
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # Run ESLint
pnpm format         # Format code with Prettier
pnpm test           # Run tests in watch mode
pnpm test:run       # Run tests once
pnpm test:ui        # Run tests with UI
pnpm test:coverage  # Run tests with coverage report
pnpm storybook      # Start Storybook development server
pnpm build-storybook # Build Storybook to out/storybook
```

### Project Structure

```
peris/
├── app/                 # Next.js app directory with routes
├── components/          # React components
│   └── ui/              # Radix UI component library
├── lib/                 # Utilities, helpers, and business logic
├── public/              # Static assets
└── styles/              # Global styles
```

## Deployment

### GitHub Pages

The app can be deployed to GitHub Pages:

1. Enable GitHub Pages in repository settings (Source: GitHub Actions)
2. Push to `main` branch to trigger automatic deployment
3. Visit: `https://[username].github.io/peris`
4. Storybook is available at: `https://[username].github.io/peris/storybook`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

Started with v0 and then developed with Copilot on GitHub.
