// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IERC20 {
    function balanceOf(address _account) external view returns(uint);
    function transfer(address _to, uint _amount) external returns(bool);
    function decimals() external view returns(uint8);
}

contract Faucet {
    uint32 public constant BLOCK_PERIOD = 1 days;
    IERC20 public immutable usdcToken;

    event Withdraw(address indexed caller, uint time);

    mapping(address => uint) private timeElapsed;

    constructor(IERC20 _usdcToken) {
        usdcToken = _usdcToken;
    }

    uint totalWithdrawCount;
    modifier count() {
        _;
        totalWithdrawCount += 1;
    } 

    function withdraw(address _target) external count {
        require(_target != address(0), "Invalid target address");
        uint8 decimal = usdcToken.decimals();
        uint maxAmount = (100000 * (10**decimal));
        require(usdcToken.balanceOf(_target) <= maxAmount, "The target account has the max amount of token");
        uint blockTimestamp = block.timestamp;
        require(blockTimestamp > timeElapsed[_target] + BLOCK_PERIOD, "Cannot withdraw until 1-day period expires");

        timeElapsed[_target] = blockTimestamp;

        uint amount = (10000 * (10**decimal));
        bool result = usdcToken.transfer(_target, amount);
        require(result, "Failed to send USDC tokens!");

        emit Withdraw(_target, blockTimestamp);
    }

    function getCount() external view returns(uint) {
        return totalWithdrawCount;
    }
}