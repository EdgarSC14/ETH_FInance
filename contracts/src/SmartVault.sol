// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SmartVault
 * @dev Core vault for the AI Financial Layer. Handles USDC deposits,
 *      withdrawals, and inter-contract fund distribution.
 */
contract SmartVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    // --- State ---
    mapping(address => uint256) public balances;
    mapping(address => bool) public authorizedContracts;
    uint256 public totalDeposited;

    // --- Allocation Rules ---
    struct AllocationRule {
        address destination;
        uint16 basisPoints; // 10000 = 100%
        string label;
        bool active;
    }
    mapping(address => AllocationRule[]) public userRules;

    // --- Events ---
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event Allocated(address indexed user, address indexed destination, uint256 amount, string label);
    event RuleAdded(address indexed user, address destination, uint16 basisPoints, string label);
    event AuthorizedContract(address indexed contractAddress, bool status);

    constructor(address _usdc, address _owner) Ownable(_owner) {
        usdc = IERC20(_usdc);
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || authorizedContracts[msg.sender],
            "SmartVault: not authorized"
        );
        _;
    }

    // --- Admin ---

    function setAuthorizedContract(address _contract, bool _status) external onlyOwner {
        authorizedContracts[_contract] = _status;
        emit AuthorizedContract(_contract, _status);
    }

    // --- Deposit & Withdraw ---

    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "SmartVault: amount must be > 0");
        usdc.safeTransferFrom(msg.sender, address(this), _amount);
        balances[msg.sender] += _amount;
        totalDeposited += _amount;
        emit Deposited(msg.sender, _amount, block.timestamp);
        _applyAllocationRules(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external nonReentrant {
        require(_amount > 0, "SmartVault: amount must be > 0");
        require(balances[msg.sender] >= _amount, "SmartVault: insufficient balance");
        balances[msg.sender] -= _amount;
        totalDeposited -= _amount;
        usdc.safeTransfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }

    // --- Allocation Rules ---

    function addAllocationRule(
        address _destination,
        uint16 _basisPoints,
        string calldata _label
    ) external {
        require(_destination != address(0), "SmartVault: zero address");
        require(_basisPoints <= 10000, "SmartVault: max 100%");
        _validateTotalAllocation(msg.sender, _basisPoints);

        userRules[msg.sender].push(AllocationRule({
            destination: _destination,
            basisPoints: _basisPoints,
            label: _label,
            active: true
        }));
        emit RuleAdded(msg.sender, _destination, _basisPoints, _label);
    }

    function removeAllocationRule(uint256 _index) external {
        require(_index < userRules[msg.sender].length, "SmartVault: invalid index");
        userRules[msg.sender][_index].active = false;
    }

    function getUserRules(address _user) external view returns (AllocationRule[] memory) {
        return userRules[_user];
    }

    // --- Internal ---

    function _applyAllocationRules(address _user, uint256 _depositAmount) internal {
        AllocationRule[] storage rules = userRules[_user];
        for (uint256 i = 0; i < rules.length; i++) {
            if (!rules[i].active) continue;
            uint256 share = (_depositAmount * rules[i].basisPoints) / 10000;
            if (share == 0) continue;
            if (balances[_user] >= share) {
                balances[_user] -= share;
                usdc.safeTransfer(rules[i].destination, share);
                emit Allocated(_user, rules[i].destination, share, rules[i].label);
            }
        }
    }

    function _validateTotalAllocation(address _user, uint16 _newBasisPoints) internal view {
        uint256 total = _newBasisPoints;
        AllocationRule[] storage rules = userRules[_user];
        for (uint256 i = 0; i < rules.length; i++) {
            if (rules[i].active) total += rules[i].basisPoints;
        }
        require(total <= 10000, "SmartVault: total allocation exceeds 100%");
    }

    // --- Authorized calls (from GoalManager, PaymentRouter) ---

    function transferOnBehalf(
        address _from,
        address _to,
        uint256 _amount
    ) external onlyAuthorized nonReentrant {
        require(balances[_from] >= _amount, "SmartVault: insufficient user balance");
        balances[_from] -= _amount;
        usdc.safeTransfer(_to, _amount);
    }

    function creditBalance(address _user, uint256 _amount) external onlyAuthorized {
        balances[_user] += _amount;
    }
}
