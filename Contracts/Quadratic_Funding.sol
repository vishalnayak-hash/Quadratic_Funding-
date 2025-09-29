
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
