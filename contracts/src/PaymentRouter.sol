// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SmartVault.sol";

/**
 * @title PaymentRouter
 * @dev Rule-based recurring payment system with time-lock protection.
 *      AI layer feeds payment schedules; this contract executes them on-chain.
 */
contract PaymentRouter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    SmartVault public immutable vault;
    IERC20 public immutable usdc;

    uint256 public constant MIN_TIMELOCK = 1 hours;
    uint256 public constant MAX_TIMELOCK = 30 days;

    enum Frequency { OneTime, Daily, Weekly, Monthly }

    struct ScheduledPayment {
        uint256 id;
        address owner;
        address recipient;
        uint256 amount;
        Frequency frequency;
        uint256 nextExecutionTime;
        uint256 timeLockEnd;       // earliest time payment can be cancelled
        string label;
        bool active;
        uint256 executionCount;
        uint256 maxExecutions;     // 0 = unlimited
    }

    uint256 public nextPaymentId;
    mapping(address => uint256[]) public userPaymentIds;
    mapping(uint256 => ScheduledPayment) public payments;

    // --- Events ---
    event PaymentScheduled(
        uint256 indexed paymentId,
        address indexed owner,
        address recipient,
        uint256 amount,
        Frequency frequency,
        string label
    );
    event PaymentExecuted(
        uint256 indexed paymentId,
        address indexed recipient,
        uint256 amount,
        uint256 executionCount
    );
    event PaymentCancelled(uint256 indexed paymentId, address indexed owner);

    constructor(address _vault, address _usdc, address _owner) Ownable(_owner) {
        vault = SmartVault(_vault);
        usdc = IERC20(_usdc);
    }

    // --- Schedule Payments ---

    function schedulePayment(
        address _recipient,
        uint256 _amount,
        Frequency _frequency,
        uint256 _startTime,
        uint256 _timeLockDuration,
        string calldata _label,
        uint256 _maxExecutions
    ) external returns (uint256 paymentId) {
        require(_recipient != address(0), "PaymentRouter: zero recipient");
        require(_amount > 0, "PaymentRouter: amount must be > 0");
        require(_startTime >= block.timestamp, "PaymentRouter: start must be future");
        require(
            _timeLockDuration >= MIN_TIMELOCK && _timeLockDuration <= MAX_TIMELOCK,
            "PaymentRouter: invalid timelock"
        );

        paymentId = nextPaymentId++;
        payments[paymentId] = ScheduledPayment({
            id: paymentId,
            owner: msg.sender,
            recipient: _recipient,
            amount: _amount,
            frequency: _frequency,
            nextExecutionTime: _startTime,
            timeLockEnd: block.timestamp + _timeLockDuration,
            label: _label,
            active: true,
            executionCount: 0,
            maxExecutions: _maxExecutions
        });
        userPaymentIds[msg.sender].push(paymentId);

        emit PaymentScheduled(paymentId, msg.sender, _recipient, _amount, _frequency, _label);
    }

    // --- Execute Payments (callable by keeper / owner) ---

    function executePayment(uint256 _paymentId) external nonReentrant {
        ScheduledPayment storage payment = payments[_paymentId];
        require(payment.active, "PaymentRouter: payment not active");
        require(block.timestamp >= payment.nextExecutionTime, "PaymentRouter: too early");
        require(
            msg.sender == owner() || msg.sender == payment.owner,
            "PaymentRouter: not authorized"
        );

        payment.executionCount++;
        payment.nextExecutionTime = _nextExecutionTime(payment.frequency, block.timestamp);

        if (payment.maxExecutions > 0 && payment.executionCount >= payment.maxExecutions) {
            payment.active = false;
        }

        vault.transferOnBehalf(payment.owner, payment.recipient, payment.amount);

        emit PaymentExecuted(_paymentId, payment.recipient, payment.amount, payment.executionCount);
    }

    function cancelPayment(uint256 _paymentId) external {
        ScheduledPayment storage payment = payments[_paymentId];
        require(payment.owner == msg.sender, "PaymentRouter: not your payment");
        require(payment.active, "PaymentRouter: already inactive");
        require(block.timestamp >= payment.timeLockEnd, "PaymentRouter: timelock active");

        payment.active = false;
        emit PaymentCancelled(_paymentId, msg.sender);
    }

    function forceCancel(uint256 _paymentId) external onlyOwner {
        payments[_paymentId].active = false;
        emit PaymentCancelled(_paymentId, payments[_paymentId].owner);
    }

    // --- Views ---

    function getUserPayments(address _user) external view returns (ScheduledPayment[] memory) {
        uint256[] storage ids = userPaymentIds[_user];
        ScheduledPayment[] memory result = new ScheduledPayment[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = payments[ids[i]];
        }
        return result;
    }

    function getDuePayments(address _user) external view returns (uint256[] memory dueIds) {
        uint256[] storage ids = userPaymentIds[_user];
        uint256 count;
        for (uint256 i = 0; i < ids.length; i++) {
            ScheduledPayment storage p = payments[ids[i]];
            if (p.active && block.timestamp >= p.nextExecutionTime) count++;
        }
        dueIds = new uint256[](count);
        uint256 j;
        for (uint256 i = 0; i < ids.length; i++) {
            ScheduledPayment storage p = payments[ids[i]];
            if (p.active && block.timestamp >= p.nextExecutionTime) {
                dueIds[j++] = ids[i];
            }
        }
    }

    // --- Internal ---

    function _nextExecutionTime(Frequency _freq, uint256 _from) internal pure returns (uint256) {
        if (_freq == Frequency.Daily)   return _from + 1 days;
        if (_freq == Frequency.Weekly)  return _from + 7 days;
        if (_freq == Frequency.Monthly) return _from + 30 days;
        return type(uint256).max; // OneTime → never repeats
    }
}
