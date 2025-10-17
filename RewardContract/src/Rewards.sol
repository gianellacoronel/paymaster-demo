// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract RewardContract {
    bool public rewardClaimed = false;

    constructor() payable {
        require(msg.value > 0, "Must send some tokens as reward!");
    }

    function claimReward() external {
        require(rewardClaimed == false, "Reward already claimed");
        uint256 rewardAmount = address(this).balance;
        payable(msg.sender).transfer(rewardAmount);
        rewardClaimed = true;
    }
}
