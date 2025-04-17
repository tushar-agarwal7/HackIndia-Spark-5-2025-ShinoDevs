# ShinoLearn 🥷🧑‍💻

> **Web3-Powered Language Learning Platform**

[![License](https://img.shields.io/badge/license-MIT-blue.svg?cacheSeconds=3600)](LICENSE)

## 🚀 Overview

ShinoLearn combines AI-powered language learning with blockchain incentives, creating a revolutionary approach to mastering new languages. Users stake cryptocurrency on learning challenges, earning rewards for consistent practice and achievement.

*~Every word is a weapon — wield it well.*

## ✨ Core Concept

```mermaid
graph LR
    User((User))
    subgraph "ShinoLearn Platform"
        AI[AI Language Tutors] 
        BC[Blockchain Incentives]
    end
    User -->|Interacts with| AI
    User -->|Stakes crypto on| BC
    AI -->|Provides feedback| User
    BC -->|Rewards progress| User
    AI <-->|Progress tracking| BC
```

ShinoLearn combines two innovative approaches:

- **AI-Powered Practice**: Engage in natural conversations with AI avatars that provide real-time feedback tailored to your proficiency level
- **Blockchain Incentives**: Stake cryptocurrency on your learning journey, creating tangible motivation that rewards commitment and consistency

## 💡 Key Features

### 🔐 Web3 Authentication
- Connect securely with MetaMask
- JWT-based session management
- Personalized language learning profiles

### 🗣️ AI Learning Experience
- Interactive conversations with intelligent AI tutors
- Real-time pronunciation and grammar feedback
- Adaptive difficulty based on your progress

## 💪 The problem ShinoLearn solves

- **Low Engagement in Learning** – Many people struggle to stay consistent with self-education due to lack of external motivation or rewards.
- **Underutilized Yield in DeFi** – DeFi yield is often used for passive income but rarely leveraged to incentivize productive activities like learning.
- **Inefficient Incentives in EdTech** – Traditional learning platforms rely on certifications and gamification, but they don't offer tangible financial incentives for continued participation.

## 🔄 How It Works

```mermaid
    flowchart TD
    A[Connect Wallet] -->|Web3 login| B[Choose Language]
    B -->|Select language| C[Join a Challenge]
    C -->|Select/create| D[Stake Tokens]
    D -->|Stake USDC| E[Practice Daily]
    E -->|AI conversations| F[Track Progress]
    F -->|Review metrics| G{Challenge Complete?}
    G -->|Yes| H[Earn Rewards]
    H --> I[Level Up]
    I --> J[New Challenges]
    J --> C
    G -->|No| E
```

1. **Connect Wallet**: Securely log in with your Web3 wallet
2. **Choose Language**: Select your target language and proficiency level
3. **Join a Challenge**: Browse available challenges or create your own
4. **Stake Tokens**: Commit to your learning goals by staking USDC
5. **Practice Daily**: Engage with AI tutors in natural conversations
6. **Track Progress**: Monitor your improvement with detailed metrics
7. **Complete Challenge**: Earn back your stake plus additional rewards
8. **Level Up**: Build a learning streak and climb the leaderboards

<!-- ## 🎥 Demo

[![ShinoLearn Demo](https://api.placeholder.com/600x340)](https://youtu.be/placeholder)
*Click to watch our platform demo* -->

### 🏆 Challenge System

```mermaid
    flowchart TD
        A[User] --> B{Choose Challenge Type}
        B -->|No-Loss| C[Stake USDC]
        B -->|Hardcore| D[Stake USDC]
        C --> E[Complete Daily Practice]
        D --> E
        E --> F{Challenge Complete?}
        F -->|Yes| G{Challenge Type?}
        F -->|No| H{Continue?}
        G -->|No-Loss| I[Return Original Stake + Reward]
        G -->|Hardcore| J[Return Original Stake + Higher Reward]
        H -->|Yes| E
        H -->|No| K{Challenge Type?}
        K -->|No-Loss| L[Return Original Stake]
        K -->|Hardcore| M[Forfeit Stake to Community Pool]
```

Choose your challenge type:
- **No-Loss Challenges**: Stake returned upon completion
- **Hardcore Challenges**: Higher rewards, but stakes forfeited on failure

Track daily progress with AI-based evaluation metrics that measure real proficiency gains.

### 💰 Financial Incentives
- USDC staking via secure smart contracts
- Yield generation through integration with DeFi protocols
- Community reward pool for active participants

### 👥 Social Features
- Achievement system with digital badges
- Community leaderboards
- Group challenges and learning cohorts

## 📱 User Interface

<div align="center">
  <img src="/public/assets/LandingPage.png" alt="Landing Page">
      <img src="/public/assets/dashboard.png" alt="Dashboard Page">


</div>


<div align="center">
        <img src="/public/assets/Signup.png" alt="Signup Page">
  <img src="/public/assets/Challenges.png" alt="Staking Interface">



</div>

<div align="center">
        <img src="/public/assets/Ai-voice-tutor.png" alt="AI Voice Tutor Interface">

  <img src="/public/assets/exercise.png" alt="Staking Interface">


</div>

## 🚀 Getting Started

Ready to revolutionize your language learning journey? Follow these steps:

1. **Connect Your Wallet**: Link your MetaMask or compatible Web3 wallet
2. **Choose Your Language**: Select from our growing collection of supported languages
3. **Join Your First Challenge**: Start with a beginner-friendly No-Loss Challenge
4. **Practice Daily**: Engage with our AI tutors and track your progress

## 🛠️ Technical Architecture

```mermaid
    graph TD
    subgraph "User Devices"
        A[Mobile App] 
        B[Web Browser]
    end
    
    subgraph "Frontend"
        C[Next.js]
        D[React Components]
        E[Tailwind CSS]
        F[ethers.js]
    end
    
    subgraph "Backend"
        G[Next.js API Routes]
        H[Authentication Service]
        I[AI Conversation Service]
        J[Challenge Management]
    end
    
    subgraph "Database"
        K[(PostgreSQL)]
        L[Prisma ORM]
    end
    
    subgraph "Blockchain"
        M[Smart Contracts]
        N[Ethereum Network]
        O[DeFi Yield Integration]
    end
    
    subgraph "External Services"
        P[bloomz-560m AI]
        Q[Aave Protocol]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    C --> F
    F --> M
    C --> G
    G --> H
    G --> I
    G --> J
    H --> K
    I --> K
    J --> K
    K --> L
    I --> P
    M --> N
    M --> O
    O --> Q
```

### Frontend
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS with custom theming
- **State Management**: React Context API
- **Web3 Integration**: ethers.js

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Web3 signature verification
- **AI Integration**: bloomz-560m, Deepseek API

### Blockchain
- **Network**: Ethereum
- **Supported Wallet**: MetaMask
- **Smart Contracts**: Solidity (ERC-20 compatible)
- **DeFi Integration**: Aave protocol for yield generation

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- MetaMask or compatible Web3 wallet

### Local Development
```bash
# Clone the repository
git clone https://github.com/tushar-agarwal7/HackIndia-Spark-5-2025-ShinoDevs.git
cd HackIndia-Spark-5-2025-ShinoDevs

# Install dependencies
npm install

# Set up environment variables

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Smart Contract Deployment
```bash
# Navigate to contracts directory
cd shinobi-contracts

# Install dependencies
npm install

```

## 👥 Our Team

ShinoLearn is built by a passionate team of language educators, AI specialists, and blockchain developers dedicated to revolutionizing language learning through technology.

<div align="center">
  <img src="/public/shinodevs.jpeg" alt="ShinoLearn Team">
  <p><em>Meet the minds behind ShinoLearn</em></p>
</div>

