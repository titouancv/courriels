import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "1094289028640-2mk13lat0gi5a7qrnhsmf0sord2feb5r.apps.googleusercontent.com";
// const SECRET_CODE = "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"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
