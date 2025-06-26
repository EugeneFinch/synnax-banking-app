import React, { useState, useEffect } from 'react';
import { ArrowRight, CreditCard, PiggyBank, TrendingUp, Shield, Zap, Target, CheckCircle, RefreshCw, DollarSign, Eye, EyeOff, Plus, ArrowUpRight, ArrowDownRight, Users, Copy, Star, Activity, Moon } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { BigNumber } from 'ethers';
import { Contract } from 'ethers';
import POOL_ABI from './abis/Pool.json';
import DATA_PROVIDER_ABI from './abis/ProtocolDataProvider.json';

// AAVE V3 Pool Addresses for Base
const POOL_ADDRESSES_PROVIDER = '0xe20fCBdBfFC4Dd138cE812bA77181fEeD551eD2';
const POOL_ADDRESS = '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5'; // AAVE V3 Pool on Base
const DATA_PROVIDER_ADDRESS = '0x65285E9dfab318f57051ab2b139ccCf232945451'; // AAVE V3 Data Provider on Base (checksummed)

// USDC and aUSDC addresses for Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const AUSDC_ADDRESS = '0x4e65fe4dba92790696d040ac24aa414708f5c0ab'; // aBasUSDC (Aave Base USDC)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Add tooltip styles
const tooltipStyles = `
  .tooltip {
    position: relative;
    display: inline-block;
    cursor: help;
  }

  .tooltip .tooltip-text {
    visibility: hidden;
    width: 240px;
    background-color: #1a1a1a;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -120px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .tooltip:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
`;

// Create style tag for tooltips
const style = document.createElement('style');
style.textContent = tooltipStyles;
document.head.appendChild(style);

const SynnaxBankingPlatform = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [showBalance, setShowBalance] = useState(true);
  const [step, setStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [riskProfile, setRiskProfile] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [totalAllocation, setTotalAllocation] = useState(100);
  const [copyTradingAmount, setCopyTradingAmount] = useState('');
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [islamicBanking, setIslamicBanking] = useState(null);
  const [showIslamicModal, setShowIslamicModal] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showData, setShowData] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, ready, authenticated, login, logout } = usePrivy();
  const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');

  // Add state for live balances
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [aaveBalance, setAaveBalance] = useState(null);

  // Add state for loading and error for balances
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // Add at the top of SynnaxBankingPlatform:
  const [pendingLiveMode, setPendingLiveMode] = useState(null); // null, true, or false
  const [showModeConfirm, setShowModeConfirm] = useState(false);

  // Add state for the gotcha modal:
  const [showGotcha, setShowGotcha] = useState(false);

  // Initialize Aave contracts on mount
  useEffect(() => {
    const initializeContracts = async () => {
      try {
        setIsLoading(true);
        const contracts = await initializeAaveContracts();
        if (!contracts) {
          throw new Error('Failed to initialize Aave contracts');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (ready && authenticated) {
      initializeContracts();
    }
  }, [ready, authenticated]);

  // On mount, initialize isLiveMode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('isLiveMode');
    if (stored !== null) setIsLiveMode(stored === 'true');
  }, []);

  // When isLiveMode changes, persist to localStorage
  useEffect(() => {
    localStorage.setItem('isLiveMode', isLiveMode);
  }, [isLiveMode]);

  // Refetch balances function with loading and error
  const refetchBalances = async () => {
    setBalanceLoading(true);
    setBalanceError('');
    try {
      // Get the address inside the function, after checking readiness
      const userAddress = user?.wallet?.address || user?.wallets?.[0]?.address;
      if (!ready || !authenticated || !userAddress) {
        setBalanceLoading(false);
        setBalanceError('Wallet not ready. Please log in.');
        return;
      }
      // Sanity check: log provider chainId and user address
      const network = await provider.getNetwork();
      console.log('Provider RPC:', provider.connection?.url || provider.connection || provider);
      console.log('Network chainId:', network.chainId);
      console.log('User address:', userAddress);
      console.log('USDC address:', USDC_ADDRESS);
      console.log('aUSDC address:', AUSDC_ADDRESS);
      if (network.chainId !== 8453) {
        setBalanceError('Not connected to Base mainnet (chainId 8453).');
        setBalanceLoading(false);
        return;
      }
      // Minimal ERC20 ABI
      const minimalAbi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ];
      // USDC
      const usdcContract = new ethers.Contract(USDC_ADDRESS, minimalAbi, provider);
      let usdcDecimals = 6;
      try {
        usdcDecimals = await usdcContract.decimals();
      } catch (err) {
        console.warn('USDC.decimals() failed, falling back to 6');
      }
      let usdcRaw;
      try {
        usdcRaw = await usdcContract.balanceOf(userAddress);
        console.log('USDC balanceOf result:', usdcRaw.toString(), 'for address:', userAddress);
      } catch (err) {
        console.error('USDC balanceOf error:', err, 'for address:', userAddress);
        setBalanceError('USDC balanceOf call failed: ' + (err.message || err));
        setUsdcBalance(null);
        setAaveBalance(null);
        setBalanceLoading(false);
        return;
      }
      const usdc = Number(ethers.utils.formatUnits(usdcRaw, usdcDecimals));
      setUsdcBalance(usdc);
      // aUSDC
      const aUsdcContract = new ethers.Contract(AUSDC_ADDRESS, minimalAbi, provider);
      let aUsdcDecimals = 6;
      try {
        aUsdcDecimals = await aUsdcContract.decimals();
      } catch (err) {
        console.warn('aUSDC.decimals() failed, falling back to 6');
      }
      let aUsdcRaw;
      try {
        aUsdcRaw = await aUsdcContract.balanceOf(userAddress);
      } catch (err) {
        console.error('aUSDC balanceOf error:', err);
        setBalanceError('aUSDC balanceOf call failed: ' + (err.message || err));
        setUsdcBalance(null);
        setAaveBalance(null);
        setBalanceLoading(false);
        return;
      }
      setAaveBalance(Number(ethers.utils.formatUnits(aUsdcRaw, aUsdcDecimals)));
    } catch (err) {
      setBalanceError('Failed to fetch balances: ' + err.message);
      setUsdcBalance(null);
      setAaveBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Use refetchBalances in useEffect and after deposit
  useEffect(() => {
    if (ready && authenticated && (user?.wallet?.address || user?.wallets?.[0]?.address)) {
      refetchBalances();
    }
  }, [ready, authenticated, user]);

  // Handle errors in Aave operations
  const handleError = (error) => {
    setError(error.message);
    console.error('Aave operation failed:', error);
  };

  // Redirect to gnosipay form
  const handleCardApply = () => {
    window.location.href = 'https://form.gnosipay.com';
  };

    // Initialize Aave V3 contracts
  const initializeAaveContracts = async () => {
    try {
      // Check if wallet is connected
      if (!window.ethereum) {
        throw new Error('Please connect your wallet first');
      }

      // Initialize provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const signer = provider.getSigner();

      // Check if we're on Base mainnet (chainId 8453 in decimal)
      if (network.chainId !== 8453) {
        try {
          // Try to switch to Base mainnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // 0x2105 is 8453 in hex
          });
          // Wait for network change
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            // Add Base network to MetaMask
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base Mainnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }]
            });
          } else {
            throw new Error('Failed to switch to Base mainnet');
          }
        }
      }

      // AAVE V3 Pool ABI (simplified)
      const poolAbi = [
        'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
        'function getReserveData(address asset) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint40, address, address, address, address, uint8)',
        'function getUserAccountData(address user) external view returns (uint256, uint256, uint256, uint256, uint256, uint256)'
      ];

      // Initialize Aave V3 Pool contract
      const poolContract = new Contract(POOL_ADDRESS, poolAbi, signer);
      
      // Verify contract is initialized
      if (!poolContract) {
        throw new Error('Failed to initialize Aave V3 Pool contract');
      }

      return {
        pool: poolContract,
        signer,
        provider
      };
    } catch (error) {
      console.error('Error initializing Aave V3 contracts:', error);
      setError(error.message);
      throw error;
    }
  };

  // Handle Aave V3 Deposit
  const handleAaveDeposit = async (asset, amount) => {
    try {
      setIsLoading(true);
      setError('');

      // Check if wallet is connected
      if (!window.ethereum) {
        throw new Error('Please connect your wallet first');
      }

      // Validate input
      if (!asset || amount === undefined || amount === '') {
        throw new Error('Asset and amount are required');
      }
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Initialize contracts and get pool instance
      const { pool, signer } = await initializeAaveContracts();
      const userAddress = await signer.getAddress();
      
      // Get the ERC20 token contract for approval
      const tokenContract = new ethers.Contract(asset, [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address owner) view returns (uint256)'
      ], signer);

      // Get token decimals and user balance
      const decimals = await tokenContract.decimals();
      const userBalance = await tokenContract.balanceOf(userAddress);
      
      // Convert amount to the correct decimals
      const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);
      
      // Check if user has enough balance
      if (userBalance.lt(amountWei)) {
        throw new Error('Insufficient balance');
      }

      // Approve the asset for deposit
      console.log(`Approving ${amount} tokens for Aave V3...`);
      const approveTx = await tokenContract.approve(
        POOL_ADDRESS, 
        amountWei,
        { gasLimit: 200000 }
      );
      
      // Wait for approval to be mined
      console.log('Waiting for approval confirmation...');
      await approveTx.wait(1);
      
      // Execute deposit
      console.log(`Depositing ${amount} to Aave V3...`);
      const depositTx = await pool.supply(
        asset,                    // asset address
        amountWei,                // amount in wei
        userAddress,              // onBehalfOf
        0,                        // referralCode (0 for no referral)
        { 
          gasLimit: 300000,        // Higher gas limit for Base
          gasPrice: ethers.utils.parseUnits('0.1', 'gwei')  // Reasonable gas price for Base
        }
      );
      
      // Wait for deposit to be mined
      console.log('Waiting for deposit confirmation...');
      
      const receipt = await depositTx.wait();
      console.log('Deposit successful:', receipt);
      
      // Show success message
      alert('Deposit to Aave completed successfully!');
      
      // Refresh any necessary data
      // You might want to update the UI or fetch new balances here
      await refetchBalances();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to prompt for mode switch
  const promptLiveModeSwitch = (toLive) => {
    setPendingLiveMode(toLive);
    setShowModeConfirm(true);
  };

  // Handler to confirm mode switch
  const confirmLiveModeSwitch = () => {
    setIsLiveMode(pendingLiveMode);
    setShowModeConfirm(false);
    setPendingLiveMode(null);
  };

  // Handler to cancel mode switch
  const cancelLiveModeSwitch = () => {
    setShowModeConfirm(false);
    setPendingLiveMode(null);
  };

  // Replace handleLiveMode with:
  const handleLiveMode = (toLive) => {
    if (isLiveMode !== toLive) {
      promptLiveModeSwitch(toLive);
    }
  };

  // User data
  const userData = {
    currentBalance: isLiveMode ? 0 : 25847.32,
    savingsBalance: isLiveMode ? 0 : 18650.00,
    creditLimit: isLiveMode ? 0 : 10000,
    creditUsed: isLiveMode ? 0 : 2450,
    totalDeposits: isLiveMode ? 0 : 44497.32,
    copyTradingBalance: 0,
    cardTransactions: isLiveMode ? [] : [
      { id: 1, merchant: 'Amazon', amount: -89.99, date: '2025-06-18', type: 'purchase' },
      { id: 2, merchant: 'Starbucks', amount: -12.50, date: '2025-06-17', type: 'purchase' },
      { id: 3, merchant: 'Deposit', amount: 1000.00, date: '2025-06-16', type: 'deposit' },
      { id: 4, merchant: 'Uber', amount: -25.75, date: '2025-06-15', type: 'purchase' },
      { id: 5, merchant: 'Deposit', amount: 500.00, date: '2025-06-14', type: 'deposit' }
    ]
  };

  // Copy Trading Data
  const traders = isLiveMode ? [
    {
      id: 99,
      name: "James Wynn",
      username: "@jameswynnreal",
      avatar: "JW",
      monthlyPnL: -100000000, // -$0.1B
      totalPnL: 0,
      sharpeRatio: -3.14,
      winRate: 50,
      totalTrades: 0,
      followers: 500000,
      minCopyAmount: 1,
      maxCopyAmount: 10000000000,
      strategy: "Speculative Trading",
      riskLevel: "Very High",
      isVerified: false,
      isActive: true,
      performance: [],
      link: "https://x.com/jameswynnreal?lang=en",
      avatarUrl: './James.jpg' // Updated avatar URL
    }
  ] : [
    {
      id: 1,
      name: "Alex Chen",
      username: "@alex_crypto",
      avatar: "AC",
      monthlyPnL: 2847.50,
      totalPnL: 15680.25,
      sharpeRatio: 2.8,
      winRate: 78,
      totalTrades: 156,
      followers: 1247,
      minCopyAmount: 100,
      maxCopyAmount: 10000,
      strategy: "Momentum Trading",
      riskLevel: "Medium",
      isVerified: true,
      isActive: true,
      performance: [
        { month: 'Jan', pnl: 1200 },
        { month: 'Feb', pnl: -450 },
        { month: 'Mar', pnl: 2100 },
        { month: 'Apr', pnl: 1800 },
        { month: 'May', pnl: 3200 },
        { month: 'Jun', pnl: 2847 }
      ]
    },
    {
      id: 2,
      name: "Sarah Williams",
      username: "@sarah_defi",
      avatar: "SW",
      monthlyPnL: 1890.75,
      totalPnL: 8920.50,
      sharpeRatio: 3.2,
      winRate: 85,
      totalTrades: 89,
      followers: 892,
      minCopyAmount: 250,
      maxCopyAmount: 5000,
      strategy: "DeFi Yield Farming",
      riskLevel: "Low",
      isVerified: true,
      isActive: true,
      performance: [
        { month: 'Jan', pnl: 800 },
        { month: 'Feb', pnl: 1200 },
        { month: 'Mar', pnl: 950 },
        { month: 'Apr', pnl: 1400 },
        { month: 'May', pnl: 1600 },
        { month: 'Jun', pnl: 1890 }
      ]
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      username: "@mike_scalper",
      avatar: "MR",
      monthlyPnL: 4250.00,
      totalPnL: 22450.75,
      sharpeRatio: 1.9,
      winRate: 65,
      totalTrades: 342,
      followers: 2156,
      minCopyAmount: 500,
      maxCopyAmount: 15000,
      strategy: "High-Frequency Scalping",
      riskLevel: "High",
      isVerified: true,
      isActive: true,
      performance: [
        { month: 'Jan', pnl: 2800 },
        { month: 'Feb', pnl: -1200 },
        { month: 'Mar', pnl: 4500 },
        { month: 'Apr', pnl: 3200 },
        { month: 'May', pnl: 5800 },
        { month: 'Jun', pnl: 4250 }
      ]
    },
    {
      id: 4,
      name: "Emma Thompson",
      username: "@emma_arbitrage",
      avatar: "ET",
      monthlyPnL: 1650.25,
      totalPnL: 9870.00,
      sharpeRatio: 4.1,
      winRate: 92,
      totalTrades: 67,
      followers: 567,
      minCopyAmount: 100,
      maxCopyAmount: 3000,
      strategy: "Arbitrage & MEV",
      riskLevel: "Low",
      isVerified: true,
      isActive: false,
      performance: [
        { month: 'Jan', pnl: 1200 },
        { month: 'Feb', pnl: 1400 },
        { month: 'Mar', pnl: 1100 },
        { month: 'Apr', pnl: 1600 },
        { month: 'May', pnl: 1800 },
        { month: 'Jun', pnl: 1650 }
      ]
    }
  ];

  const riskProfiles = {
    low: {
      name: 'Conservative',
      icon: Shield,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
      borderColor: 'border-emerald-700',
      description: 'Low risk, steady returns',
      expectedReturn: '4-8% APY'
    },
    medium: {
      name: 'Balanced',
      icon: Target,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
      borderColor: 'border-emerald-700',
      description: 'Medium risk, balanced growth',
      expectedReturn: '8-15% APY'
    },
    high: {
      name: 'Aggressive',
      icon: Zap,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
      borderColor: 'border-emerald-700',
      description: 'High risk, maximum growth',
      expectedReturn: '15-25% APY'
    }
  };

  const investmentOptions = {
    // Conventional Investment Options
    conventional: {
      low: [
        { 
          id: 'aave-usdc', 
          name: 'USDC Lending (Aave)', 
          apy: '7.2%', 
          allocation: 100, 
          risk: 'Very Low', 
          protocol: 'Aave', 
          type: 'conventional',
          description: 'Lend USDC on Aave Base for stable returns'
        }
      ],
      medium: [
        { id: 'treasury', name: 'US Treasury Bills', apy: '5.2%', allocation: 25, risk: 'Very Low', protocol: 'Traditional Finance', type: 'conventional' },
        { id: 'blue-chip', name: 'Blue Chip Stocks', apy: '12.5%', allocation: 30, risk: 'Medium', protocol: 'Tokenized Assets', type: 'conventional' },
        { id: 'defi-lending', name: 'DeFi Lending', apy: '11.2%', allocation: 25, risk: 'Medium', protocol: 'Aave', type: 'conventional' },
        { id: 'yield-farming', name: 'Yield Farming', apy: '18.7%', allocation: 20, risk: 'Medium-High', protocol: 'Uniswap V3', type: 'conventional' }
      ],
      high: [
        { id: 'blue-chip', name: 'Blue Chip Stocks', apy: '12.5%', allocation: 20, risk: 'Medium', protocol: 'Tokenized Assets', type: 'conventional' },
        { id: 'defi-lending', name: 'DeFi Lending', apy: '11.2%', allocation: 25, risk: 'Medium', protocol: 'Aave', type: 'conventional' },
        { id: 'yield-farming', name: 'Yield Farming', apy: '18.7%', allocation: 30, risk: 'Medium-High', protocol: 'Uniswap V3', type: 'conventional' },
        { id: 'liquidity-mining', name: 'Liquidity Mining', apy: '24.3%', allocation: 25, risk: 'High', protocol: 'SushiSwap', type: 'conventional' }
      ]
    },
    // Islamic Finance Options (Halal)
    islamic: {
      low: [
        { id: 'sukuk', name: 'Sukuk (Islamic Bonds)', apy: '4.8%', allocation: 40, risk: 'Very Low', protocol: 'Islamic Finance', type: 'islamic', description: 'Asset-backed Islamic securities' },
        { id: 'wakalah', name: 'Wakalah Investment', apy: '5.5%', allocation: 35, risk: 'Low', protocol: 'Islamic Banking', type: 'islamic', description: 'Agency-based investment' },
        { id: 'murabaha', name: 'Murabaha Finance', apy: '6.2%', allocation: 25, risk: 'Low', protocol: 'Islamic Banking', type: 'islamic', description: 'Cost-plus financing' }
      ],
      medium: [
        { id: 'sukuk', name: 'Sukuk (Islamic Bonds)', apy: '4.8%', allocation: 25, risk: 'Very Low', protocol: 'Islamic Finance', type: 'islamic', description: 'Asset-backed Islamic securities' },
        { id: 'halal-stocks', name: 'Halal Stock Portfolio', apy: '11.8%', allocation: 30, risk: 'Medium', protocol: 'Islamic ETFs', type: 'islamic', description: 'Shariah-compliant equities' },
        { id: 'musharaka', name: 'Musharaka Investment', apy: '10.5%', allocation: 25, risk: 'Medium', protocol: 'Islamic Banking', type: 'islamic', description: 'Partnership-based investment' },
        { id: 'ijarah', name: 'Ijarah (Leasing)', apy: '8.9%', allocation: 20, risk: 'Medium', protocol: 'Islamic Banking', type: 'islamic', description: 'Asset leasing investment' }
      ],
      high: [
        { id: 'halal-stocks', name: 'Halal Stock Portfolio', apy: '11.8%', allocation: 20, risk: 'Medium', protocol: 'Islamic ETFs', type: 'islamic', description: 'Shariah-compliant equities' },
        { id: 'musharaka', name: 'Musharaka Investment', apy: '10.5%', allocation: 25, risk: 'Medium', protocol: 'Islamic Banking', type: 'islamic', description: 'Partnership-based investment' },
        { id: 'halal-crypto', name: 'Halal Crypto Mining', apy: '16.2%', allocation: 30, risk: 'Medium-High', protocol: 'Islamic DeFi', type: 'islamic', description: 'Shariah-compliant mining' },
        { id: 'salam', name: 'Salam Forward Contracts', apy: '14.7%', allocation: 25, risk: 'High', protocol: 'Islamic Trading', type: 'islamic', description: 'Forward sale contracts' }
      ]
    }
  };

  const handleRiskSelection = (risk) => {
    setRiskProfile(risk);
    const bankingType = islamicBanking ? 'islamic' : 'conventional';
    
    // In live mode, only allow Aave USDC lending for conservative strategy
    if (isLiveMode && risk === 'low') {
      setSelectedStrategies([
        { 
          id: 'aave-usdc', 
          name: 'USDC Lending (Aave)', 
          apy: '7.2%', 
          allocation: 100, 
          risk: 'Very Low', 
          protocol: 'Aave', 
          type: 'conventional',
          description: 'Lend USDC on Aave Base for stable returns'
        }
      ]);
    } else {
      setSelectedStrategies(investmentOptions[bankingType][risk]);
    }
    setStep(3);
  };

  const toggleStrategy = (strategyId) => {
    setSelectedStrategies(prev => 
      prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, selected: !strategy.selected }
          : strategy
      )
    );
  };

  const updateAllocation = (strategyId, newAllocation) => {
    const numericAllocation = Math.max(0, Math.min(100, parseInt(newAllocation) || 0));
    setSelectedStrategies(prev => 
      prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, allocation: numericAllocation }
          : strategy
      )
    );
  };

  const normalizeAllocations = () => {
    const activeStrategies = selectedStrategies.filter(s => s.selected !== false);
    const currentTotal = activeStrategies.reduce((sum, s) => sum + s.allocation, 0);
    setTotalAllocation(currentTotal);
  };

  useEffect(() => {
    normalizeAllocations();
  }, [selectedStrategies]);

  const generatePortfolio = () => {
    const activeStrategies = selectedStrategies.filter(s => s.selected !== false);
    const currentTotal = activeStrategies.reduce((sum, s) => sum + s.allocation, 0);
    
    const normalizedPortfolio = activeStrategies.map(strategy => ({
      ...strategy,
      amount: (parseFloat(depositAmount) * strategy.allocation / currentTotal).toFixed(2),
      normalizedAllocation: ((strategy.allocation / currentTotal) * 100).toFixed(1)
    }));

    setPortfolio(normalizedPortfolio);
    setStep(4);
  };

  const rebalancePortfolio = () => {
    setIsRebalancing(true);
    setTimeout(() => {
      setIsRebalancing(false);
      setPortfolio(prev => prev.map(item => ({
        ...item,
        amount: (parseFloat(item.amount) * (0.98 + Math.random() * 0.04)).toFixed(2)
      })));
    }, 2000);
  };

  const startCopyTrading = (trader) => {
    setSelectedTrader(trader);
    setCopyTradingAmount('');
  };

  const executeCopyTrade = () => {
    if (parseFloat(copyTradingAmount) >= selectedTrader.minCopyAmount && 
        parseFloat(copyTradingAmount) <= selectedTrader.maxCopyAmount) {
      // Simulate copy trading execution
      alert(`Successfully started copying ${selectedTrader.name} with $${copyTradingAmount}`);
      setSelectedTrader(null);
      setCopyTradingAmount('');
    } else {
      alert(`Amount must be between $${selectedTrader.minCopyAmount} and $${selectedTrader.maxCopyAmount}`);
    }
  };

  const totalValue = portfolio.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const weightedAPY = portfolio.reduce((sum, item) => 
    sum + (parseFloat(item.apy) * parseFloat(item.amount) / totalValue), 0
  ).toFixed(1);

  const availableCredit = isLiveMode ? 0 : userData.creditLimit - userData.creditUsed;

  function shortenAddress(addr) {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen text-white">
      {/* Privy Login Button - Top Left Corner */}
      <div className="fixed top-4 right-4 z-50">
        {!authenticated ? (
          <button
            onClick={login}
            className="px-6 py-2 text-base bg-gradient-to-br from-green-400 via-emerald-500 to-green-700 hover:from-emerald-500 hover:to-green-900 text-white font-extrabold rounded-xl shadow-xl border-2 border-emerald-300 ring-2 ring-emerald-400/40 transition-all"
            disabled={!ready}
          >
            Log In
          </button>
        ) : (
          <div className="flex items-center space-x-2 bg-gray-800/80 px-3 py-2 rounded-xl shadow-lg">
            <span className="font-semibold text-emerald-400">{user?.email || 'Account'}</span>
            <span className="font-mono text-emerald-300 bg-emerald-900/40 px-2 py-1 rounded">
              {shortenAddress(user?.wallet?.address || user?.wallets?.[0]?.address)}
            </span>
            <button
              onClick={logout}
              className="ml-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Synnax</h1>
            {/* <p className="text-green-400">Next-Gen Banking Platform</p> */}
          </div>
        </div>
        <p className="text-gray-300">Crypto credit card, intelligent investments & copy trading</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center items-center mb-8">
        <div 
          className="flex items-center space-x-4 cursor-pointer"
          onClick={() => {
            if (!authenticated && isLiveMode) {
              login();
            } else {
              handleLiveMode(!isLiveMode); // <-- USE THE NEW HANDLER
            }
          }}
        >
          <div className="relative">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="mode-toggle"
                className="sr-only"
                checked={isLiveMode}
              />
              <div className={`w-16 h-8 rounded-full transition-colors duration-300 ease-in-out ${
                isLiveMode ? 'bg-emerald-500' : 'bg-gray-700'
              }`}>
                <div className={`dot absolute left-1 top-1 ${
                  isLiveMode ? 'translate-x-full bg-white' : 'bg-gray-300'
                } w-6 h-6 rounded-full transition-transform duration-300 ease-in-out`} />
              </div>
            </div>
            <label htmlFor="mode-toggle" className="ml-2">
              <span className={`font-medium ${
                isLiveMode ? 'text-emerald-400' : 'text-gray-400'
              }`}>{isLiveMode ? 'Live' : 'Demo'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex justify-center mb-8">
        <div className="glass bg-gradient-to-br from-[#181A20] via-[#1a2a23] to-[#23272f] rounded-2xl p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'current' 
                ? 'bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white shadow-lg glass' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-5 h-5 inline mr-2" />
            Current Account
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'savings' 
                ? 'bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white shadow-lg glass' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PiggyBank className="w-5 h-5 inline mr-2" />
            Savings & Investments
          </button>
          <button
            onClick={() => setActiveTab('copy-trading')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'copy-trading' 
                ? 'bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white shadow-lg glass' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Copy className="w-5 h-5 inline mr-2" />
            Copy Trading
          </button>
        </div>
      </div>

      {/* Current Account Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Account Overview */}
          <div className="flex justify-end mb-2">
            <button
              onClick={refetchBalances}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50"
              disabled={balanceLoading}
            >
              {balanceLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {balanceError && (
            <div className="mb-2 text-red-400 font-semibold">{balanceError}</div>
          )}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass bg-gradient-to-br from-[#181A20] via-[#1a2a23] to-[#23272f] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-400">Current Balance</h3>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-gray-400 hover:text-white"
                >
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-3xl font-bold text-white">
                {balanceLoading ? 'Loading...' : (showBalance ? (isLiveMode && usdcBalance !== null ? `$${usdcBalance.toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${userData.currentBalance.toLocaleString()}`) : '••••••')}
              </p>
              <p className="text-sm text-gray-400 mt-2">USDC Balance</p>
            </div>
            <div className="glass bg-gradient-to-br from-[#181A20] via-[#1a2a23] to-[#23272f] p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Credit Available</h3>
              <p className="text-3xl font-bold text-white">
                {balanceLoading ? 'Loading...' : (isLiveMode && aaveBalance !== null ? `$${(aaveBalance * 0.5).toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${availableCredit.toLocaleString()}`)}
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Used: $0</span>
                  <span>Limit: {balanceLoading ? 'Loading...' : (isLiveMode && aaveBalance !== null ? `$${(aaveBalance * 0.5).toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${userData.creditLimit.toLocaleString()}`)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `0%` }}
                  />
                </div>
              </div>
            </div>
            <div className="glass bg-gradient-to-br from-[#181A20] via-[#1a2a23] to-[#23272f] p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Savings Account</h3>
              <p className="text-3xl font-bold text-white">
                {balanceLoading ? 'Loading...' : (isLiveMode && aaveBalance !== null ? `$${aaveBalance.toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${userData.savingsBalance.toLocaleString()}`)}
              </p>
              <p className="text-sm text-gray-400 mt-2">Current deposit in Aave</p>
            </div>
          </div>

          {/* Crypto Credit Card */}
          <div className="glass bg-gradient-to-br from-[#181A20] via-[#1a2a23] to-[#23272f] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Synnax Card</h3>
                  <p className="text-green-400">Stablecoin Credit Card</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 text-sm">Available Credit</p>
                  <p className="text-2xl font-bold text-white">{balanceLoading ? 'Loading...' : (isLiveMode && aaveBalance !== null ? `$${(aaveBalance * 0.5).toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${availableCredit.toLocaleString()}`)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-green-400 text-sm mb-1">Card Number</p>
                <p className="text-xl font-mono text-white tracking-wider">
                  {isLiveMode ? '•••• •••• •••• ••••' : '•••• •••• •••• 8492'}
                </p>
              </div>

              {isLiveMode ? (
                <div className="mt-8">
                  <div className="tooltip">
                    <div className="flex justify-center">
                      <a 
                        href="https://gnosispay.com/card"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center"
                      >
                        <span className="text-emerald-400">Request Card through Gnosis</span>
                        <ArrowRight className="ml-2 w-5 h-5 text-emerald-400" />
                      </a>
                    </div>
                    <div className="tooltip-text">
                      Synnax partners with Gnosis to enable credit card functionality
                    </div>
                  </div>
                </div>
              ) : null}
              
              <div className="flex justify-between mt-6">
                <div>
                  <p className="text-green-400 text-sm mb-1">Valid Thru</p>
                  <p className="text-xl font-mono text-white">12/27</p>
                </div>
                <div>
                  <p className="text-green-400 text-sm mb-1">Credit backed by</p>
                  <p className="text-xl font-mono text-white">Your USDC deposits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass bg-gradient-to-br from-[#181A20] via-[#1a2a23] to-[#23272f] p-6">
            <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {userData.cardTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {transaction.type === 'deposit' ? 
                        <ArrowDownRight className="w-5 h-5 text-white" /> : 
                        <ArrowUpRight className="w-5 h-5 text-white" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-white">{transaction.merchant}</p>
                      <p className="text-sm text-gray-400">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-white'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">USDC</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Savings & Investments Tab */}
      {activeTab === 'savings' && (
        <div className="space-y-6">
          {step === 1 && (
            <>
              {/* Savings Overview */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4">Savings Balance</h3>
                  <p className="text-3xl font-bold text-white">
                    {isLiveMode && aaveBalance !== null ? `$${aaveBalance.toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${userData.savingsBalance.toLocaleString()}`}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Currently earning yield</p>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4">Available to Invest</h3>
                  <p className="text-3xl font-bold text-white">
                    {isLiveMode && usdcBalance !== null ? `$${usdcBalance.toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${userData.currentBalance.toLocaleString()}`}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">From current account</p>
                </div>
              </div>

              {/* Investment Setup */}
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Start Investing</h2>
                  <p className="text-gray-400">Choose how much to invest from your current account</p>
                </div>
                
                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      max={userData.currentBalance}
                      className="w-full p-4 text-2xl text-center bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:border-emerald-500 focus:outline-none text-white"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">USDC</span>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    {['1000', '5000', '10000'].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(amount)}
                        disabled={parseFloat(amount) > userData.currentBalance}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setShowIslamicModal(true)}
                    disabled={!isLiveMode && (!depositAmount || parseFloat(depositAmount) <= 0 || parseFloat(depositAmount) > userData.currentBalance)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Choose Investment Strategy
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Risk Assessment */}
          {step === 2 && (
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Investment Strategy</h2>
                <p className="text-gray-400">Select your risk tolerance for optimal returns</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(riskProfiles).map(([key, profile]) => {
                  const IconComponent = profile.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => handleRiskSelection(key)}
                      className={`${profile.bgColor} ${profile.borderColor} border-2 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all transform hover:scale-105 backdrop-blur-sm`}
                    >
                      <div className="text-center">
                        <IconComponent className={`w-12 h-12 ${profile.color} mx-auto mb-4`} />
                        <h3 className="text-xl font-bold text-white mb-2">{profile.name}</h3>
                        <p className="text-gray-400 mb-2">{profile.description}</p>
                        <p className={`${profile.color} font-bold text-lg`}>{profile.expectedReturn}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strategy Customization */}
          {step === 3 && (
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Customize Strategy</h2>
                <p className="text-gray-400">Adjust your {riskProfiles[riskProfile].name.toLowerCase()} investment allocation</p>
              </div>
              
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 mb-6">
                <div className="mb-4 p-4 bg-emerald-900/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-300">Total Allocation</p>
                    <p className={`text-lg font-bold ${totalAllocation === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {totalAllocation}%
                    </p>
                  </div>
                  {totalAllocation !== 100 && (
                    <p className="text-xs text-orange-400 mt-1">
                      Adjust allocations to total 100% for optimal portfolio balance
                    </p>
                  )}
                </div>
                
                <div className="grid gap-4">
                  {selectedStrategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        strategy.selected !== false 
                          ? 'border-emerald-600 bg-emerald-900/20' 
                          : 'border-gray-600 bg-gray-700/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleStrategy(strategy.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                strategy.selected !== false
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-gray-500'
                              }`}
                            >
                              {strategy.selected !== false && <CheckCircle className="w-4 h-4 text-white" />}
                            </button>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-white">{strategy.name}</h3>
                                {strategy.type === 'islamic' && (
                                  <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 text-xs font-medium rounded-full flex items-center">
                                    <Moon className="w-3 h-3 mr-1" />
                                    Halal
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">{strategy.protocol} • {strategy.risk} Risk</p>
                              {strategy.description && (
                                <p className="text-xs text-gray-500 mt-1">{strategy.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-xl font-bold text-emerald-400">{strategy.apy}</p>
                            <p className="text-xs text-gray-400">APY</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={strategy.allocation}
                                onChange={(e) => updateAllocation(strategy.id, e.target.value)}
                                disabled={strategy.selected === false}
                                className={`w-16 px-2 py-1 text-center border rounded bg-gray-700 text-white ${
                                  strategy.selected !== false 
                                    ? 'border-emerald-500 focus:border-emerald-400' 
                                    : 'border-gray-600 bg-gray-800'
                                } focus:outline-none`}
                              />
                              <span className="text-sm text-gray-400">%</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Allocation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={generatePortfolio}
                  disabled={totalAllocation !== 100}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                >
                  {totalAllocation === 100 ? 'Create Investment Portfolio' : `Adjust Allocation (${totalAllocation}%)`}
                </button>
              </div>
            </div>
          )}

          {/* Portfolio Dashboard */}
          {step === 4 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Investment Portfolio Active</h2>
                <p className="text-gray-400">Your funds are now earning optimized yields</p>
              </div>

              {/* Portfolio Summary */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Invested Amount</h3>
                  <p className="text-2xl font-bold text-white">${totalValue.toFixed(2)}</p>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Weighted APY</h3>
                  <p className="text-2xl font-bold text-emerald-400">{weightedAPY}%</p>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Risk Level</h3>
                  <p className="text-2xl font-bold text-emerald-400">{riskProfiles[riskProfile].name}</p>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Banking Type</h3>
                  <div className="flex items-center justify-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {islamicBanking ? (
                        <span className="flex items-center">
                          <Moon className="w-6 h-6 mr-2" />
                          Islamic
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <DollarSign className="w-6 h-6 mr-2" />
                          Conventional
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aave V3 Deposit Section */}
              <div className="mb-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">AAVE V3 Deposit (Base Network)</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount to Deposit (USDC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => handleAaveDeposit('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', depositAmount)}
                  disabled={isLoading || !depositAmount}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Deposit to Aave V3</span>
                    </div>
                  )}
                </button>
                {error && (
                  <div className="mt-3 text-sm text-red-400">
                    Error: {error}
                  </div>
                )}
              </div>

              {/* Portfolio Breakdown */}
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Investment Breakdown</h3>
                  <button
                    onClick={rebalancePortfolio}
                    disabled={isRebalancing}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRebalancing ? 'animate-spin' : ''}`} />
                    <span>{isRebalancing ? 'Rebalancing...' : 'Rebalance'}</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {portfolio.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white">{item.name}</h4>
                          {item.type === 'islamic' && (
                            <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 text-xs font-medium rounded-full flex items-center">
                              <Moon className="w-3 h-3 mr-1" />
                              Halal
                            </span>
                          )}
                          {item.protocol === 'Aave' && (
                            <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 text-xs font-medium rounded-full">
                              Aave Base
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{item.protocol} • {item.risk} Risk</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-emerald-400">{item.apy}</p>
                          <p className="text-xs text-gray-400">APY</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{item.normalizedAllocation}%</p>
                          <p className="text-xs text-gray-400">Allocation</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">${item.amount}</p>
                          <p className="text-xs text-gray-400">Amount</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-r from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">AI Portfolio Insights</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-emerald-400 mb-2">Performance Forecast</h4>
                    <p className="text-gray-300 text-sm">
                      Based on current market conditions and your {riskProfiles[riskProfile].name.toLowerCase()} strategy, 
                      your portfolio is projected to generate approximately ${(totalValue * parseFloat(weightedAPY) / 100).toFixed(2)} 
                      in annual returns.
                      {islamicBanking && (
                        <span className="block mt-2 text-emerald-400">
                          ✓ All investments comply with Shariah law and are interest-free
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-400 mb-2">
                      {islamicBanking ? 'Shariah Compliance' : 'Risk Assessment'}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {islamicBanking ? (
                        <>
                          Your portfolio maintains full Shariah compliance with {portfolio.length} diversified halal strategies. 
                          All investments are asset-backed and avoid interest (Riba), gambling (Maysir), and uncertainty (Gharar).
                        </>
                      ) : (
                        <>
                          Your portfolio maintains a balanced risk profile with {portfolio.length} diversified strategies. 
                          The weighted risk level is optimized for your selected {riskProfiles[riskProfile].name.toLowerCase()} approach.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Invest More
                </button>
                <button
                  onClick={() => setActiveTab('current')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Back to Account
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Copy Trading Tab */}
      {activeTab === 'copy-trading' && (
        <div className="space-y-6">
          {/* Copy Trading Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Copy Trading Balance</h3>
              <p className="text-3xl font-bold text-white">${userData.copyTradingBalance.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-2">Currently copying traders</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Available to Copy</h3>
              <p className="text-3xl font-bold text-white">
                {balanceLoading ? 'Loading...' : (isLiveMode && usdcBalance !== null ? `$${usdcBalance.toLocaleString(undefined, {maximumFractionDigits:2})}` : `$${userData.currentBalance.toLocaleString()}`)}
              </p>
              <p className="text-sm text-gray-400 mt-2">USDC available to invest in copy trading</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Active Traders</h3>
              <p className="text-3xl font-bold text-white">{traders.filter(t => t.isActive).length}</p>
              <p className="text-sm text-gray-400 mt-2">Available for copying</p>
            </div>
          </div>

          {/* Traders Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {traders.map((trader) => (
              <div key={trader.id} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
                {/* Trader Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                      {trader.avatarUrl ? (
                        <img
                          src={trader.avatarUrl}
                          alt={trader.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-900 flex items-center justify-center text-xl font-bold text-white">
                          {trader.avatar}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white">{trader.name}</h3>
                        {trader.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                      </div>
                      <p className="text-sm text-gray-400">{trader.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trader.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-700/50 text-gray-400'
                    }`}>
                      {trader.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-700/30 rounded-xl">
                    <p className="text-sm text-gray-400">Monthly P&L</p>
                    <p className={`text-lg font-bold ${trader.monthlyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trader.monthlyPnL >= 0 ? '+' : ''}${trader.monthlyPnL.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-700/30 rounded-xl">
                    <p className="text-sm text-gray-400">Sharpe Ratio</p>
                    <p className="text-lg font-bold text-emerald-400">{trader.sharpeRatio}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-700/30 rounded-xl">
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className="text-lg font-bold text-emerald-400">{trader.winRate}%</p>
                  </div>
                  <div className="text-center p-3 bg-gray-700/30 rounded-xl">
                    <p className="text-sm text-gray-400">Followers</p>
                    <p className="text-lg font-bold text-white">{trader.followers.toLocaleString()}</p>
                  </div>
                </div>

                {/* Strategy Info */}
                <div className="mb-4 p-3 bg-gray-700/20 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">Strategy</p>
                      <p className="font-semibold text-white">{trader.strategy}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Risk Level</p>
                      <p className={`font-semibold ${
                        trader.riskLevel === 'Low' ? 'text-emerald-400' : 
                        trader.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {trader.riskLevel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Copy Trading Limits */}
                <div className="mb-4 p-3 bg-emerald-900/20 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Copy Trading Limits</p>
                  <p className="text-sm text-white">
                    ${trader.minCopyAmount.toLocaleString()} - ${trader.maxCopyAmount.toLocaleString()}
                  </p>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => startCopyTrading(trader)}
                  disabled={!trader.isActive}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    trader.isActive 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Copy className="w-4 h-4 inline mr-2" />
                  {trader.isActive ? 'Start Copy Trading' : 'Currently Inactive'}
                </button>
              </div>
            ))}
          </div>

          {/* Copy Trading Modal */}
          {selectedTrader && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 max-w-md w-full mx-4">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Copy {selectedTrader.name}</h3>
                  <p className="text-gray-400">Enter amount to start copy trading</p>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      value={copyTradingAmount}
                      onChange={(e) => setCopyTradingAmount(e.target.value)}
                      placeholder="0.00"
                      min={selectedTrader.minCopyAmount}
                      max={selectedTrader.maxCopyAmount}
                      className="w-full p-4 text-2xl text-center bg-gray-700/50 border-2 border-gray-600 rounded-xl focus:border-emerald-500 focus:outline-none text-white"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">USDC</span>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    {['100', '500', '1000', '5000'].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCopyTradingAmount(amount)}
                        disabled={parseFloat(amount) < selectedTrader.minCopyAmount || parseFloat(amount) > selectedTrader.maxCopyAmount}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-emerald-900/20 rounded-xl">
                    <p className="text-sm text-gray-400 mb-1">Expected Monthly Return</p>
                    <p className="text-lg font-bold text-emerald-400">
                      ${(parseFloat(copyTradingAmount || 0) * (selectedTrader.monthlyPnL / 10000)).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedTrader(null)}
                      className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeCopyTrade}
                      disabled={!copyTradingAmount || parseFloat(copyTradingAmount) < selectedTrader.minCopyAmount || parseFloat(copyTradingAmount) > selectedTrader.maxCopyAmount}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-xl transition-colors"
                    >
                      Start Copying
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Islamic Banking Preference Modal */}
      {showIslamicModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 max-w-2xl w-full mx-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Investment Preferences</h3>
              <p className="text-gray-400">Do you require Islamic (Halal) banking services?</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Conventional Banking Option */}
              <div
                onClick={() => {
                  setIslamicBanking(false);
                  setShowIslamicModal(false);
                  setStep(2);
                }}
                className="p-6 border-2 border-gray-600 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all hover:bg-gray-700/30"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Conventional Banking</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Traditional investment options including interest-based products, stocks, and crypto assets
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />
                      Higher potential returns
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />
                      Wide range of options
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />
                      Traditional finance products
                    </div>
                  </div>
                </div>
              </div>

              {/* Islamic Banking Option */}
              <div
                onClick={() => {
                  setIslamicBanking(true);
                  setShowIslamicModal(false);
                  setStep(2);
                }}
                className="p-6 border-2 border-gray-600 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all hover:bg-gray-700/30"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Moon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Islamic Banking</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Shariah-compliant investment options with no interest (Riba) and ethical business practices
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />
                      No interest (Riba)
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />
                      Asset-backed investments
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />
                      Ethical business practices
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowIslamicModal(false)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModeConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl shadow-xl text-center">
            <h2 className="text-xl font-bold mb-4">Switch to {pendingLiveMode ? 'Live' : 'Demo'} Mode?</h2>
            <p className="mb-6">Are you sure you want to switch to {pendingLiveMode ? 'Live' : 'Demo'} mode? Unsaved progress may be lost.</p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmLiveModeSwitch} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold">Yes, Switch</button>
              <button onClick={cancelLiveModeSwitch} className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showGotcha && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl shadow-xl text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-4 text-emerald-400">Gotcha!</h2>
            <p className="mb-6 text-white">You thought we would add this here?</p>
            <button onClick={() => setShowGotcha(false)} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SynnaxBankingPlatform; 