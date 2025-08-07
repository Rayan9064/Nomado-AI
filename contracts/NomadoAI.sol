// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./BookingManager.sol";
import "./UserReputation.sol";
import "./PaymentTracker.sol";
import "./RewardSystem.sol";

/**
 * @title NomadoAI
 * @dev Main contract that orchestrates all platform functionality
 * @notice This contract serves as the main entry point for the Nomado AI platform
 */
contract NomadoAI is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Contract references
    BookingManager public bookingManager;
    UserReputation public userReputation;
    PaymentTracker public paymentTracker;
    RewardSystem public rewardSystem;
    
    // Platform configuration
    struct PlatformConfig {
        uint256 platformFeePercent;
        address feeRecipient;
        uint256 escrowPeriod;
        uint256 disputePeriod;
        uint256 baseRewardRate;
        uint256 bookingRewardPercent;
        bool isPaused;
    }
    
    PlatformConfig public config;
    
    // Events
    event ContractsInitialized(
        address bookingManager,
        address userReputation,
        address paymentTracker,
        address rewardSystem
    );
    
    event BookingCreatedWithIntegration(
        uint256 indexed bookingId,
        uint256 indexed paymentId,
        address indexed customer,
        uint256 amount
    );
    
    event BookingCompletedWithRewards(
        uint256 indexed bookingId,
        address indexed customer,
        uint256 rewardAmount
    );
    
    event PlatformConfigUpdated(
        uint256 platformFeePercent,
        uint256 escrowPeriod,
        uint256 disputePeriod
    );
    
    // Modifiers
    modifier whenNotPaused() {
        require(!config.isPaused, "Platform is paused");
        _;
    }
    
    modifier validBookingAmount() {
        require(msg.value > 0, "Booking amount must be greater than 0");
        _;
    }
    
    // Initialization
    function initialize(
        address _owner,
        address _feeRecipient,
        uint256 _platformFeePercent,
        uint256 _escrowPeriod,
        uint256 _disputePeriod,
        uint256 _baseRewardRate,
        uint256 _bookingRewardPercent
    ) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_platformFeePercent <= 1000, "Fee too high"); // Max 10%
        require(_escrowPeriod > 0, "Invalid escrow period");
        require(_disputePeriod > 0, "Invalid dispute period");
        require(_baseRewardRate > 0, "Invalid base reward rate");
        require(_bookingRewardPercent <= 1000, "Booking reward too high");
        
        config = PlatformConfig({
            platformFeePercent: _platformFeePercent,
            feeRecipient: _feeRecipient,
            escrowPeriod: _escrowPeriod,
            disputePeriod: _disputePeriod,
            baseRewardRate: _baseRewardRate,
            bookingRewardPercent: _bookingRewardPercent,
            isPaused: false
        });
    }
    
    /**
     * @dev Initialize all platform contracts
     * @param _bookingManager Address of BookingManager contract
     * @param _userReputation Address of UserReputation contract
     * @param _paymentTracker Address of PaymentTracker contract
     * @param _rewardSystem Address of RewardSystem contract
     */
    function initializeContracts(
        address _bookingManager,
        address _userReputation,
        address _paymentTracker,
        address _rewardSystem
    ) external onlyOwner {
        require(_bookingManager != address(0), "Invalid BookingManager address");
        require(_userReputation != address(0), "Invalid UserReputation address");
        require(_paymentTracker != address(0), "Invalid PaymentTracker address");
        require(_rewardSystem != address(0), "Invalid RewardSystem address");
        
        bookingManager = BookingManager(_bookingManager);
        userReputation = UserReputation(_userReputation);
        paymentTracker = PaymentTracker(_paymentTracker);
        rewardSystem = RewardSystem(_rewardSystem);
        
        // Set cross-contract authorizations
        userReputation.setContractAuthorization(address(this), true);
        paymentTracker.setContractAuthorization(address(this), true);
        rewardSystem.setContractAuthorization(address(this), true);
        
        emit ContractsInitialized(_bookingManager, _userReputation, _paymentTracker, _rewardSystem);
    }
    
    /**
     * @dev Create a booking with integrated payment and reputation tracking
     * @param _bookingType Type of booking
     * @param _serviceDate Date when the service will be provided
     * @param _metadataHash IPFS hash containing booking details
     * @param _isRefundable Whether the booking can be refunded
     * @param _refundDeadline Deadline for refund requests
     * @param _payee Service provider address
     */
    function createBookingWithPayment(
        BookingManager.BookingType _bookingType,
        uint256 _serviceDate,
        string calldata _metadataHash,
        bool _isRefundable,
        uint256 _refundDeadline,
        address _payee
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validBookingAmount 
    {
        require(_payee != address(0), "Invalid payee address");
        require(_payee != msg.sender, "Cannot book for yourself");
        
        // Create booking
        uint256 bookingId = bookingManager.getTotalBookings() + 1;
        bookingManager.createBooking{value: msg.value}(
            _bookingType,
            _serviceDate,
            _metadataHash,
            _isRefundable,
            _refundDeadline
        );
        
        // Create payment
        uint256 platformFee = (msg.value * config.platformFeePercent) / 10000;
        string memory paymentHash = string(abi.encodePacked("NOMADO-", bookingId));
        
        paymentTracker.createPayment{value: msg.value}(
            bookingId,
            _payee,
            platformFee,
            _isRefundable,
            _refundDeadline,
            paymentHash
        );
        
        uint256 paymentId = paymentTracker.getTotalPayments();
        
        // Update user reputation stats
        userReputation.updateBookingStats(msg.sender, false, false);
        
        emit BookingCreatedWithIntegration(bookingId, paymentId, msg.sender, msg.value);
    }
    
    /**
     * @dev Confirm a booking and move payment to escrow
     * @param _bookingId ID of the booking to confirm
     */
    function confirmBooking(uint256 _bookingId) external onlyOwner {
        // Confirm booking
        bookingManager.confirmBooking(_bookingId);
        
        // Move payment to escrow
        paymentTracker.escrowPayment(_bookingId);
    }
    
    /**
     * @dev Complete a booking and distribute rewards
     * @param _bookingId ID of the booking to complete
     */
    function completeBooking(uint256 _bookingId) 
        external 
        onlyOwner 
        nonReentrant 
    {
        // Get booking details
        BookingManager.Booking memory booking = bookingManager.getBooking(_bookingId);
        
        // Complete booking
        bookingManager.completeBooking(_bookingId);
        
        // Release payment
        paymentTracker.releasePayment(_bookingId);
        
        // Update reputation stats
        userReputation.updateBookingStats(booking.customer, true, false);
        
        // Award booking rewards
        rewardSystem.awardBookingReward(booking.customer, booking.amount);
        
        emit BookingCompletedWithRewards(_bookingId, booking.customer, booking.amount);
    }
    
    /**
     * @dev Cancel a booking with integrated refund and reputation update
     * @param _bookingId ID of the booking to cancel
     */
    function cancelBooking(uint256 _bookingId) 
        external 
        nonReentrant 
    {
        // Get booking details before cancellation
        BookingManager.Booking memory booking = bookingManager.getBooking(_bookingId);
        require(booking.customer == msg.sender, "Not the booking customer");
        
        // Cancel booking (handles refund logic)
        bookingManager.cancelBooking(_bookingId);
        
        // Update reputation stats
        userReputation.updateBookingStats(msg.sender, false, true);
        
        // Handle payment refund if applicable
        if (booking.isRefundable && block.timestamp <= booking.refundDeadline) {
            paymentTracker.refundPayment(_bookingId);
        }
    }
    
    /**
     * @dev Submit a review and verify it if the booking is completed
     * @param _reviewee Address of the user being reviewed
     * @param _bookingId ID of the related booking
     * @param _rating Rating from 1-5
     * @param _comment Text comment for the review
     */
    function submitVerifiedReview(
        address _reviewee,
        uint256 _bookingId,
        uint8 _rating,
        string calldata _comment
    ) external {
        // Submit review
        userReputation.submitReview(_reviewee, _bookingId, _rating, _comment);
        
        // Get booking details to check if it's completed
        BookingManager.Booking memory booking = bookingManager.getBooking(_bookingId);
        
        // Verify review if booking is completed and reviewer is the customer
        if (booking.status == BookingManager.BookingStatus.COMPLETED && 
            booking.customer == msg.sender) {
            uint256 reviewId = userReputation.getTotalReviews();
            userReputation.verifyReview(reviewId);
        }
    }
    
    /**
     * @dev Get comprehensive user stats
     * @param _user Address of the user
     */
    function getUserStats(address _user) 
        external 
        view 
        returns (
            UserReputation.UserProfile memory profile,
            RewardSystem.RewardProfile memory rewards,
            uint256[] memory bookings,
            uint256[] memory payments,
            uint256[] memory stakes
        ) 
    {
        profile = userReputation.getUserProfile(_user);
        rewards = rewardSystem.getUserRewardProfile(_user);
        bookings = bookingManager.getUserBookings(_user);
        payments = paymentTracker.getUserPayments(_user);
        stakes = rewardSystem.getUserStakes(_user);
    }
    
    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() 
        external 
        view 
        returns (
            uint256 totalBookings,
            uint256 totalPayments,
            uint256 totalReviews,
            uint256 totalUsers
        ) 
    {
        totalBookings = bookingManager.getTotalBookings();
        totalPayments = paymentTracker.getTotalPayments();
        totalReviews = userReputation.getTotalReviews();
        // Note: totalUsers would need to be tracked separately or calculated
    }
    
    /**
     * @dev Update platform configuration
     * @param _platformFeePercent New platform fee percentage
     * @param _escrowPeriod New escrow period
     * @param _disputePeriod New dispute period
     */
    function updatePlatformConfig(
        uint256 _platformFeePercent,
        uint256 _escrowPeriod,
        uint256 _disputePeriod
    ) external onlyOwner {
        require(_platformFeePercent <= 1000, "Fee too high");
        require(_escrowPeriod > 0, "Invalid escrow period");
        require(_disputePeriod > 0, "Invalid dispute period");
        
        config.platformFeePercent = _platformFeePercent;
        config.escrowPeriod = _escrowPeriod;
        config.disputePeriod = _disputePeriod;
        
        // Update individual contracts
        bookingManager.updatePlatformFee(_platformFeePercent);
        paymentTracker.updateEscrowPeriod(_escrowPeriod);
        paymentTracker.updateDisputePeriod(_disputePeriod);
        
        emit PlatformConfigUpdated(_platformFeePercent, _escrowPeriod, _disputePeriod);
    }
    
    /**
     * @dev Pause/unpause the platform
     * @param _paused Pause status
     */
    function setPlatformPause(bool _paused) external onlyOwner {
        config.isPaused = _paused;
        
        if (_paused) {
            bookingManager.pause();
            paymentTracker.pause();
            rewardSystem.pause();
        } else {
            bookingManager.unpause();
            paymentTracker.unpause();
            rewardSystem.unpause();
        }
    }
    
    /**
     * @dev Verify a user across all contracts
     * @param _user Address of the user to verify
     */
    function verifyUser(address _user) external onlyOwner {
        userReputation.verifyUser(_user);
        
        // Give verified users a reward multiplier bonus
        rewardSystem.setMultiplierBonus(_user, 1000); // 10% bonus
    }
    
    /**
     * @dev Emergency function to pause all contracts
     */
    function emergencyPause() external onlyOwner {
        config.isPaused = true;
        bookingManager.pause();
        paymentTracker.pause();
        rewardSystem.pause();
    }
    
    /**
     * @dev Get platform configuration
     */
    function getPlatformConfig() external view returns (PlatformConfig memory) {
        return config;
    }
    
    /**
     * @dev Check if user meets minimum trust requirements for booking
     * @param _user Address of the user
     */
    function canUserBook(address _user) external view returns (bool) {
        return userReputation.isUserInGoodStanding(_user, 50); // Minimum trust score of 50
    }
    
    /**
     * @dev Get booking with all related information
     * @param _bookingId ID of the booking
     */
    function getBookingDetails(uint256 _bookingId) 
        external 
        view 
        returns (
            BookingManager.Booking memory booking,
            PaymentTracker.Payment memory payment,
            PaymentTracker.Escrow memory escrow,
            PaymentTracker.Dispute memory dispute
        ) 
    {
        booking = bookingManager.getBooking(_bookingId);
        payment = paymentTracker.getPayment(_bookingId);
        escrow = paymentTracker.getEscrow(_bookingId);
        dispute = paymentTracker.getDispute(_bookingId);
    }
}
