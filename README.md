# corriels

A minimalist, Notion-style Gmail client focused on clarity and efficiency.

![App Icon](/public/c-icon.svg)

## Features

- **Minimalist Design**: A clean interface inspired by Notion, using a custom green theme (`#00712D`) and carefully selected typography.
- **Smart Organization**:
    - **Conversations**: Focus on real discussions (Inbox + Sent messages).
    - **Inbox**: Your standard email stream.
    - **Trash**: Easily manage deleted items.
- **Enhanced Reading Experience**:
    - **Smart Abbreviation**: Long messages are automatically collapsed with a "View full message" option for better readability.
    - **History Management**: Previous messages in a thread are neatly tucked away in a "Show previous message" dropdown.
    - **Robust Rendering**: Handles complex email structures (HTML, multipart/related, inline images) seamlessly.
- **AI Assistance**: Integrated with Mistral AI to generate smart, context-aware replies to your emails.
- **Deep Linking**: Full URL synchronization allows you to bookmark or share links to specific folders, emails, or the compose window.
- **Dark Mode**: Fully supported dark theme that respects your system settings or can be toggled manually.
- **Secure**: Direct integration with Gmail API using OAuth 2.0.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Gmail API (via `@react-oauth/google`)
- **State Management**: Custom hooks with URL synchronization

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
