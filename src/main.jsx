import React from 'react'
import ReactDOM from 'react-dom/client'
import SynnaxBankingApp from '../SynnaxBankingApp.jsx'
import './index.css'
import { PrivyProvider } from '@privy-io/react-auth'

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider appId={privyAppId}>
      <SynnaxBankingApp />
    </PrivyProvider>
  </React.StrictMode>,
) 