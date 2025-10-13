# QuadraticFunding Project - Complete File Structure

## Project.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract QuadraticFunding {
    struct Project {
        uint256 id;
        string name;
        string description;
        address payable creator;
        uint256 totalFunding;
        uint256 contributorCount;
        bool isActive;
        mapping(address => uint256) contributions;
    }
    
    struct Contributor {
        address contributor;
        uint256 amount;
    }
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Contributor[]) public projectContributors;
    uint256 public projectCount;
    uint256 public matchingPool;
    address public admin;
    
    event ProjectCreated(uint256 indexed projectId, string name, address creator);
    event ContributionMade(uint256 indexed projectId, address contributor, uint256 amount);
    event MatchingFundsDistributed(uint256 indexed projectId, uint256 matchingAmount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier projectExists(uint256 _projectId) {
        require(_projectId > 0 && _projectId <= projectCount, "Project does not exist");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
// Core Function 1: Create a new project for funding
    function createProject(string memory _name, string memory _description) external {
        require(bytes(_name).length > 0, "Project name cannot be empty");
        require(bytes(_description).length > 0, "Project description cannot be empty");
        
        projectCount++;
        Project storage newProject = projects[projectCount];
        newProject.id = projectCount;
        newProject.name = _name;
        newProject.description = _description;
        newProject.creator = payable(msg.sender);
        newProject.totalFunding = 0;
        newProject.contributorCount = 0;
        newProject.isActive = true;
        
        emit ProjectCreated(projectCount, _name, msg.sender);
    }

    
    // Core Function 2: Contribute to a project
    function contributeToProject(uint256 _projectId) external payable projectExists(_projectId) {
        require(msg.value > 0, "Contribution must be greater than 0");
        require(projects[_projectId].isActive, "Project is not active");
        
        Project storage project = projects[_projectId];
        
        // If this is the first contribution from this address
        if (project.contributions[msg.sender] == 0) {
            project.contributorCount++;
            projectContributors[_projectId].push(Contributor({
                contributor: msg.sender,
                amount: msg.value
            }));
        } else {
            // Update existing contributor's amount
            for (uint i = 0; i < projectContributors[_projectId].length; i++) {
                if (projectContributors[_projectId][i].contributor == msg.sender) {
                    projectContributors[_projectId][i].amount += msg.value;
                    break;
                }
            }
        }
        
        project.contributions[msg.sender] += msg.value;
        project.totalFunding += msg.value;
        
        emit ContributionMade(_projectId, msg.sender, msg.value);
    }
    
    // Core Function 3: Calculate and distribute quadratic funding matching
    function distributeMatchingFunds(uint256 _projectId) external onlyAdmin projectExists(_projectId) {
        require(matchingPool > 0, "No matching funds available");
        require(projects[_projectId].isActive, "Project is not active");
        
        uint256 matchingAmount = calculateQuadraticMatch(_projectId);
        require(matchingAmount <= matchingPool, "Insufficient matching pool");
        
        projects[_projectId].creator.transfer(projects[_projectId].totalFunding + matchingAmount);
        matchingPool -= matchingAmount;
        projects[_projectId].isActive = false;
        
        emit MatchingFundsDistributed(_projectId, matchingAmount);
    }
    
    // Calculate quadratic funding match using simplified formula
    function calculateQuadraticMatch(uint256 _projectId) public view projectExists(_projectId) returns (uint256) {
        Project storage project = projects[_projectId];
        if (project.contributorCount == 0) return 0;
        
        uint256 sumOfSquareRoots = 0;
        
        // Calculate sum of square roots of contributions
        for (uint i = 0; i < projectContributors[_projectId].length; i++) {
            uint256 contribution = projectContributors[_projectId][i].amount;
            sumOfSquareRoots += sqrt(contribution);
        }
        
        // Quadratic funding formula: (sum of square roots)^2 - sum of contributions
        uint256 quadraticScore = (sumOfSquareRoots * sumOfSquareRoots) - project.totalFunding;
        
        // Calculate matching amount as percentage of available pool based on quadratic score
        uint256 totalQuadraticScore = getTotalQuadraticScore();
        if (totalQuadraticScore == 0) return 0;
        
        return (quadraticScore * matchingPool) / totalQuadraticScore;
    }
    
    // Helper function to calculate total quadratic score across all projects
    function getTotalQuadraticScore() internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 1; i <= projectCount; i++) {
            if (projects[i].isActive && projects[i].contributorCount > 0) {
                uint256 sumOfSquareRoots = 0;
                for (uint j = 0; j < projectContributors[i].length; j++) {
                    sumOfSquareRoots += sqrt(projectContributors[i][j].amount);
                }
                total += (sumOfSquareRoots * sumOfSquareRoots) - projects[i].totalFunding;
            }
        }
        return total;
    }
    
    // Simple square root implementation using Babylonian method
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    // Admin function to add matching pool funds
    function addMatchingPool() external payable onlyAdmin {
        matchingPool += msg.value;
    }
    
    // Get project details
    function getProject(uint256 _projectId) external view projectExists(_projectId) returns (
        uint256 id,
        string memory name,
        string memory description,
        address creator,
        uint256 totalFunding,
        uint256 contributorCount,
        bool isActive
    ) {
        Project storage project = projects[_projectId];
        return (
            project.id,
            project.name,
            project.description,
            project.creator,
            project.totalFunding,
            project.contributorCount,
            project.isActive
        );
    }
    
    // Get user's contribution to a project
    function getUserContribution(uint256 _projectId, address _user) external view projectExists(_projectId) returns (uint256) {
        return projects[_projectId].contributions[_user];
    }
    
    // Get project contributors
    function getProjectContributors(uint256 _projectId) external view projectExists(_projectId) returns (Contributor[] memory) {
        return projectContributors[_projectId];
    }
}
```

## README.md
```markdown
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
```

## Frontend/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quadratic Funding Platform</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.1/ethers.umd.min.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌟 Quadratic Funding Platform</h1>
            <p>Democratic funding for public goods projects</p>
            <div class="wallet-info">
                <button id="connectWallet" class="btn btn-primary">Connect Wallet</button>
                <div id="accountInfo" class="account-info hidden">
                    <span id="accountAddress"></span>
                    <span id="accountBalance"></span>
                </div>
            </div>
        </header>

        <main>
            <!-- Contract Status -->
            <section class="contract-status">
                <div class="status-card">
                    <h3>Contract Status</h3>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="label">Total Projects:</span>
                            <span id="totalProjects">0</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Matching Pool:</span>
                            <span id="matchingPool">0 ETH</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Contract Address:</span>
                            <span id="contractAddress">Not connected</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Create Project -->
            <section class="create-project">
                <div class="card">
                    <h2>🚀 Create New Project</h2>
                    <form id="createProjectForm">
                        <div class="form-group">
                            <label for="projectName">Project Name</label>
                            <input type="text" id="projectName" placeholder="Enter project name" required>
                        </div>
                        <div class="form-group">
                            <label for="projectDescription">Project Description</label>
                            <textarea id="projectDescription" placeholder="Describe your project and its impact" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-success">Create Project</button>
                    </form>
                </div>
            </section>

            <!-- Project List -->
            <section class="projects">
                <div class="projects-header">
                    <h2>💡 Active Projects</h2>
                    <button id="refreshProjects" class="btn btn-secondary">Refresh</button>
                </div>
                <div id="projectsList" class="projects-grid">
                    <!-- Projects will be loaded here -->
                </div>
            </section>

            <!-- Contribute to Project -->
            <section class="contribute">
                <div class="card">
                    <h2>💰 Contribute to Project</h2>
                    <form id="contributeForm">
                        <div class="form-group">
                            <label for="projectId">Project ID</label>
                            <input type="number" id="projectId" placeholder="Enter project ID" required min="1">
                        </div>
                        <div class="form-group">
                            <label for="contributionAmount">Contribution Amount (ETH)</label>
                            <input type="number" id="contributionAmount" placeholder="0.01" step="0.001" min="0.001" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Contribute</button>
                    </form>
                </div>
            </section>

            <!-- Admin Panel -->
            <section class="admin-panel" id="adminPanel" style="display: none;">
                <div class="card admin-card">
                    <h2>🔧 Admin Panel</h2>
                    <div class="admin-actions">
                        <div class="form-group">
                            <label for="matchingPoolAmount">Add to Matching Pool (ETH)</label>
                            <div class="input-button-group">
                                <input type="number" id="matchingPoolAmount" placeholder="1.0" step="0.1" min="0.1">
                                <button id="addMatchingPool" class="btn btn-warning">Add Funds</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="distributeProjectId">Distribute Matching Funds</label>
                            <div class="input-button-group">
                                <input type="number" id="distributeProjectId" placeholder="Project ID" min="1">
                                <button id="distributeFunds" class="btn btn-danger">Distribute</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- Loading Overlay -->
        <div id="loadingOverlay" class="loading-overlay hidden">
            <div class="loading-spinner"></div>
            <p>Processing transaction...</p>
        </div>

        <!-- Toast Notifications -->
        <div id="toastContainer" class="toast-container"></div>
    </div>

    <script src="app.js"></script>
</body>
</html>
```

## Frontend/style.css
[Already provided in the previous artifact - the complete CSS file]

## Frontend/app.js
```javascript
// Contract configuration
const CONTRACT_ADDRESS = "0x..."; // Replace with your deployed contract address
const CONTRACT_ABI = [
    "function createProject(string memory _name, string memory _description) external",
    "function contributeToProject(uint256 _projectId) external payable",
    "function distributeMatchingFunds(uint256 _projectId) external",
    "function addMatchingPool() external payable",
    "function getProject(uint256 _projectId) external view returns (uint256, string, string, address, uint256, uint256, bool)",
    "function getUserContribution(uint256 _projectId, address _user) external view returns (uint256)",
    "function calculateQuadraticMatch(uint256 _projectId) external view returns (uint256)",
    "function projectCount() external view returns (uint256)",
    "function matchingPool() external view returns (uint256)",
    "function admin() external view returns (address)",
    "event ProjectCreated(uint256 indexed projectId, string name, address creator)",
    "event ContributionMade(uint256 indexed projectId, address contributor, uint256 amount)",
    "event MatchingFundsDistributed(uint256 indexed projectId, uint256 matchingAmount)"
];

// Global variables
let provider;
let signer;
let contract;
let userAccount;
let isAdmin = false;

// DOM elements
const connectWalletBtn = document.getElementById('connectWallet');
const accountInfo = document.getElementById('accountInfo');
const accountAddress = document.getElementById('accountAddress');
const accountBalance = document.getElementById('accountBalance');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Contract status elements
const totalProjectsElement = document.getElementById('totalProjects');
const matchingPoolElement = document.getElementById('matchingPool');
const contractAddressElement = document.getElementById('contractAddress');

// Form elements
const createProjectForm = document.getElementById('createProjectForm');
const contributeForm = document.getElementById('contributeForm');
const refreshProjectsBtn = document.getElementById('refreshProjects');
const projectsList = document.getElementById('projectsList');

// Admin elements
const adminPanel = document.getElementById('adminPanel');
const addMatchingPoolBtn = document.getElementById('addMatchingPool');
const distributeFundsBtn = document.getElementById('distributeFunds');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize application
async function initializeApp() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Check if already connected
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
    
    updateContractAddress();
}

// Setup event listeners
function setupEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    createProjectForm.addEventListener('submit', handleCreateProject);
    contributeForm.addEventListener('submit', handleContribute);
    refreshProjectsBtn.addEventListener('click', loadProjects);
    addMatchingPoolBtn.addEventListener('click', handleAddMatchingPool);
    distributeFundsBtn.addEventListener('click', handleDistributeFunds);

    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
    }
}

// Connect wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showToast('MetaMask Required', 'Please install MetaMask to use this application', 'error');
        return;
    }

    try {
        showLoading();
        
        // Request account access
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        
        // Initialize provider and signer
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAccount = accounts[0];
        
        // Initialize contract
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Update UI
        await updateWalletInfo();
        await checkAdminStatus();
        await loadContractStatus();
        await loadProjects();
        
        // Show connected UI
        connectWalletBtn.textContent = 'Connected';
        connectWalletBtn.disabled = true;
        accountInfo.classList.remove('hidden');
        
        showToast('Wallet Connected', 'Successfully connected to your wallet', 'success');
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showToast('Connection Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Handle account changes
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected
        resetApp();
    } else {
        // User switched accounts
        userAccount = accounts[0];
        await updateWalletInfo();
        await checkAdminStatus();
    }
}

// Reset application state
function resetApp() {
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.disabled = false;
    accountInfo.classList.add('hidden');
    adminPanel.style.display = 'none';
    contract = null;
    signer = null;
    provider = null;
    userAccount = null;
    isAdmin = false;
}

// Update wallet information
async function updateWalletInfo() {
    try {
        const balance = await provider.getBalance(userAccount);
        const balanceInEth = ethers.formatEther(balance);
        
        accountAddress.textContent = `${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`;
        accountBalance.textContent = `${parseFloat(balanceInEth).toFixed(4)} ETH`;
    } catch (error) {
        console.error('Error updating wallet info:', error);
    }
}

// Check if user is admin
async function checkAdminStatus() {
    try {
        const adminAddress = await contract.admin();
        isAdmin = adminAddress.toLowerCase() === userAccount.toLowerCase();
        adminPanel.style.display = isAdmin ? 'block' : 'none';
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

// Load contract status
async function loadContractStatus() {
    try {
        const projectCount = await contract.projectCount();
        const matchingPool = await contract.matchingPool();
        
        totalProjectsElement.textContent = projectCount.toString();
        matchingPoolElement.textContent = `${ethers.formatEther(matchingPool)} ETH`;
    } catch (error) {
        console.error('Error loading contract status:', error);
    }
}

// Update contract address display
function updateContractAddress() {
    contractAddressElement.textContent = CONTRACT_ADDRESS !== "0x..." 
        ? `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`
        : 'Not configured';
}

// Handle create project
async function handleCreateProject(event) {
    event.preventDefault();
    
    if (!contract) {
        showToast('Wallet Error', 'Please connect your wallet first', 'error');
        return;
    }

    const projectName = document.getElementById('projectName').value;
    const projectDescription = document.getElementById('projectDescription').value;

    try {
        showLoading();
        
        const tx = await contract.createProject(projectName, projectDescription);
        await tx.wait();
        
        showToast('Project Created', 'Your project has been successfully created!', 'success');
        createProjectForm.reset();
        await loadContractStatus();
        await loadProjects();
        
    } catch (error) {
        console.error('Error creating project:', error);
        showToast('Creation Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Handle contribute
async function handleContribute(event) {
    event.preventDefault();
    
    if (!contract) {
        showToast('Wallet Error', 'Please connect your wallet first', 'error');
        return;
    }

    const projectId = document.getElementById('projectId').value;
    const contributionAmount = document.getElementById('contributionAmount').value;

    try {
        showLoading();
        
        const amountInWei = ethers.parseEther(contributionAmount);
        const tx = await contract.contributeToProject(projectId, { value: amountInWei });
        await tx.wait();
        
        showToast('Contribution Successful', `Successfully contributed ${contributionAmount} ETH to project #${projectId}`, 'success');
        contributeForm.reset();
        await loadContractStatus();
        await loadProjects();
        await updateWalletInfo();
        
    } catch (error) {
        console.error('Error contributing:', error);
        showToast('Contribution Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load projects
async function loadProjects() {
    if (!contract) return;

    try {
        const projectCount = await contract.projectCount();
        const projectsGrid = document.getElementById('projectsList');
        projectsGrid.innerHTML = '';

        if (projectCount === 0n) {
            projectsGrid.innerHTML = '<p class="text-center">No projects created yet.</p>';
            return;
        }

        for (let i = 1; i <= Number(projectCount); i++) {
            const project = await contract.getProject(i);
            const matchingAmount = await contract.calculateQuadraticMatch(i);
            
            const projectCard = createProjectCard(i, project, matchingAmount);
            projectsGrid.appendChild(projectCard);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showToast('Loading Error', 'Failed to load projects', 'error');
    }
}

// Create project card element
function createProjectCard(projectId, project, matchingAmount) {
    const [id, name, description, creator, totalFunding, contributorCount, isActive] = project;
    
    const card = document.createElement('div');
    card.className = 'project-card fade-in';
    
    const statusBadge = isActive ? 
        '<span class="project-status active">🟢 Active</span>' : 
        '<span class="project-status inactive">🔴 Completed</span>';
    
    card.innerHTML = `
        <div class="project-header">
            <span class="project-id">#${projectId}</span>
            ${statusBadge}
        </div>
        <h3 class="project-title">${name}</h3>
        <p class="project-description">${description}</p>
        <div class="project-stats">
            <div class="stat-item">
                <span class="stat-value">${ethers.formatEther(totalFunding)} ETH</span>
                <span class="stat-label">Total Funding</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${contributorCount.toString()}</span>
                <span class="stat-label">Contributors</span>
            </div>
        </div>
        <div class="project-stats">
            <div class="stat-item">
                <span class="stat-value">${ethers.formatEther(matchingAmount)} ETH</span>
                <span class="stat-label">Potential Match</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${creator.slice(0, 6)}...${creator.slice(-4)}</span>
                <span class="stat-label">Creator</span>
            </div>
        </div>
        ${isActive ? `
            <button class="btn btn-primary" onclick="quickContribute(${projectId})">
                Quick Contribute 0.01 ETH
            </button>
        ` : ''}
    `;
    
    return card;
}

// Quick contribute function
async function quickContribute(projectId) {
    if (!contract) {
        showToast('Wallet Error', 'Please connect your wallet first', 'error');
        return;
    }

    try {
        showLoading();
        
        const amountInWei = ethers.parseEther('0.01');
        const tx = await contract.contributeToProject(projectId, { value: amountInWei });
        await tx.wait();
        
        showToast('Quick Contribution', `Successfully contributed 0.01 ETH to project #${projectId}`, 'success');
        await loadContractStatus();
        await loadProjects();
        await updateWalletInfo();
        
    } catch (error) {
        console.error('Error in quick contribute:', error);
        showToast('Contribution Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Handle add matching pool (admin only)
async function handleAddMatchingPool() {
    if (!isAdmin || !contract) return;

    const amount = document.getElementById('matchingPoolAmount').value;
    if (!amount) return;

    try {
        showLoading();
        
        const amountInWei = ethers.parseEther(amount);
        const tx = await contract.addMatchingPool({ value: amountInWei });
        await tx.wait();
        
        showToast('Pool Updated', `Added ${amount} ETH to matching pool`, 'success');
        document.getElementById('matchingPoolAmount').value = '';
        await loadContractStatus();
        await updateWalletInfo();
        
    } catch (error) {
        console.error('Error adding to matching pool:', error);
        showToast('Pool Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Handle distribute funds (admin only)
async function handleDistributeFunds() {
    if (!isAdmin || !contract) return;

    const projectId = document.getElementById('distributeProjectId').value;
    if (!projectId) return;

    try {
        showLoading();
        
        const tx = await contract.distributeMatchingFunds(projectId);
        await tx.wait();
        
        showToast('Funds Distributed', `Successfully distributed matching funds for project #${projectId}`, 'success');
        document.getElementById('distributeProjectId').value = '';
        await loadContractStatus();
        await loadProjects();
        
    } catch (error) {
        console.error('Error distributing funds:', error);
        showToast('Distribution Error', error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-message">
                <div class="toast-title">${title}</div>
                <div class="toast-text">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Format address for display
function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format ETH amount for display
function formatEthAmount(amount, decimals = 4) {
    return parseFloat(ethers.formatEther(amount)).toFixed(decimals);
}
```

---

## 📂 Complete Project Structure

```
QuadraticFunding/
│
├── Project.sol                 # Smart contract with 3 core functions
├── README.md                   # Complete project documentation
│
└── Frontend/
    ├── index.html              # User interface
    ├── style.css               # Styling
    └── app.js                  # Web3 integration
```

---

## 🚀 How to Use

### Step 1: Deploy the Smart Contract
1. Copy `Project.sol` to Remix IDE or your development environment
2. Compile with Solidity ^0.8.19
3. Deploy to your preferred network (Ethereum, Sepolia, etc.)
4. Copy the deployed contract address

### Step 2: Configure Frontend
1. Open `Frontend/app.js`
2. Replace `CONTRACT_ADDRESS = "0x..."` with your deployed contract address
3. Save the file

### Step 3: Run the Application
1. Open `Frontend/index.html` in your web browser
2. Connect MetaMask wallet
3. Start creating projects and contributing!

---

## 🎯 Core Functions in Smart Contract

### 1. **createProject(string _name, string _description)**
- Allows anyone to create a new funding project
- Emits `ProjectCreated` event

### 2. **contributeToProject(uint256 _projectId) payable**
- Allows users to contribute ETH to projects
- Tracks contributors for quadratic calculation
- Emits `ContributionMade` event

### 3. **distributeMatchingFunds(uint256 _projectId)**
- Admin-only function
- Calculates quadratic matching amount
- Distributes total funds to project creator
- Emits `MatchingFundsDistributed` event

---

## 💡 Additional Helper Functions

- `calculateQuadraticMatch()` - View matching amount for a project
- `getProject()` - Retrieve project details
- `addMatchingPool()` - Admin adds matching funds
- `getUserContribution()` - Check user's contribution to a project

---

## 🎨 Frontend Features

✅ **Wallet Connection** - MetaMask integration with account display
✅ **Real-time Status** - Live contract statistics
✅ **Project Creation** - Simple form to create projects
✅ **Contribution Interface** - Contribute to any active project
✅ **Project Display** - Beautiful cards showing all projects
✅ **Admin Panel** - Manage matching pool (only for admin)
✅ **Toast Notifications** - User-friendly feedback
✅ **Responsive Design** - Works on all devices

---

## 🔧 Technologies Used

- **Solidity** ^0.8.19
- **Ethers.js** v6.7.1
- **HTML5** / **CSS3** / **JavaScript ES6+**
- **MetaMask** for wallet connectivity

---

## ⚠️ Important Notes

1. Replace `CONTRACT_ADDRESS` in `app.js` before using
2. Ensure MetaMask is installed and connected to the correct network
3. Admin address is set as the contract deployer
4. Test on testnet (Sepolia, Goerli) before mainnet deployment

---

## 📞 Support

For issues or questions:
- Check MetaMask connection
- Verify contract address is correct
- Ensure you have enough ETH for gas fees
- Check browser console for detailed errors

---

**Project Complete! All files are ready to use.** 🎉
