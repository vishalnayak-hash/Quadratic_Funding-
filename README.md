# Quadratic Funding

## Project Description

Quadratic Funding is a decentralized funding mechanism that democratically allocates matching funds to public goods projects based on community support rather than just the amount of money raised. This smart contract implementation allows creators to propose projects, receive contributions from the community, and benefit from quadratic matching funds that amplify the impact of smaller donations.

The system uses the quadratic funding formula where the matching amount is calculated based on the square of the sum of square roots of individual contributions, minus the total contributions. This mechanism ensures that projects with broader community support (many small donations) receive proportionally more matching funds than projects with fewer large donations.

## Project Vision

Our vision is to create a fair and democratic funding ecosystem that:

- **Empowers Communities**: Gives more weight to the number of contributors rather than the size of individual contributions
- **Supports Public Goods**: Provides sustainable funding for projects that benefit the broader community
- **Promotes Inclusivity**: Ensures that even small contributors have a meaningful impact on funding decisions
- **Reduces Plutocracy**: Prevents wealthy individuals from having disproportionate influence over funding allocation
- **Encourages Innovation**: Creates incentives for projects that serve diverse community needs

## Key Features

### 🏗️ **Project Creation**
- Anyone can create a funding project with a name and description
- Each project gets a unique ID and tracks its creator
- Projects are active by default and can receive contributions

### 💰 **Democratic Contributions**
- Community members can contribute ETH to any active project
- System tracks both individual contribution amounts and contributor counts
- Multiple contributions from the same address are aggregated

### 📊 **Quadratic Matching Algorithm**
- Implements the quadratic funding formula: (∑√contributions)² - ∑contributions
- Calculates matching funds based on community support breadth
- Automatically distributes matching funds from the admin-controlled pool

### 🔒 **Secure Administration**
- Admin-only functions for managing the matching pool
- Transparent fund distribution process
- Event logging for all major actions

### 📈 **Real-time Analytics**
- View project details including funding status and contributor count
- Check individual contribution amounts
- Monitor matching fund calculations

## Future Scope

### 📱 **Enhanced User Experience**
- **Mobile App**: Native mobile application for easier access and contribution
- **Advanced UI**: Rich dashboard with analytics, charts, and project discovery
- **User Profiles**: Contributor profiles with funding history and impact metrics

### 🔐 **Security & Privacy**
- **Identity Verification**: Optional KYC integration to prevent Sybil attacks
- **Private Contributions**: Zero-knowledge proofs for anonymous funding
- **Audit Trail**: Enhanced transparency with detailed transaction history

### 🌐 **Scalability & Integration**
- **Layer 2 Support**: Deploy on Polygon, Arbitrum, or Optimism for lower fees
- **Cross-chain Funding**: Enable contributions from multiple blockchain networks
- **Oracle Integration**: Real-world impact verification and reporting

### 🤖 **Advanced Features**
- **AI-Powered Matching**: Machine learning algorithms to optimize fund distribution
- **Reputation System**: Contributor and project creator reputation scoring
- **Automated Milestones**: Smart contract-based milestone verification and fund release

### 🏛️ **Governance & Community**
- **DAO Integration**: Community governance for matching pool management
- **Voting Mechanisms**: Community voting on project eligibility and policies
- **Dispute Resolution**: Decentralized arbitration for funding disputes

### 📊 **Analytics & Reporting**
- **Impact Tracking**: Measure and report on funded project outcomes
- **Data Visualization**: Interactive charts and graphs for funding trends
- **Research Tools**: APIs for academic research on quadratic funding effectiveness

### 🌍 **Social Impact**
- **Category System**: Organize projects by cause areas (environment, education, health)
- **Geographic Filtering**: Location-based project discovery and funding
- **Impact Certificates**: NFT-based certificates for contributors and successful projects

## Getting Started

1. **Deploy Contract**: Deploy `Project.sol` to your preferred Ethereum network
2. **Add Matching Pool**: Admin adds ETH to the matching pool using `addMatchingPool()`
3. **Create Projects**: Users create projects using `createProject(name, description)`
4. **Contribute**: Community members contribute using `contributeToProject(projectId)`
5. **Distribute Funds**: Admin distributes matching funds using `distributeMatchingFunds(projectId)`

## Technology Stack

- **Smart Contracts**: Solidity ^0.8.19
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Web3 Integration**: Ethers.js
- **Blockchain**: Ethereum (compatible with EVM chains)
- **Development**: Hardhat/Truffle for testing and deployment

0x693409a4f7e8c0e57453d68f4253950409897254cea0fa85c0e9385f17988b82
<img width="1920" height="1080" alt="Screenshot (1)" src="https://github.com/user-attachments/assets/e1ca495a-14c3-4d60-8de1-acc1b78dfa7b" />
