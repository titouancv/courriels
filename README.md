# courriels

A minimalist, Notion-style Gmail client focused on clarity and efficiency.

![App Icon](/public/c-icon.svg)

## Features

- **Minimalist Design**: A clean interface inspired by Notion, using a custom green theme (`#00712D`) and carefully selected typography.
- **Smart Organization**:
  - **Conversations**: Focus on real discussions (Inbox + Sent messages).
  - **Notifications**: Separated automated emails and newsletters to keep your inbox clean.
- **Dark Mode**: Fully supported dark theme for comfortable reading at night.
- **Fast & Responsive**: Built with modern web technologies for a snappy experience.
- **Secure**: Direct integration with Gmail API using OAuth 2.0.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Gmail API (via `@react-oauth/google`)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google Cloud Console project with the Gmail API enabled and a Client ID.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/titouancv/courriels.git
   cd courriels
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Google OAuth:
   - Create a `.env` file (or update `main.tsx` directly if strictly local for now, though env vars are recommended).
   - Ensure your Google Cloud Console project has `http://localhost:5173` added to authorized JavaScript origins.

4. Run the development server:
   ```bash
   npm run dev
   ```

## License

MIT
