// contracts/StakingChallenge.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StakingChallenge is Ownable, ReentrancyGuard {
    IERC20 public usdcToken;
    
    struct Challenge {
        string id;
        uint256 stakeAmount;
        uint256 yieldBps; // Basis points (1/100 of a percent)
        bool isHardcore;
        uint256 durationDays;
        bool isActive;
        address creator;
        uint256 createdAt;
    }
    
    struct Stake {
        string challengeId;
        uint256 amount;
        uint256 timestamp;
        bool isHardcore;
        bool isCompleted;
        bool isFailed;
    }
    
    mapping(string => Challenge) public challenges;
    mapping(address => mapping(string => Stake)) public stakes;
    mapping(address => string[]) public userActiveChallenges;
    
    uint256 public totalStaked;
    uint256 public totalYieldGenerated;
    uint256 public totalChallenges;
    
    // Events
    event ChallengeRegistered(string challengeId, address indexed creator, uint256 stakeAmount, uint256 yieldBps, bool isHardcore);
    event StakeReceived(address indexed staker, string challengeId, uint256 amount, bool isHardcore);
    event ChallengeCompleted(address indexed staker, string challengeId, uint256 reward);
    event ChallengeFailed(address indexed staker, string challengeId);
    
    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @dev Registers a new language learning challenge
     * @param challengeId The unique identifier of the challenge
     * @param stakeAmount The amount required to stake (in USDC cents)
     * @param yieldBps The yield percentage in basis points (e.g., 500 = 5%)
     * @param isHardcore Whether the challenge is hardcore (stake can be lost) or not
     * @param durationDays The duration of the challenge in days
     */
    function registerChallenge(
        string memory challengeId,
        uint256 stakeAmount,
        uint256 yieldBps,
        bool isHardcore,
        uint256 durationDays
    ) external nonReentrant {
        require(bytes(challengeId).length > 0, "Challenge ID cannot be empty");
        require(stakeAmount > 0, "Stake amount must be greater than 0");
        require(durationDays > 0, "Duration must be greater than 0");
        require(yieldBps <= 2000, "Yield cannot exceed 20%"); // Max 20% yield
        
        // Check if challenge already exists
        require(challenges[challengeId].createdAt == 0, "Challenge ID already exists");
        
        // Register the challenge
        challenges[challengeId] = Challenge({
            id: challengeId,
            stakeAmount: stakeAmount,
            yieldBps: yieldBps,
            isHardcore: isHardcore,
            durationDays: durationDays,
            isActive: true,
            creator: msg.sender,
            createdAt: block.timestamp
        });
        
        totalChallenges++;
        
        emit ChallengeRegistered(challengeId, msg.sender, stakeAmount, yieldBps, isHardcore);
    }
    
    /**
     * @dev Allows a user to stake USDC for a language learning challenge
     * @param challengeId The unique identifier of the challenge
     * @param amount The amount of USDC to stake
     * @param isHardcore Whether the challenge is hardcore (stake can be lost) or not
     */
    function stakeForChallenge(string memory challengeId, uint256 amount, bool isHardcore) external nonReentrant {
        require(amount > 0, "Stake amount must be greater than 0");
        require(stakes[msg.sender][challengeId].amount == 0, "Already staked for this challenge");
        
        // Verify challenge exists
        Challenge memory challenge = challenges[challengeId];
        require(challenge.createdAt > 0, "Challenge does not exist");
        require(challenge.isActive, "Challenge is not active");
        
        // Verify stake amount matches challenge requirement if challenge is registered
        if (challenge.stakeAmount > 0) {
            require(amount == challenge.stakeAmount, "Stake amount must match challenge requirement");
            require(isHardcore == challenge.isHardcore, "Hardcore flag must match challenge setting");
        }
        
        // Transfer USDC from user to contract
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        // Create stake record
        stakes[msg.sender][challengeId] = Stake({
            challengeId: challengeId,
            amount: amount,
            timestamp: block.timestamp,
            isHardcore: isHardcore,
            isCompleted: false,
            isFailed: false
        });
        
        // Add to user's active challenges
        userActiveChallenges[msg.sender].push(challengeId);
        
        // Update total staked amount
        totalStaked += amount;
        
        emit StakeReceived(msg.sender, challengeId, amount, isHardcore);
    }
    
    /**
     * @dev Completes a challenge and distributes rewards to the user
     * @param user The address of the user who completed the challenge
     * @param challengeId The unique identifier of the completed challenge
     * @param yieldPercentage The yield percentage earned (in basis points, e.g. 500 = 5%)
     */
    function completeChallenge(address user, string memory challengeId, uint256 yieldPercentage) external onlyOwner nonReentrant {
        Stake storage stake = stakes[user][challengeId];
        
        require(stake.amount > 0, "No stake found for this challenge");
        require(!stake.isCompleted && !stake.isFailed, "Challenge already completed or failed");
        
        // Calculate reward with yield
        uint256 yield = (stake.amount * yieldPercentage) / 10000; // Convert basis points to percentage
        uint256 reward = stake.amount + yield;
        
        // Transfer reward to user
        require(usdcToken.transfer(user, reward), "Reward transfer failed");
        
        // Update stake status
        stake.isCompleted = true;
        
        // Remove from active challenges
        _removeActiveChallenge(user, challengeId);
        
        // Update totals
        totalStaked -= stake.amount;
        totalYieldGenerated += yield;
        
        emit ChallengeCompleted(user, challengeId, reward);
    }
    
    /**
     * @dev Marks a challenge as failed (for hardcore challenges)
     * @param user The address of the user who failed the challenge
     * @param challengeId The unique identifier of the failed challenge
     */
    function failChallenge(address user, string memory challengeId) external onlyOwner nonReentrant {
        Stake storage stake = stakes[user][challengeId];
        
        require(stake.amount > 0, "No stake found for this challenge");
        require(!stake.isCompleted && !stake.isFailed, "Challenge already completed or failed");
        require(stake.isHardcore, "Only hardcore challenges can be failed");
        
        // Update stake status
        stake.isFailed = true;
        
        // Remove from active challenges
        _removeActiveChallenge(user, challengeId);
        
        // For hardcore challenges, the stake is forfeited (stays in contract)
        // No token transfer needed
        
        emit ChallengeFailed(user, challengeId);
    }
    
    /**
     * @dev Allows user to withdraw stake for non-hardcore challenges if they decide to quit
     * @param challengeId The unique identifier of the challenge to withdraw from
     */
    function withdrawFromChallenge(string memory challengeId) external nonReentrant {
        Stake storage stake = stakes[msg.sender][challengeId];
        
        require(stake.amount > 0, "No stake found for this challenge");
        require(!stake.isCompleted && !stake.isFailed, "Challenge already completed or failed");
        require(!stake.isHardcore, "Cannot withdraw from hardcore challenges");
        
        // Transfer stake back to user
        require(usdcToken.transfer(msg.sender, stake.amount), "Stake transfer failed");
        
        // Update stake status
        stake.isFailed = true; // Mark as failed (quit)
        
        // Remove from active challenges
        _removeActiveChallenge(msg.sender, challengeId);
        
        // Update total staked amount
        totalStaked -= stake.amount;
        
        emit ChallengeFailed(msg.sender, challengeId);
    }
    
    /**
     * @dev Allows owner to withdraw yield for protocol fees/operations
     * @param amount The amount of USDC to withdraw
     */
    function withdrawYield(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= usdcToken.balanceOf(address(this)) - totalStaked, "Cannot withdraw staked funds");
        
        require(usdcToken.transfer(owner(), amount), "Yield transfer failed");
    }
    
    /**
     * @dev Deactivates a challenge to prevent new stakes
     * @param challengeId The unique identifier of the challenge
     */
    function deactivateChallenge(string memory challengeId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        
        require(challenge.createdAt > 0, "Challenge does not exist");
        require(msg.sender == challenge.creator || msg.sender == owner(), "Only creator or owner can deactivate");
        
        challenge.isActive = false;
    }
    
    /**
     * @dev Helper function to remove a challenge from user's active challenges
     */
    function _removeActiveChallenge(address user, string memory challengeId) internal {
        string[] storage activeChallenges = userActiveChallenges[user];
        
        for (uint256 i = 0; i < activeChallenges.length; i++) {
            if (keccak256(bytes(activeChallenges[i])) == keccak256(bytes(challengeId))) {
                // Replace with the last element and pop
                activeChallenges[i] = activeChallenges[activeChallenges.length - 1];
                activeChallenges.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Returns the stake details for a given user and challenge
     */
    function getStake(address user, string memory challengeId) external view returns (
        uint256 amount,
        uint256 timestamp,
        bool isHardcore,
        bool isCompleted,
        bool isFailed
    ) {
        Stake memory stake = stakes[user][challengeId];
        return (
            stake.amount,
            stake.timestamp,
            stake.isHardcore,
            stake.isCompleted,
            stake.isFailed
        );
    }
    
    /**
     * @dev Returns all active challenges for a user
     */
    function getUserActiveChallenges(address user) external view returns (string[] memory) {
        return userActiveChallenges[user];
    }
    
    /**
     * @dev Returns challenge details
     */
    function getChallengeDetails(string memory challengeId) external view returns (
        uint256 stakeAmount,
        uint256 yieldBps,
        bool isHardcore,
        uint256 durationDays,
        bool isActive,
        address creator,
        uint256 createdAt
    ) {
        Challenge memory challenge = challenges[challengeId];
        return (
            challenge.stakeAmount,
            challenge.yieldBps,
            challenge.isHardcore,
            challenge.durationDays,
            challenge.isActive,
            challenge.creator,
            challenge.createdAt
        );
    }
}