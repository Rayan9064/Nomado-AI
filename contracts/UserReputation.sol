// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title UserReputation
 * @dev Contract for managing user reputation, ratings, and trust scores
 * @notice This contract tracks user behavior and calculates trust scores based on bookings and reviews
 */
contract UserReputation is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // State variables
    uint256 private _reviewIdCounter;
    
    // Rating scale (1-5 stars)
    uint8 public constant MIN_RATING = 1;
    uint8 public constant MAX_RATING = 5;
    
    // Trust score calculation weights
    uint256 public constant COMPLETED_BOOKING_WEIGHT = 10;
    uint256 public constant CANCELLED_BOOKING_PENALTY = 5;
    uint256 public constant POSITIVE_REVIEW_WEIGHT = 15;
    uint256 public constant NEGATIVE_REVIEW_PENALTY = 10;
    
    // User profile structure
    struct UserProfile {
        uint256 totalBookings;
        uint256 completedBookings;
        uint256 cancelledBookings;
        uint256 totalReviewsReceived;
        uint256 totalRatingPoints;
        uint256 trustScore;
        bool isVerified;
        uint256 joinedAt;
        uint256 lastActivityAt;
    }
    
    // Review structure
    struct Review {
        uint256 id;
        address reviewer;
        address reviewee;
        uint256 bookingId;
        uint8 rating;
        string comment;
        uint256 createdAt;
        bool isVerified; // True if review is from a completed booking
    }
    
    // Mappings
    mapping(address => UserProfile) public userProfiles;
    mapping(uint256 => Review) public reviews;
    mapping(address => uint256[]) public userReviews; // Reviews received by user
    mapping(address => uint256[]) public userGivenReviews; // Reviews given by user
    mapping(bytes32 => bool) public reviewExists; // Hash of (reviewer, reviewee, bookingId)
    
    // Authorized contracts that can update reputation
    mapping(address => bool) public authorizedContracts;
    
    // Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event ReviewSubmitted(
        uint256 indexed reviewId,
        address indexed reviewer,
        address indexed reviewee,
        uint256 bookingId,
        uint8 rating,
        string comment
    );
    event TrustScoreUpdated(address indexed user, uint256 newTrustScore);
    event UserVerified(address indexed user);
    event ContractAuthorized(address indexed contractAddress, bool authorized);
    
    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validRating(uint8 _rating) {
        require(_rating >= MIN_RATING && _rating <= MAX_RATING, "Invalid rating");
        _;
    }
    
    modifier userExists(address _user) {
        require(userProfiles[_user].joinedAt > 0, "User not registered");
        _;
    }
    
    // Initialization
    function initialize(address _owner) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
    }
    
    /**
     * @dev Register a new user profile (internal)
     */
    function _registerUser(address _user) internal {
        userProfiles[_user] = UserProfile({
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            totalReviewsReceived: 0,
            totalRatingPoints: 0,
            trustScore: 100, // Starting trust score
            isVerified: false,
            joinedAt: block.timestamp,
            lastActivityAt: block.timestamp
        });
        
        emit UserRegistered(_user, block.timestamp);
    }

    /**
     * @dev Register a new user profile
     */
    function registerUser() external {
        require(userProfiles[msg.sender].joinedAt == 0, "User already registered");
        _registerUser(msg.sender);
    }
    
    /**
     * @dev Submit a review for another user
     * @param _reviewee Address of the user being reviewed
     * @param _bookingId ID of the related booking
     * @param _rating Rating from 1-5
     * @param _comment Text comment for the review
     */
    function submitReview(
        address _reviewee,
        uint256 _bookingId,
        uint8 _rating,
        string calldata _comment
    ) 
        external 
        validRating(_rating) 
        userExists(_reviewee) 
    {
        require(msg.sender != _reviewee, "Cannot review yourself");
        require(bytes(_comment).length > 0, "Comment required");
        require(bytes(_comment).length <= 500, "Comment too long");
        
        // Ensure user is registered
        if (userProfiles[msg.sender].joinedAt == 0) {
            _registerUser(msg.sender);
        }
        
        // Check if review already exists for this booking
        bytes32 reviewHash = keccak256(abi.encodePacked(msg.sender, _reviewee, _bookingId));
        require(!reviewExists[reviewHash], "Review already submitted for this booking");
        
        _reviewIdCounter++;
        uint256 newReviewId = _reviewIdCounter;
        
        reviews[newReviewId] = Review({
            id: newReviewId,
            reviewer: msg.sender,
            reviewee: _reviewee,
            bookingId: _bookingId,
            rating: _rating,
            comment: _comment,
            createdAt: block.timestamp,
            isVerified: false // Will be set to true if verified by booking contract
        });
        
        userReviews[_reviewee].push(newReviewId);
        userGivenReviews[msg.sender].push(newReviewId);
        reviewExists[reviewHash] = true;
        
        // Update reviewee's profile
        userProfiles[_reviewee].totalReviewsReceived++;
        userProfiles[_reviewee].totalRatingPoints += _rating;
        userProfiles[_reviewee].lastActivityAt = block.timestamp;
        
        // Update reviewer's activity
        userProfiles[msg.sender].lastActivityAt = block.timestamp;
        
        // Calculate new trust score for reviewee
        _updateTrustScore(_reviewee);
        
        emit ReviewSubmitted(newReviewId, msg.sender, _reviewee, _bookingId, _rating, _comment);
    }
    
    /**
     * @dev Update booking statistics (called by BookingManager contract)
     * @param _user Address of the user
     * @param _isCompleted Whether the booking was completed
     * @param _isCancelled Whether the booking was cancelled
     */
    function updateBookingStats(
        address _user,
        bool _isCompleted,
        bool _isCancelled
    ) 
        external 
        onlyAuthorized 
    {
        // Auto-register user if not exists
        if (userProfiles[_user].joinedAt == 0) {
            _registerUser(_user);
        }
        
        userProfiles[_user].totalBookings++;
        userProfiles[_user].lastActivityAt = block.timestamp;
        
        if (_isCompleted) {
            userProfiles[_user].completedBookings++;
        }
        
        if (_isCancelled) {
            userProfiles[_user].cancelledBookings++;
        }
        
        _updateTrustScore(_user);
    }
    
    /**
     * @dev Verify a review (called by BookingManager contract)
     * @param _reviewId ID of the review to verify
     */
    function verifyReview(uint256 _reviewId) external onlyAuthorized {
        require(reviews[_reviewId].id != 0, "Review does not exist");
        reviews[_reviewId].isVerified = true;
        
        // Recalculate trust score with verified review
        _updateTrustScore(reviews[_reviewId].reviewee);
    }
    
    /**
     * @dev Verify a user (KYC or other verification process)
     * @param _user Address of the user to verify
     */
    function verifyUser(address _user) external onlyOwner userExists(_user) {
        userProfiles[_user].isVerified = true;
        
        // Boost trust score for verified users
        userProfiles[_user].trustScore += 50;
        if (userProfiles[_user].trustScore > 1000) {
            userProfiles[_user].trustScore = 1000;
        }
        
        emit UserVerified(_user);
        emit TrustScoreUpdated(_user, userProfiles[_user].trustScore);
    }
    
    /**
     * @dev Calculate and update trust score for a user
     * @param _user Address of the user
     */
    function _updateTrustScore(address _user) internal {
        UserProfile storage profile = userProfiles[_user];
        
        uint256 baseScore = 100;
        uint256 bonusPoints = 0;
        uint256 penaltyPoints = 0;
        
        // Add points for completed bookings
        bonusPoints += profile.completedBookings * COMPLETED_BOOKING_WEIGHT;
        
        // Subtract points for cancelled bookings
        penaltyPoints += profile.cancelledBookings * CANCELLED_BOOKING_PENALTY;
        
        // Add points for positive reviews (4-5 stars)
        if (profile.totalReviewsReceived > 0) {
            uint256 averageRating = profile.totalRatingPoints / profile.totalReviewsReceived;
            if (averageRating >= 4) {
                bonusPoints += profile.totalReviewsReceived * POSITIVE_REVIEW_WEIGHT;
            } else if (averageRating <= 2) {
                penaltyPoints += profile.totalReviewsReceived * NEGATIVE_REVIEW_PENALTY;
            }
        }
        
        // Calculate final score
        uint256 newTrustScore = baseScore;
        if (bonusPoints > penaltyPoints) {
            newTrustScore += (bonusPoints - penaltyPoints);
        } else if (penaltyPoints > bonusPoints) {
            uint256 netPenalty = penaltyPoints - bonusPoints;
            if (netPenalty >= baseScore) {
                newTrustScore = 1; // Minimum trust score
            } else {
                newTrustScore = baseScore - netPenalty;
            }
        }
        
        // Cap the trust score at 1000
        if (newTrustScore > 1000) {
            newTrustScore = 1000;
        }
        
        profile.trustScore = newTrustScore;
        emit TrustScoreUpdated(_user, newTrustScore);
    }
    
    /**
     * @dev Get user profile information
     * @param _user Address of the user
     */
    function getUserProfile(address _user) 
        external 
        view 
        returns (UserProfile memory) 
    {
        return userProfiles[_user];
    }
    
    /**
     * @dev Get user's average rating
     * @param _user Address of the user
     */
    function getUserAverageRating(address _user) 
        external 
        view 
        returns (uint256) 
    {
        UserProfile memory profile = userProfiles[_user];
        if (profile.totalReviewsReceived == 0) {
            return 0;
        }
        return (profile.totalRatingPoints * 100) / profile.totalReviewsReceived; // Returns rating * 100 for precision
    }
    
    /**
     * @dev Get reviews for a user
     * @param _user Address of the user
     */
    function getUserReviews(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userReviews[_user];
    }
    
    /**
     * @dev Get reviews given by a user
     * @param _user Address of the user
     */
    function getUserGivenReviews(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userGivenReviews[_user];
    }
    
    /**
     * @dev Get review details
     * @param _reviewId ID of the review
     */
    function getReview(uint256 _reviewId) 
        external 
        view 
        returns (Review memory) 
    {
        require(reviews[_reviewId].id != 0, "Review does not exist");
        return reviews[_reviewId];
    }
    
    /**
     * @dev Get total number of reviews
     */
    function getTotalReviews() external view returns (uint256) {
        return _reviewIdCounter;
    }
    
    /**
     * @dev Authorize/unauthorize a contract to update reputation
     * @param _contract Address of the contract
     * @param _authorized Whether to authorize or unauthorize
     */
    function setContractAuthorization(address _contract, bool _authorized) 
        external 
        onlyOwner 
    {
        require(_contract != address(0), "Invalid contract address");
        authorizedContracts[_contract] = _authorized;
        emit ContractAuthorized(_contract, _authorized);
    }
    
    /**
     * @dev Check if a user is in good standing (trust score above threshold)
     * @param _user Address of the user
     * @param _threshold Minimum trust score threshold
     */
    function isUserInGoodStanding(address _user, uint256 _threshold) 
        external 
        view 
        returns (bool) 
    {
        return userProfiles[_user].trustScore >= _threshold;
    }
}
