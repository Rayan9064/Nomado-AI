// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title RewardSystem
 * @dev Contract for managing rewards, staking, and loyalty programs for frequent users
 * @notice This contract provides incentives for active platform users
 */
contract RewardSystem is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // State variables
    uint256 private _stakeIdCounter;
    
    // Reward tiers
    enum RewardTier { BRONZE, SILVER, GOLD, PLATINUM, DIAMOND }
    
    // Stake structure
    struct Stake {
        uint256 id;
        address staker;
        uint256 amount;
        uint256 stakedAt;
        uint256 lockPeriod;
        uint256 unlockTime;
        uint256 rewardRate; // APY in basis points
        uint256 rewardsAccrued;
        uint256 lastRewardUpdate;
        bool isWithdrawn;
    }
    
    // User reward profile
    struct RewardProfile {
        RewardTier tier;
        uint256 totalBookings;
        uint256 totalSpent;
        uint256 totalRewardsEarned;
        uint256 totalStaked;
        uint256 multiplierBonus; // Percentage bonus in basis points
        uint256 lastActivityAt;
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => Stake) public stakes;
    mapping(address => RewardProfile) public rewardProfiles;
    mapping(address => uint256[]) public userStakes;
    mapping(RewardTier => uint256) public tierRequirements; // Total spent required for tier
    mapping(RewardTier => uint256) public tierBonusRates; // Bonus rates for each tier
    
    // Reward configuration
    uint256 public baseRewardRate; // Base APY in basis points
    uint256 public bookingRewardPercent; // Percent of booking amount as reward
    uint256 public minimumStakeAmount;
    uint256 public maximumStakeAmount;
    uint256[] public lockPeriods; // Available lock periods in seconds
    uint256[] public lockBonusRates; // Bonus rates for each lock period
    
    // Platform integration
    mapping(address => bool) public authorizedContracts;
    address public rewardPool; // Address holding reward funds
    
    // Events
    event RewardEarned(
        address indexed user,
        uint256 amount,
        string reason,
        uint256 timestamp
    );
    
    event Staked(
        uint256 indexed stakeId,
        address indexed staker,
        uint256 amount,
        uint256 lockPeriod,
        uint256 unlockTime
    );
    
    event StakeWithdrawn(
        uint256 indexed stakeId,
        address indexed staker,
        uint256 principal,
        uint256 rewards
    );
    
    event RewardsClaimed(
        address indexed user,
        uint256 amount
    );
    
    event TierUpgraded(
        address indexed user,
        RewardTier oldTier,
        RewardTier newTier
    );
    
    event MultiplierBonusUpdated(
        address indexed user,
        uint256 newBonus
    );
    
    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier stakeExists(uint256 _stakeId) {
        require(stakes[_stakeId].id != 0, "Stake does not exist");
        _;
    }
    
    modifier validLockPeriod(uint256 _lockPeriod) {
        bool isValid = false;
        for (uint i = 0; i < lockPeriods.length; i++) {
            if (lockPeriods[i] == _lockPeriod) {
                isValid = true;
                break;
            }
        }
        require(isValid, "Invalid lock period");
        _;
    }
    
    // Initialization
    function initialize(
        address _owner,
        address _rewardPool,
        uint256 _baseRewardRate,
        uint256 _bookingRewardPercent,
        uint256 _minimumStakeAmount
    ) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        
        require(_rewardPool != address(0), "Invalid reward pool");
        require(_baseRewardRate > 0, "Invalid base reward rate");
        require(_bookingRewardPercent <= 1000, "Booking reward too high"); // Max 10%
        require(_minimumStakeAmount > 0, "Invalid minimum stake");
        
        rewardPool = _rewardPool;
        baseRewardRate = _baseRewardRate;
        bookingRewardPercent = _bookingRewardPercent;
        minimumStakeAmount = _minimumStakeAmount;
        maximumStakeAmount = 1000 ether; // Default max stake
        
        // Initialize tier requirements (in wei)
        tierRequirements[RewardTier.BRONZE] = 0;
        tierRequirements[RewardTier.SILVER] = 1 ether;
        tierRequirements[RewardTier.GOLD] = 5 ether;
        tierRequirements[RewardTier.PLATINUM] = 20 ether;
        tierRequirements[RewardTier.DIAMOND] = 100 ether;
        
        // Initialize tier bonus rates (in basis points)
        tierBonusRates[RewardTier.BRONZE] = 0;
        tierBonusRates[RewardTier.SILVER] = 500; // 5%
        tierBonusRates[RewardTier.GOLD] = 1000; // 10%
        tierBonusRates[RewardTier.PLATINUM] = 1500; // 15%
        tierBonusRates[RewardTier.DIAMOND] = 2000; // 20%
        
        // Initialize lock periods (30 days, 90 days, 180 days, 365 days)
        lockPeriods = [30 days, 90 days, 180 days, 365 days];
        lockBonusRates = [0, 500, 1000, 2000]; // 0%, 5%, 10%, 20% bonus
    }
    
    /**
     * @dev Award booking rewards to a user
     * @param _user Address of the user
     * @param _bookingAmount Amount of the booking
     */
    function awardBookingReward(address _user, uint256 _bookingAmount) 
        external 
        onlyAuthorized 
    {
        // Initialize user profile if needed
        if (!rewardProfiles[_user].isActive) {
            _initializeUserProfile(_user);
        }
        
        RewardProfile storage profile = rewardProfiles[_user];
        
        // Calculate base reward
        uint256 baseReward = (_bookingAmount * bookingRewardPercent) / 10000;
        
        // Apply tier bonus
        uint256 tierBonus = (baseReward * tierBonusRates[profile.tier]) / 10000;
        
        // Apply multiplier bonus
        uint256 multiplierBonus = (baseReward * profile.multiplierBonus) / 10000;
        
        uint256 totalReward = baseReward + tierBonus + multiplierBonus;
        
        // Update user profile
        profile.totalBookings++;
        profile.totalSpent += _bookingAmount;
        profile.totalRewardsEarned += totalReward;
        profile.lastActivityAt = block.timestamp;
        
        // Check for tier upgrade
        _checkTierUpgrade(_user);
        
        // Transfer reward (this would integrate with a token contract in production)
        emit RewardEarned(_user, totalReward, "Booking reward", block.timestamp);
    }
    
    /**
     * @dev Stake tokens for rewards
     * @param _lockPeriod Lock period for the stake
     */
    function stake(uint256 _lockPeriod) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validLockPeriod(_lockPeriod) 
    {
        require(msg.value >= minimumStakeAmount, "Stake amount too low");
        require(msg.value <= maximumStakeAmount, "Stake amount too high");
        
        // Initialize user profile if needed
        if (!rewardProfiles[msg.sender].isActive) {
            _initializeUserProfile(msg.sender);
        }
        
        _stakeIdCounter++;
        uint256 newStakeId = _stakeIdCounter;
        
        uint256 unlockTime = block.timestamp + _lockPeriod;
        
        // Calculate reward rate with bonuses
        uint256 lockBonusIndex = _getLockBonusIndex(_lockPeriod);
        uint256 lockBonus = lockBonusRates[lockBonusIndex];
        uint256 tierBonus = tierBonusRates[rewardProfiles[msg.sender].tier];
        uint256 totalRewardRate = baseRewardRate + lockBonus + tierBonus;
        
        stakes[newStakeId] = Stake({
            id: newStakeId,
            staker: msg.sender,
            amount: msg.value,
            stakedAt: block.timestamp,
            lockPeriod: _lockPeriod,
            unlockTime: unlockTime,
            rewardRate: totalRewardRate,
            rewardsAccrued: 0,
            lastRewardUpdate: block.timestamp,
            isWithdrawn: false
        });
        
        userStakes[msg.sender].push(newStakeId);
        rewardProfiles[msg.sender].totalStaked += msg.value;
        
        emit Staked(newStakeId, msg.sender, msg.value, _lockPeriod, unlockTime);
    }
    
    /**
     * @dev Withdraw stake and rewards
     * @param _stakeId ID of the stake to withdraw
     */
    function withdrawStake(uint256 _stakeId) 
        external 
        nonReentrant 
        stakeExists(_stakeId) 
    {
        Stake storage stakeInfo = stakes[_stakeId];
        require(stakeInfo.staker == msg.sender, "Not the staker");
        require(!stakeInfo.isWithdrawn, "Stake already withdrawn");
        require(block.timestamp >= stakeInfo.unlockTime, "Stake still locked");
        
        // Update rewards before withdrawal
        _updateStakeRewards(_stakeId);
        
        uint256 principal = stakeInfo.amount;
        uint256 rewards = stakeInfo.rewardsAccrued;
        
        stakeInfo.isWithdrawn = true;
        rewardProfiles[msg.sender].totalStaked -= principal;
        rewardProfiles[msg.sender].totalRewardsEarned += rewards;
        
        // Transfer principal back to staker
        (bool principalSuccess, ) = msg.sender.call{value: principal}("");
        require(principalSuccess, "Principal transfer failed");
        
        // Transfer rewards from reward pool (in production, this would be handled differently)
        emit StakeWithdrawn(_stakeId, msg.sender, principal, rewards);
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Update rewards for a stake
     * @param _stakeId ID of the stake
     */
    function updateStakeRewards(uint256 _stakeId) 
        external 
        stakeExists(_stakeId) 
    {
        _updateStakeRewards(_stakeId);
    }
    
    /**
     * @dev Internal function to update stake rewards
     * @param _stakeId ID of the stake
     */
    function _updateStakeRewards(uint256 _stakeId) internal {
        Stake storage stakeInfo = stakes[_stakeId];
        
        if (stakeInfo.isWithdrawn) {
            return;
        }
        
        uint256 timeElapsed = block.timestamp - stakeInfo.lastRewardUpdate;
        if (timeElapsed == 0) {
            return;
        }
        
        // Calculate rewards: (principal * rate * time) / (365 days * 10000)
        uint256 newRewards = (stakeInfo.amount * stakeInfo.rewardRate * timeElapsed) / (365 days * 10000);
        
        stakeInfo.rewardsAccrued += newRewards;
        stakeInfo.lastRewardUpdate = block.timestamp;
    }
    
    /**
     * @dev Initialize user profile
     * @param _user Address of the user
     */
    function _initializeUserProfile(address _user) internal {
        rewardProfiles[_user] = RewardProfile({
            tier: RewardTier.BRONZE,
            totalBookings: 0,
            totalSpent: 0,
            totalRewardsEarned: 0,
            totalStaked: 0,
            multiplierBonus: 0,
            lastActivityAt: block.timestamp,
            isActive: true
        });
    }
    
    /**
     * @dev Check and upgrade user tier
     * @param _user Address of the user
     */
    function _checkTierUpgrade(address _user) internal {
        RewardProfile storage profile = rewardProfiles[_user];
        RewardTier oldTier = profile.tier;
        RewardTier newTier = oldTier;
        
        // Check tier upgrades
        if (profile.totalSpent >= tierRequirements[RewardTier.DIAMOND]) {
            newTier = RewardTier.DIAMOND;
        } else if (profile.totalSpent >= tierRequirements[RewardTier.PLATINUM]) {
            newTier = RewardTier.PLATINUM;
        } else if (profile.totalSpent >= tierRequirements[RewardTier.GOLD]) {
            newTier = RewardTier.GOLD;
        } else if (profile.totalSpent >= tierRequirements[RewardTier.SILVER]) {
            newTier = RewardTier.SILVER;
        }
        
        if (newTier != oldTier) {
            profile.tier = newTier;
            emit TierUpgraded(_user, oldTier, newTier);
        }
    }
    
    /**
     * @dev Get lock bonus index for a given lock period
     * @param _lockPeriod Lock period in seconds
     */
    function _getLockBonusIndex(uint256 _lockPeriod) internal view returns (uint256) {
        for (uint i = 0; i < lockPeriods.length; i++) {
            if (lockPeriods[i] == _lockPeriod) {
                return i;
            }
        }
        return 0; // Should not reach here due to modifier
    }
    
    /**
     * @dev Get user's reward profile
     * @param _user Address of the user
     */
    function getUserRewardProfile(address _user) 
        external 
        view 
        returns (RewardProfile memory) 
    {
        return rewardProfiles[_user];
    }
    
    /**
     * @dev Get user's stakes
     * @param _user Address of the user
     */
    function getUserStakes(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userStakes[_user];
    }
    
    /**
     * @dev Get stake details with current rewards
     * @param _stakeId ID of the stake
     */
    function getStakeWithCurrentRewards(uint256 _stakeId) 
        external 
        view 
        stakeExists(_stakeId) 
        returns (Stake memory, uint256) 
    {
        Stake memory stakeInfo = stakes[_stakeId];
        
        if (stakeInfo.isWithdrawn) {
            return (stakeInfo, stakeInfo.rewardsAccrued);
        }
        
        uint256 timeElapsed = block.timestamp - stakeInfo.lastRewardUpdate;
        uint256 newRewards = (stakeInfo.amount * stakeInfo.rewardRate * timeElapsed) / (365 days * 10000);
        uint256 totalRewards = stakeInfo.rewardsAccrued + newRewards;
        
        return (stakeInfo, totalRewards);
    }
    
    /**
     * @dev Get available lock periods
     */
    function getLockPeriods() external view returns (uint256[] memory, uint256[] memory) {
        return (lockPeriods, lockBonusRates);
    }
    
    /**
     * @dev Set multiplier bonus for a user (admin function)
     * @param _user Address of the user
     * @param _bonusPercent Bonus percentage in basis points
     */
    function setMultiplierBonus(address _user, uint256 _bonusPercent) 
        external 
        onlyOwner 
    {
        require(_bonusPercent <= 5000, "Bonus too high"); // Max 50%
        
        if (!rewardProfiles[_user].isActive) {
            _initializeUserProfile(_user);
        }
        
        rewardProfiles[_user].multiplierBonus = _bonusPercent;
        emit MultiplierBonusUpdated(_user, _bonusPercent);
    }
    
    /**
     * @dev Update tier requirements
     * @param _tier Reward tier
     * @param _requirement New requirement amount
     */
    function updateTierRequirement(RewardTier _tier, uint256 _requirement) 
        external 
        onlyOwner 
    {
        tierRequirements[_tier] = _requirement;
    }
    
    /**
     * @dev Update tier bonus rates
     * @param _tier Reward tier
     * @param _bonusRate New bonus rate in basis points
     */
    function updateTierBonusRate(RewardTier _tier, uint256 _bonusRate) 
        external 
        onlyOwner 
    {
        require(_bonusRate <= 5000, "Bonus rate too high"); // Max 50%
        tierBonusRates[_tier] = _bonusRate;
    }
    
    /**
     * @dev Update base reward rate
     * @param _newRate New base reward rate in basis points
     */
    function updateBaseRewardRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0 && _newRate <= 10000, "Invalid reward rate");
        baseRewardRate = _newRate;
    }
    
    /**
     * @dev Update booking reward percentage
     * @param _newPercent New booking reward percentage in basis points
     */
    function updateBookingRewardPercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= 1000, "Reward percentage too high"); // Max 10%
        bookingRewardPercent = _newPercent;
    }
    
    /**
     * @dev Set contract authorization
     * @param _contract Address of the contract
     * @param _authorized Authorization status
     */
    function setContractAuthorization(address _contract, bool _authorized) 
        external 
        onlyOwner 
    {
        require(_contract != address(0), "Invalid contract address");
        authorizedContracts[_contract] = _authorized;
    }
    
    /**
     * @dev Update reward pool address
     * @param _newPool New reward pool address
     */
    function updateRewardPool(address _newPool) external onlyOwner {
        require(_newPool != address(0), "Invalid pool address");
        rewardPool = _newPool;
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    // Receive function to accept ETH for staking
    receive() external payable {}
    
    /**
     * @dev Required by UUPSUpgradeable - only owner can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
