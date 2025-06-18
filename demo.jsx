import React, { useState, useEffect } from 'react';
import { ArrowRight, CreditCard, PiggyBank, TrendingUp, Shield, Zap, Target, CheckCircle, RefreshCw, DollarSign, Eye, EyeOff, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

  // User data
  const userData = {
    currentBalance: 25847.32,
    savingsBalance: 18650.00,
    creditLimit: 10000,
    creditUsed: 2450,
    totalDeposits: 44497.32,
    cardTransactions: [
      { id: 1, merchant: 'Amazon', amount: -89.99, date: '2025-06-18', type: 'purchase' },
      { id: 2, merchant: 'Starbucks', amount: -12.50, date: '2025-06-17', type: 'purchase' },
      { id: 3, merchant: 'Deposit', amount: 1000.00, date: '2025-06-16', type: 'deposit' },
      { id: 4, merchant: 'Uber', amount: -25.75, date: '2025-06-15', type: 'purchase' },
      { id: 5, merchant: 'Deposit', amount: 500.00, date: '2025-06-14', type: 'deposit' }
    ]
  };

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
    low: [
      { id: 'treasury', name: 'US Treasury Bills', apy: '5.2%', allocation: 40, risk: 'Very Low', protocol: 'Traditional Finance' },
      { id: 'usdc-lending', name: 'USDC Lending', apy: '6.8%', allocation: 35, risk: 'Low', protocol: 'Compound' },
      { id: 'stablecoin-lp', name: 'Stablecoin LP', apy: '7.5%', allocation: 25, risk: 'Low', protocol: 'Curve' }
    ],
    medium: [
      { id: 'treasury', name: 'US Treasury Bills', apy: '5.2%', allocation: 25, risk: 'Very Low', protocol: 'Traditional Finance' },
      { id: 'blue-chip', name: 'Blue Chip Stocks', apy: '12.5%', allocation: 30, risk: 'Medium', protocol: 'Tokenized Assets' },
      { id: 'defi-lending', name: 'DeFi Lending', apy: '11.2%', allocation: 25, risk: 'Medium', protocol: 'Aave' },
      { id: 'yield-farming', name: 'Yield Farming', apy: '18.7%', allocation: 20, risk: 'Medium-High', protocol: 'Uniswap V3' }
    ],
    high: [
      { id: 'blue-chip', name: 'Blue Chip Stocks', apy: '12.5%', allocation: 20, risk: 'Medium', protocol: 'Tokenized Assets' },
      { id: 'defi-lending', name: 'DeFi Lending', apy: '11.2%', allocation: 25, risk: 'Medium', protocol: 'Aave' },
      { id: 'yield-farming', name: 'Yield Farming', apy: '18.7%', allocation: 30, risk: 'Medium-High', protocol: 'Uniswap V3' },
      { id: 'liquidity-mining', name: 'Liquidity Mining', apy: '24.3%', allocation: 25, risk: 'High', protocol: 'SushiSwap' }
    ]
  };

  const handleRiskSelection = (risk) => {
    setRiskProfile(risk);
    setSelectedStrategies(investmentOptions[risk]);
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

  const totalValue = portfolio.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const weightedAPY = portfolio.reduce((sum, item) => 
    sum + (parseFloat(item.apy) * parseFloat(item.amount) / totalValue), 0
  ).toFixed(1);

  const availableCredit = userData.creditLimit - userData.creditUsed;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Synnax</h1>
            <p className="text-emerald-400">Next-Gen Banking Platform</p>
          </div>
        </div>
        <p className="text-gray-300">Crypto credit card & intelligent investment strategies</p>
      </div>

      {/* Main Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'current' 
                ? 'bg-emerald-600 text-white shadow-lg' 
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
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PiggyBank className="w-5 h-5 inline mr-2" />
            Savings & Investments
          </button>
        </div>
      </div>

      {/* Current Account Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Account Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-400">Current Balance</h3>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-gray-400 hover:text-white"
                >
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-3xl font-bold text-white">
                {showBalance ? `$${userData.currentBalance.toLocaleString()}` : '••••••'}
              </p>
              <p className="text-sm text-gray-400 mt-2">USDC Balance</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Credit Available</h3>
              <p className="text-3xl font-bold text-white">${availableCredit.toLocaleString()}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Used: ${userData.creditUsed.toLocaleString()}</span>
                  <span>Limit: ${userData.creditLimit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userData.creditUsed / userData.creditLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Total Deposits</h3>
              <p className="text-3xl font-bold text-white">${userData.totalDeposits.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-2">Lifetime deposits with Synnax</p>
            </div>
          </div>

          {/* Crypto Credit Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Synnax Card</h3>
                  <p className="text-emerald-100">Stablecoin Credit Card</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm">Available Credit</p>
                  <p className="text-2xl font-bold text-white">${availableCredit.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-emerald-100 text-sm mb-1">Card Number</p>
                <p className="text-xl font-mono text-white tracking-wider">•••• •••• •••• 8492</p>
              </div>
              
              <div className="flex justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Valid Thru</p>
                  <p className="text-white font-semibold">12/27</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm">Credit backed by</p>
                  <p className="text-white font-semibold">Your USDC deposits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {userData.cardTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-emerald-600' : 'bg-gray-600'
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
                      transaction.amount > 0 ? 'text-emerald-400' : 'text-white'
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
                  <p className="text-3xl font-bold text-white">${userData.savingsBalance.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-2">Currently earning yield</p>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-800/30 to-emerald-900/30 backdrop-blur-sm border border-emerald-700/30 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4">Available to Invest</h3>
                  <p className="text-3xl font-bold text-white">${userData.currentBalance.toLocaleString()}</p>
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
                    onClick={() => setStep(2)}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0 || parseFloat(depositAmount) > userData.currentBalance}
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
                              <h3 className="font-bold text-white">{strategy.name}</h3>
                              <p className="text-sm text-gray-400">{strategy.protocol} • {strategy.risk} Risk</p>
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
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Strategies</h3>
                  <p className="text-2xl font-bold text-emerald-400">{portfolio.length}</p>
                </div>
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
                        <h4 className="font-bold text-white">{item.name}</h4>
                        <p className="text-sm text-gray-400">{item.protocol} • {item.risk} Risk</p>
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
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-400 mb-2">Risk Assessment</h4>
                    <p className="text-gray-300 text-sm">
                      Your portfolio maintains a balanced risk profile with {portfolio.length} diversified strategies. 
                      The weighted risk level is optimized for your selected {riskProfiles[riskProfile].name.toLowerCase()} approach.
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
    </div>
  );
};

export default SynnaxBankingPlatform; 