// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title PaymentTracker
 * @dev Contract for tracking payments, escrow, and handling refunds
 * @notice This contract manages payment flows for bookings with escrow functionality
 */
contract PaymentTracker is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    // State variables
    uint256 private _paymentIdCounter;
    
    // Payment status
    enum PaymentStatus { PENDING, ESCROWED, RELEASED, REFUNDED, DISPUTED }
    
    // Dispute status
    enum DisputeStatus { NONE, RAISED, UNDER_REVIEW, RESOLVED }
    
    // Payment structure
    struct Payment {
        uint256 id;
        uint256 bookingId;
        address payer;
        address payee;
        uint256 amount;
        uint256 platformFee;
        PaymentStatus status;
        uint256 createdAt;
        uint256 escrowReleaseTime;
        uint256 refundDeadline;
        bool isRefundable;
        string paymentHash; // External payment reference
    }
    
    // Escrow structure
    struct Escrow {
        uint256 paymentId;
        uint256 amount;
        uint256 releaseTime;
        address beneficiary;
        bool isReleased;
        uint256 disputeDeadline;
    }
    
    // Dispute structure
    struct Dispute {
        uint256 paymentId;
        address disputant;
        string reason;
        DisputeStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
        address resolver;
        uint256 resolution; // 0 = refund to payer, 1 = release to payee, 2 = split
    }
    
    // Mappings
    mapping(uint256 => Payment) public payments;
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256) public bookingToPayment; // bookingId => paymentId
    mapping(address => uint256[]) public userPayments;
    
    // Platform configuration
    uint256 public escrowPeriod; // Default escrow period in seconds
    uint256 public disputePeriod; // Period to raise disputes after service
    address public platformWallet;
    
    // Authorized contracts and dispute resolvers
    mapping(address => bool) public authorizedContracts;
    mapping(address => bool) public disputeResolvers;
    
    // Events
    event PaymentCreated(
        uint256 indexed paymentId,
        uint256 indexed bookingId,
        address indexed payer,
        address payee,
        uint256 amount,
        uint256 platformFee
    );
    
    event PaymentEscrowed(
        uint256 indexed paymentId,
        uint256 releaseTime
    );
    
    event PaymentReleased(
        uint256 indexed paymentId,
        address indexed recipient,
        uint256 amount
    );
    
    event PaymentRefunded(
        uint256 indexed paymentId,
        address indexed recipient,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed paymentId,
        address indexed disputant,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed paymentId,
        address indexed resolver,
        uint256 resolution
    );
    
    event EscrowReleased(
        uint256 indexed paymentId,
        address indexed beneficiary,
        uint256 amount
    );
    
    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier onlyDisputeResolver() {
        require(disputeResolvers[msg.sender] || msg.sender == owner(), "Not a dispute resolver");
        _;
    }
    
    modifier paymentExists(uint256 _paymentId) {
        require(payments[_paymentId].id != 0, "Payment does not exist");
        _;
    }
    
    modifier validPayee(address _payee) {
        require(_payee != address(0), "Invalid payee address");
        require(_payee != msg.sender, "Cannot pay yourself");
        _;
    }
    
    // Initialization
    function initialize(
        address _owner,
        address _platformWallet,
        uint256 _escrowPeriod,
        uint256 _disputePeriod
    ) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_escrowPeriod > 0, "Invalid escrow period");
        require(_disputePeriod > 0, "Invalid dispute period");
        
        platformWallet = _platformWallet;
        escrowPeriod = _escrowPeriod;
        disputePeriod = _disputePeriod;
    }
    
    /**
     * @dev Create a new payment
     * @param _bookingId ID of the related booking
     * @param _payee Address to receive the payment
     * @param _platformFee Platform fee amount
     * @param _isRefundable Whether the payment can be refunded
     * @param _refundDeadline Deadline for refund requests
     * @param _paymentHash External payment reference hash
     */
    function createPayment(
        uint256 _bookingId,
        address _payee,
        uint256 _platformFee,
        bool _isRefundable,
        uint256 _refundDeadline,
        string calldata _paymentHash
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validPayee(_payee) 
        onlyAuthorized 
    {
        require(msg.value > _platformFee, "Insufficient payment amount");
        require(bookingToPayment[_bookingId] == 0, "Payment already exists for booking");
        
        if (_isRefundable) {
            require(_refundDeadline > block.timestamp, "Invalid refund deadline");
        }
        
        _paymentIdCounter++;
        uint256 newPaymentId = _paymentIdCounter;
        
        payments[newPaymentId] = Payment({
            id: newPaymentId,
            bookingId: _bookingId,
            payer: msg.sender,
            payee: _payee,
            amount: msg.value,
            platformFee: _platformFee,
            status: PaymentStatus.PENDING,
            createdAt: block.timestamp,
            escrowReleaseTime: 0,
            refundDeadline: _refundDeadline,
            isRefundable: _isRefundable,
            paymentHash: _paymentHash
        });
        
        bookingToPayment[_bookingId] = newPaymentId;
        userPayments[msg.sender].push(newPaymentId);
        userPayments[_payee].push(newPaymentId);
        
        emit PaymentCreated(
            newPaymentId,
            _bookingId,
            msg.sender,
            _payee,
            msg.value,
            _platformFee
        );
    }
    
    /**
     * @dev Move payment to escrow (after booking confirmation)
     * @param _paymentId ID of the payment
     */
    function escrowPayment(uint256 _paymentId) 
        external 
        onlyAuthorized 
        paymentExists(_paymentId) 
    {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.PENDING, "Payment not in pending status");
        
        uint256 releaseTime = block.timestamp + escrowPeriod;
        payment.status = PaymentStatus.ESCROWED;
        payment.escrowReleaseTime = releaseTime;
        
        escrows[_paymentId] = Escrow({
            paymentId: _paymentId,
            amount: payment.amount - payment.platformFee,
            releaseTime: releaseTime,
            beneficiary: payment.payee,
            isReleased: false,
            disputeDeadline: releaseTime + disputePeriod
        });
        
        emit PaymentEscrowed(_paymentId, releaseTime);
    }
    
    /**
     * @dev Release payment from escrow
     * @param _paymentId ID of the payment
     */
    function releasePayment(uint256 _paymentId) 
        external 
        nonReentrant 
        paymentExists(_paymentId) 
    {
        Payment storage payment = payments[_paymentId];
        Escrow storage escrow = escrows[_paymentId];
        
        require(payment.status == PaymentStatus.ESCROWED, "Payment not in escrow");
        require(
            block.timestamp >= payment.escrowReleaseTime || 
            msg.sender == owner() || 
            authorizedContracts[msg.sender],
            "Escrow period not ended"
        );
        require(!escrow.isReleased, "Payment already released");
        
        // Check for active disputes
        if (disputes[_paymentId].status == DisputeStatus.RAISED || 
            disputes[_paymentId].status == DisputeStatus.UNDER_REVIEW) {
            revert("Payment under dispute");
        }
        
        payment.status = PaymentStatus.RELEASED;
        escrow.isReleased = true;
        
        // Transfer platform fee
        if (payment.platformFee > 0) {
            (bool feeSuccess, ) = platformWallet.call{value: payment.platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");
        }
        
        // Transfer payment to payee
        uint256 payeeAmount = payment.amount - payment.platformFee;
        (bool payeeSuccess, ) = payment.payee.call{value: payeeAmount}("");
        require(payeeSuccess, "Payment transfer failed");
        
        emit PaymentReleased(_paymentId, payment.payee, payeeAmount);
        emit EscrowReleased(_paymentId, payment.payee, payeeAmount);
    }
    
    /**
     * @dev Refund a payment
     * @param _paymentId ID of the payment
     */
    function refundPayment(uint256 _paymentId) 
        external 
        nonReentrant 
        paymentExists(_paymentId) 
    {
        Payment storage payment = payments[_paymentId];
        
        require(
            payment.status == PaymentStatus.PENDING || 
            payment.status == PaymentStatus.ESCROWED,
            "Payment cannot be refunded"
        );
        
        require(payment.isRefundable, "Payment not refundable");
        require(block.timestamp <= payment.refundDeadline, "Refund deadline passed");
        
        // Only payer, owner, or authorized contracts can initiate refund
        require(
            msg.sender == payment.payer || 
            msg.sender == owner() || 
            authorizedContracts[msg.sender],
            "Not authorized to refund"
        );
        
        payment.status = PaymentStatus.REFUNDED;
        
        // Mark escrow as released if it exists
        if (escrows[_paymentId].paymentId != 0) {
            escrows[_paymentId].isReleased = true;
        }
        
        // Transfer platform fee (for processing)
        if (payment.platformFee > 0) {
            (bool feeSuccess, ) = platformWallet.call{value: payment.platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");
        }
        
        // Refund to payer
        uint256 refundAmount = payment.amount - payment.platformFee;
        (bool refundSuccess, ) = payment.payer.call{value: refundAmount}("");
        require(refundSuccess, "Refund transfer failed");
        
        emit PaymentRefunded(_paymentId, payment.payer, refundAmount);
    }
    
    /**
     * @dev Raise a dispute for a payment
     * @param _paymentId ID of the payment
     * @param _reason Reason for the dispute
     */
    function raiseDispute(uint256 _paymentId, string calldata _reason) 
        external 
        paymentExists(_paymentId) 
    {
        Payment storage payment = payments[_paymentId];
        require(
            msg.sender == payment.payer || msg.sender == payment.payee,
            "Only payer or payee can raise dispute"
        );
        require(payment.status == PaymentStatus.ESCROWED, "Payment not in escrow");
        require(disputes[_paymentId].status == DisputeStatus.NONE, "Dispute already exists");
        require(bytes(_reason).length > 0, "Dispute reason required");
        
        Escrow storage escrow = escrows[_paymentId];
        require(block.timestamp <= escrow.disputeDeadline, "Dispute period expired");
        
        disputes[_paymentId] = Dispute({
            paymentId: _paymentId,
            disputant: msg.sender,
            reason: _reason,
            status: DisputeStatus.RAISED,
            createdAt: block.timestamp,
            resolvedAt: 0,
            resolver: address(0),
            resolution: 0
        });
        
        payment.status = PaymentStatus.DISPUTED;
        
        emit DisputeRaised(_paymentId, msg.sender, _reason);
    }
    
    /**
     * @dev Resolve a dispute
     * @param _paymentId ID of the payment
     * @param _resolution Resolution: 0 = refund to payer, 1 = release to payee, 2 = split
     */
    function resolveDispute(uint256 _paymentId, uint256 _resolution) 
        external 
        nonReentrant 
        onlyDisputeResolver 
        paymentExists(_paymentId) 
    {
        require(_resolution <= 2, "Invalid resolution");
        
        Payment storage payment = payments[_paymentId];
        Dispute storage dispute = disputes[_paymentId];
        
        require(payment.status == PaymentStatus.DISPUTED, "Payment not disputed");
        require(
            dispute.status == DisputeStatus.RAISED || 
            dispute.status == DisputeStatus.UNDER_REVIEW,
            "Dispute not active"
        );
        
        dispute.status = DisputeStatus.RESOLVED;
        dispute.resolvedAt = block.timestamp;
        dispute.resolver = msg.sender;
        dispute.resolution = _resolution;
        
        uint256 paymentAmount = payment.amount - payment.platformFee;
        
        // Transfer platform fee
        if (payment.platformFee > 0) {
            (bool feeSuccess, ) = platformWallet.call{value: payment.platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");
        }
        
        if (_resolution == 0) {
            // Refund to payer
            payment.status = PaymentStatus.REFUNDED;
            (bool refundSuccess, ) = payment.payer.call{value: paymentAmount}("");
            require(refundSuccess, "Refund transfer failed");
            
            emit PaymentRefunded(_paymentId, payment.payer, paymentAmount);
        } else if (_resolution == 1) {
            // Release to payee
            payment.status = PaymentStatus.RELEASED;
            (bool payeeSuccess, ) = payment.payee.call{value: paymentAmount}("");
            require(payeeSuccess, "Payment transfer failed");
            
            emit PaymentReleased(_paymentId, payment.payee, paymentAmount);
        } else {
            // Split payment
            payment.status = PaymentStatus.RELEASED;
            uint256 halfAmount = paymentAmount / 2;
            
            (bool payerSuccess, ) = payment.payer.call{value: halfAmount}("");
            require(payerSuccess, "Payer transfer failed");
            
            (bool payeeSuccess, ) = payment.payee.call{value: paymentAmount - halfAmount}("");
            require(payeeSuccess, "Payee transfer failed");
            
            emit PaymentRefunded(_paymentId, payment.payer, halfAmount);
            emit PaymentReleased(_paymentId, payment.payee, paymentAmount - halfAmount);
        }
        
        escrows[_paymentId].isReleased = true;
        
        emit DisputeResolved(_paymentId, msg.sender, _resolution);
    }
    
    /**
     * @dev Get payment details
     * @param _paymentId ID of the payment
     */
    function getPayment(uint256 _paymentId) 
        external 
        view 
        paymentExists(_paymentId) 
        returns (Payment memory) 
    {
        return payments[_paymentId];
    }
    
    /**
     * @dev Get escrow details
     * @param _paymentId ID of the payment
     */
    function getEscrow(uint256 _paymentId) 
        external 
        view 
        returns (Escrow memory) 
    {
        return escrows[_paymentId];
    }
    
    /**
     * @dev Get dispute details
     * @param _paymentId ID of the payment
     */
    function getDispute(uint256 _paymentId) 
        external 
        view 
        returns (Dispute memory) 
    {
        return disputes[_paymentId];
    }
    
    /**
     * @dev Get user's payments
     * @param _user Address of the user
     */
    function getUserPayments(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userPayments[_user];
    }
    
    /**
     * @dev Get total number of payments
     */
    function getTotalPayments() external view returns (uint256) {
        return _paymentIdCounter;
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
     * @dev Set dispute resolver
     * @param _resolver Address of the dispute resolver
     * @param _authorized Authorization status
     */
    function setDisputeResolver(address _resolver, bool _authorized) 
        external 
        onlyOwner 
    {
        require(_resolver != address(0), "Invalid resolver address");
        disputeResolvers[_resolver] = _authorized;
    }
    
    /**
     * @dev Update escrow period
     * @param _newPeriod New escrow period in seconds
     */
    function updateEscrowPeriod(uint256 _newPeriod) external onlyOwner {
        require(_newPeriod > 0, "Invalid escrow period");
        escrowPeriod = _newPeriod;
    }
    
    /**
     * @dev Update dispute period
     * @param _newPeriod New dispute period in seconds
     */
    function updateDisputePeriod(uint256 _newPeriod) external onlyOwner {
        require(_newPeriod > 0, "Invalid dispute period");
        disputePeriod = _newPeriod;
    }
    
    /**
     * @dev Update platform wallet
     * @param _newWallet New platform wallet address
     */
    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid wallet address");
        platformWallet = _newWallet;
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
}
