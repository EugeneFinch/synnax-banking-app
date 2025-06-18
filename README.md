# Synnax Banking Platform

A modern AI-powered banking platform demo built with React, featuring crypto credit cards and intelligent investment strategies.

## Features

- 🏦 **Current Account**: Balance management, credit card, transaction history
- 💰 **AI Investment Platform**: Risk assessment, portfolio allocation, real-time rebalancing
- 🤖 **Intelligent Insights**: AI-driven recommendations and performance forecasting
- 🎨 **Modern UI**: Glass morphism design with smooth animations
- 📱 **Responsive**: Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Launch the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   The app will automatically open at `http://localhost:3000`

### Alternative Commands

- **Build for production:**
  ```bash
  npm run build
  ```

- **Preview production build:**
  ```bash
  npm run preview
  ```

## Project Structure

```
synnax-banking-app/
├── src/
│   ├── main.jsx          # React entry point
│   └── index.css         # Global styles with Tailwind
├── SynnaxBankingApp.jsx  # Main banking component
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── index.html            # HTML template
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library

## Demo Features

### Current Account Tab
- View current balance with privacy toggle
- Credit card with available credit display
- Recent transaction history
- Credit utilization tracking

### Savings & Investments Tab
1. **Investment Setup**: Choose amount to invest
2. **Risk Assessment**: Select Conservative, Balanced, or Aggressive strategy
3. **Strategy Customization**: Adjust allocation percentages
4. **Portfolio Dashboard**: View active investments with AI insights

### AI Features
- Risk profile recommendations
- Portfolio optimization
- Performance forecasting
- Real-time rebalancing

## Customization

You can customize the app by:
- Modifying the `userData` object in `SynnaxBankingApp.jsx`
- Adjusting investment strategies in `investmentOptions`
- Changing the color scheme in `tailwind.config.js`
- Adding new features to the component

## License

MIT License - feel free to use this for your own projects! 