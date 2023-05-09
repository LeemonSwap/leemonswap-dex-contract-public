// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TridentLPStaking is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken;

    struct UserInfo {
        uint256 balance;
        uint256 rewardDebt;
    }

    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 totalStaked;
        uint256 accRewardPerShare;
    }

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    uint256 public totalAllocPoint;

    event PoolAdded(uint256 indexed pid, IERC20 lpToken);
    event Staked(uint256 indexed pid, address indexed user, uint256 amount);
    event Withdrawn(uint256 indexed pid, address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(IERC20 _rewardToken) {
        rewardToken = _rewardToken;
    }

    function addPool(IERC20 _lpToken, uint256 _allocPoint) external onlyOwner {
        totalAllocPoint += _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            totalStaked: 0,
            accRewardPerShare: 0
        }));
        emit PoolAdded(poolInfo.length - 1, _lpToken);
    }

    function setAllocPoint(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        PoolInfo storage pool = poolInfo[_pid];
        totalAllocPoint = totalAllocPoint - pool.allocPoint + _allocPoint;
        pool.allocPoint = _allocPoint;
    }

    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        return user.balance * accRewardPerShare / 1e12 - user.rewardDebt;
    }

    function updatePool(uint256 _pid) internal {
        PoolInfo storage pool = poolInfo[_pid];
        if (pool.totalStaked == 0) {
            return;
        }
        uint256 reward = pool.allocPoint;
        pool.accRewardPerShare += reward * 1e12 / pool.totalStaked;
    }

    function stake(uint256 _pid, uint256 _amount) external {
        require(_amount > 0, "Cannot stake 0 tokens");

        UserInfo storage user = userInfo[_pid][msg.sender];
        PoolInfo storage pool = poolInfo[_pid];

        updatePool(_pid);

        if (user.balance > 0) {
            uint256 pending = user.balance * pool.accRewardPerShare / 1e12 - user.rewardDebt;
            if (pending > 0) {
                rewardToken.safeTransfer(msg.sender, pending);
                emit RewardClaimed(msg.sender, pending);
            }
        }

        pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
        user.balance += _amount;
        pool.totalStaked += _amount;
        user.rewardDebt = user.balance * pool.accRewardPerShare / 1e12;
        emit Staked(_pid, msg.sender, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) external {
        require(_amount > 0, "Cannot withdraw 0 tokens");

        UserInfo storage user = userInfo[_pid][msg.sender];
        PoolInfo storage pool = poolInfo[_pid];

        require(user.balance >= _amount, "Insufficient balance");

        updatePool(_pid);

        uint256 pending = user.balance * pool.accRewardPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            rewardToken.safeTransfer(msg.sender, pending);
            emit RewardClaimed(msg.sender, pending);
        }

        user.balance -= _amount;
        pool.totalStaked -= _amount;
        user.rewardDebt = user.balance * pool.accRewardPerShare / 1e12;

        pool.lpToken.safeTransfer(msg.sender, _amount);
        emit Withdrawn(_pid, msg.sender, _amount);
    }
}