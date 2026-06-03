// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationRegistry
 * @dev On-chain reputation score per wallet. Authorized contracts (vault modules)
 *      or a backend relayer can record user actions for governance / identity tracks.
 */
contract ReputationRegistry is Ownable {
    mapping(address => uint256) public score;
    mapping(address => bool) public authorizedRecorders;

    event RecorderUpdated(address indexed recorder, bool authorized);
    event ReputationUpdated(
        address indexed user,
        uint256 newScore,
        uint8 actionType,
        uint256 pointsAdded
    );

    /// @dev 0=deposit, 1=goal_fund, 2=payment_execute, 3=goal_complete
    constructor(address _owner) Ownable(_owner) {
        authorizedRecorders[_owner] = true;
        emit RecorderUpdated(_owner, true);
    }

    function setAuthorizedRecorder(address _recorder, bool _status) external onlyOwner {
        authorizedRecorders[_recorder] = _status;
        emit RecorderUpdated(_recorder, _status);
    }

    function recordAction(address _user, uint8 _actionType, uint256 _points) external {
        require(authorizedRecorders[msg.sender], "ReputationRegistry: not authorized");
        require(_user != address(0), "ReputationRegistry: zero user");
        require(_points > 0, "ReputationRegistry: zero points");

        score[_user] += _points;
        emit ReputationUpdated(_user, score[_user], _actionType, _points);
    }

    function getScore(address _user) external view returns (uint256) {
        return score[_user];
    }
}
