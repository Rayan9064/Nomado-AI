// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title BookingManager
 * @dev Core contract for managing travel bookings (flights, hotels, co-working spaces)
 * @notice This contract handles booking creation, confirmation, and cancellation
 */
contract BookingManager is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    // State variables
    uint256 private _bookingIdCounter;
    
    // Booking types
    enum BookingType { FLIGHT, HOTEL, COWORKING, OTHER }
    
    // Booking status
    enum BookingStatus { PENDING, CONFIRMED, CANCELLED, COMPLETED, REFUNDED }
    
    // Booking structure
    struct Booking {
        uint256 id;
        address customer;
        BookingType bookingType;
        BookingStatus status;
        uint256 amount;
        uint256 createdAt;
        uint256 confirmedAt;
        uint256 serviceDate;
        string metadataHash; // IPFS hash for additional booking details
        bool isRefundable;
        uint256 refundDeadline;
    }
    
    // Mappings
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public userBookings;
    mapping(BookingType => uint256) public typeBookingCounts;
    
    // Platform fee configuration
    uint256 public platformFeePercent; // in basis points (100 = 1%)
    address public feeRecipient;
    
    // Events
    event BookingCreated(
        uint256 indexed bookingId,
        address indexed customer,
        BookingType bookingType,
        uint256 amount,
        uint256 serviceDate,
        string metadataHash
    );
    
    event BookingConfirmed(
        uint256 indexed bookingId,
        address indexed customer,
        uint256 confirmedAt
    );
    
    event BookingCancelled(
        uint256 indexed bookingId,
        address indexed customer,
        uint256 cancelledAt,
        bool refundIssued
    );
    
    event BookingCompleted(
        uint256 indexed bookingId,
        address indexed customer,
        uint256 completedAt
    );
    
    event RefundIssued(
        uint256 indexed bookingId,
        address indexed customer,
        uint256 refundAmount
    );
    
    event PlatformFeeUpdated(uint256 newFeePercent);
    event FeeRecipientUpdated(address newFeeRecipient);
    
    // Modifiers
    modifier bookingExists(uint256 _bookingId) {
        require(bookings[_bookingId].id != 0, "Booking does not exist");
        _;
    }
    
    modifier onlyCustomer(uint256 _bookingId) {
        require(bookings[_bookingId].customer == msg.sender, "Not the booking customer");
        _;
    }
    
    modifier validBookingType(BookingType _type) {
        require(uint8(_type) <= uint8(BookingType.OTHER), "Invalid booking type");
        _;
    }
    
    // Initialization (replaces constructor for upgradeable contracts)
    function initialize(
        address _owner,
        address _feeRecipient,
        uint256 _platformFeePercent
    ) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_platformFeePercent <= 1000, "Fee too high"); // Max 10%
        feeRecipient = _feeRecipient;
        platformFeePercent = _platformFeePercent;
    }
    
    /**
     * @dev Create a new booking
     * @param _bookingType Type of booking (flight, hotel, etc.)
     * @param _serviceDate Date when the service will be provided
     * @param _metadataHash IPFS hash containing booking details
     * @param _isRefundable Whether the booking can be refunded
     * @param _refundDeadline Deadline for refund requests (0 if not refundable)
     */
    function createBooking(
        BookingType _bookingType,
        uint256 _serviceDate,
        string calldata _metadataHash,
        bool _isRefundable,
        uint256 _refundDeadline
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validBookingType(_bookingType)
    {
        require(msg.value > 0, "Booking amount must be greater than 0");
        require(_serviceDate > block.timestamp, "Service date must be in the future");
        require(bytes(_metadataHash).length > 0, "Metadata hash required");
        
        if (_isRefundable) {
            require(_refundDeadline > block.timestamp, "Invalid refund deadline");
            require(_refundDeadline < _serviceDate, "Refund deadline must be before service date");
        }
        
        _bookingIdCounter++;
        uint256 newBookingId = _bookingIdCounter;
        
        bookings[newBookingId] = Booking({
            id: newBookingId,
            customer: msg.sender,
            bookingType: _bookingType,
            status: BookingStatus.PENDING,
            amount: msg.value,
            createdAt: block.timestamp,
            confirmedAt: 0,
            serviceDate: _serviceDate,
            metadataHash: _metadataHash,
            isRefundable: _isRefundable,
            refundDeadline: _refundDeadline
        });
        
        userBookings[msg.sender].push(newBookingId);
        typeBookingCounts[_bookingType]++;
        
        emit BookingCreated(
            newBookingId,
            msg.sender,
            _bookingType,
            msg.value,
            _serviceDate,
            _metadataHash
        );
    }
    
    /**
     * @dev Confirm a booking (only owner/admin can confirm)
     * @param _bookingId ID of the booking to confirm
     */
    function confirmBooking(uint256 _bookingId) 
        external 
        onlyOwner 
        bookingExists(_bookingId) 
    {
        Booking storage booking = bookings[_bookingId];
        require(booking.status == BookingStatus.PENDING, "Booking not in pending status");
        
        booking.status = BookingStatus.CONFIRMED;
        booking.confirmedAt = block.timestamp;
        
        emit BookingConfirmed(_bookingId, booking.customer, block.timestamp);
    }
    
    /**
     * @dev Cancel a booking
     * @param _bookingId ID of the booking to cancel
     */
    function cancelBooking(uint256 _bookingId) 
        external 
        nonReentrant 
        bookingExists(_bookingId) 
        onlyCustomer(_bookingId) 
    {
        Booking storage booking = bookings[_bookingId];
        require(
            booking.status == BookingStatus.PENDING || booking.status == BookingStatus.CONFIRMED,
            "Cannot cancel this booking"
        );
        
        bool refundIssued = false;
        
        // Check if refund is applicable
        if (booking.isRefundable && block.timestamp <= booking.refundDeadline) {
            uint256 platformFee = (booking.amount * platformFeePercent) / 10000;
            uint256 refundAmount = booking.amount - platformFee;
            
            // Transfer platform fee
            if (platformFee > 0) {
                (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
                require(feeSuccess, "Fee transfer failed");
            }
            
            // Refund to customer
            (bool refundSuccess, ) = booking.customer.call{value: refundAmount}("");
            require(refundSuccess, "Refund transfer failed");
            
            booking.status = BookingStatus.REFUNDED;
            refundIssued = true;
            
            emit RefundIssued(_bookingId, booking.customer, refundAmount);
        } else {
            booking.status = BookingStatus.CANCELLED;
        }
        
        emit BookingCancelled(_bookingId, booking.customer, block.timestamp, refundIssued);
    }
    
    /**
     * @dev Mark a booking as completed (after service is provided)
     * @param _bookingId ID of the booking to complete
     */
    function completeBooking(uint256 _bookingId) 
        external 
        onlyOwner 
        bookingExists(_bookingId) 
    {
        Booking storage booking = bookings[_bookingId];
        require(booking.status == BookingStatus.CONFIRMED, "Booking not confirmed");
        require(block.timestamp >= booking.serviceDate, "Service date not reached");
        
        booking.status = BookingStatus.COMPLETED;
        
        emit BookingCompleted(_bookingId, booking.customer, block.timestamp);
    }
    
    /**
     * @dev Get booking details
     * @param _bookingId ID of the booking
     */
    function getBooking(uint256 _bookingId) 
        external 
        view 
        bookingExists(_bookingId) 
        returns (Booking memory) 
    {
        return bookings[_bookingId];
    }
    
    /**
     * @dev Get all booking IDs for a user
     * @param _user Address of the user
     */
    function getUserBookings(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userBookings[_user];
    }
    
    /**
     * @dev Get total number of bookings
     */
    function getTotalBookings() external view returns (uint256) {
        return _bookingIdCounter;
    }
    
    /**
     * @dev Update platform fee percentage
     * @param _newFeePercent New fee percentage in basis points
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(_newFeePercent);
    }
    
    /**
     * @dev Update fee recipient address
     * @param _newFeeRecipient New fee recipient address
     */
    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _newFeeRecipient;
        emit FeeRecipientUpdated(_newFeeRecipient);
    }
    
    /**
     * @dev Pause the contract (emergency function)
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
     * @dev Withdraw accumulated fees (for non-refunded bookings)
     * @param _amount Amount to withdraw
     */
    function withdrawFees(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = feeRecipient.call{value: _amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
