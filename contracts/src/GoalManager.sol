// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SmartVault.sol";

/**
 * @title GoalManager
 * @dev Manages user financial goals with automated savings allocation.
 *      Each goal tracks target amount, deadline, and current progress.
 */
contract GoalManager is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    SmartVault public immutable vault;
    IERC20 public immutable usdc;

    enum GoalStatus { Active, Completed, Cancelled }

    struct Goal {
        uint256 id;
        address owner;
        string name;
        string emoji;
        uint256 targetAmount;   // in USDC (6 decimals)
        uint256 savedAmount;
        uint256 deadline;
        uint256 monthlyContribution;
        GoalStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    uint256 public nextGoalId;
    mapping(address => uint256[]) public userGoalIds;
    mapping(uint256 => Goal) public goals;

    // --- Events ---
    event GoalCreated(
        uint256 indexed goalId,
        address indexed owner,
        string name,
        uint256 targetAmount,
        uint256 deadline
    );
    event GoalFunded(uint256 indexed goalId, address indexed funder, uint256 amount, uint256 newTotal);
    event GoalCompleted(uint256 indexed goalId, address indexed owner, uint256 completedAt);
    event GoalCancelled(uint256 indexed goalId, address indexed owner);
    event GoalWithdrawn(uint256 indexed goalId, address indexed owner, uint256 amount);

    constructor(address _vault, address _usdc, address _owner) Ownable(_owner) {
        vault = SmartVault(_vault);
        usdc = IERC20(_usdc);
    }

    // --- Goal CRUD ---

    function createGoal(
        string calldata _name,
        string calldata _emoji,
        uint256 _targetAmount,
        uint256 _deadline,
        uint256 _monthlyContribution
    ) external returns (uint256 goalId) {
        require(_targetAmount > 0, "GoalManager: target must be > 0");
        require(_deadline > block.timestamp, "GoalManager: deadline must be future");
        require(_monthlyContribution > 0, "GoalManager: contribution must be > 0");

        goalId = nextGoalId++;
        goals[goalId] = Goal({
            id: goalId,
            owner: msg.sender,
            name: _name,
            emoji: _emoji,
            targetAmount: _targetAmount,
            savedAmount: 0,
            deadline: _deadline,
            monthlyContribution: _monthlyContribution,
            status: GoalStatus.Active,
            createdAt: block.timestamp,
            completedAt: 0
        });
        userGoalIds[msg.sender].push(goalId);
        emit GoalCreated(goalId, msg.sender, _name, _targetAmount, _deadline);
    }

    function fundGoal(uint256 _goalId, uint256 _amount) external nonReentrant {
        Goal storage goal = goals[_goalId];
        require(goal.owner == msg.sender, "GoalManager: not your goal");
        require(goal.status == GoalStatus.Active, "GoalManager: goal not active");
        require(_amount > 0, "GoalManager: amount must be > 0");

        usdc.safeTransferFrom(msg.sender, address(this), _amount);
        goal.savedAmount += _amount;

        emit GoalFunded(_goalId, msg.sender, _amount, goal.savedAmount);

        if (goal.savedAmount >= goal.targetAmount) {
            goal.status = GoalStatus.Completed;
            goal.completedAt = block.timestamp;
            emit GoalCompleted(_goalId, msg.sender, block.timestamp);
        }
    }

    function fundGoalFromVault(uint256 _goalId, uint256 _amount) external nonReentrant {
        Goal storage goal = goals[_goalId];
        require(goal.owner == msg.sender, "GoalManager: not your goal");
        require(goal.status == GoalStatus.Active, "GoalManager: goal not active");
        require(_amount > 0, "GoalManager: amount must be > 0");

        vault.transferOnBehalf(msg.sender, address(this), _amount);
        goal.savedAmount += _amount;

        emit GoalFunded(_goalId, msg.sender, _amount, goal.savedAmount);

        if (goal.savedAmount >= goal.targetAmount) {
            goal.status = GoalStatus.Completed;
            goal.completedAt = block.timestamp;
            emit GoalCompleted(_goalId, msg.sender, block.timestamp);
        }
    }

    function withdrawGoal(uint256 _goalId) external nonReentrant {
        Goal storage goal = goals[_goalId];
        require(goal.owner == msg.sender, "GoalManager: not your goal");
        require(goal.savedAmount > 0, "GoalManager: nothing to withdraw");

        uint256 amount = goal.savedAmount;
        goal.savedAmount = 0;

        if (goal.status != GoalStatus.Completed) {
            goal.status = GoalStatus.Cancelled;
            emit GoalCancelled(_goalId, msg.sender);
        }

        usdc.safeTransfer(msg.sender, amount);
        emit GoalWithdrawn(_goalId, msg.sender, amount);
    }

    function cancelGoal(uint256 _goalId) external {
        Goal storage goal = goals[_goalId];
        require(goal.owner == msg.sender, "GoalManager: not your goal");
        require(goal.status == GoalStatus.Active, "GoalManager: goal not active");
        goal.status = GoalStatus.Cancelled;
        emit GoalCancelled(_goalId, msg.sender);
    }

    // --- Views ---

    function getUserGoals(address _user) external view returns (Goal[] memory) {
        uint256[] storage ids = userGoalIds[_user];
        Goal[] memory result = new Goal[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = goals[ids[i]];
        }
        return result;
    }

    function getGoalProgress(uint256 _goalId) external view returns (
        uint256 saved,
        uint256 target,
        uint256 progressBps,
        uint256 daysRemaining
    ) {
        Goal storage goal = goals[_goalId];
        saved = goal.savedAmount;
        target = goal.targetAmount;
        progressBps = target > 0 ? (saved * 10000) / target : 0;
        daysRemaining = goal.deadline > block.timestamp
            ? (goal.deadline - block.timestamp) / 1 days
            : 0;
    }
}
