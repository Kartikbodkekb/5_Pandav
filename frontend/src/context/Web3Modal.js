import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get projectId at https://cloud.walletconnect.com
// This is a test / generic Project ID that may fail on high loads.
// Add VITE_WALLETCONNECT_PROJECT_ID to your .env file for production.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'b2a00c73335bc7fb053dff4b136fc197'

// 2. Set chains
const helaTestnet = {
  chainId: 666888, // HeLa Testnet
  name: 'HeLa Testnet',
  currency: 'HLUSD',
  explorerUrl: 'https://testnet-scan.helachain.com',
  rpcUrl: 'https://testnet-rpc.helachain.com'
}

// 3. Create modal metadata
const metadata = {
  name: 'Agentic Protocol',
  description: 'AI Intent Verification Platform',
  url: 'http://localhost:5173', // Must match origin
  icons: ['https://avatars.githubusercontent.com/u/37784886'] // Generic placeholder 
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,
  /*Optional*/
  enableEIP6963: true, // true by default (for browser wallets)
  enableInjected: true, // true by default (for browser wallets)
  enableCoinbase: true, // true by default (for coinbase wallet)
})

// 5. Initialize Web3Modal
createWeb3Modal({
  ethersConfig,
  chains: [helaTestnet],
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-font-family': 'Inter, system-ui, sans-serif'
  }
})
