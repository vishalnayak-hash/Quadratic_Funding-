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
