// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract Crowdfunding {
    struct Campaign {
        address payable creator;
        uint goal;
        uint deadline;
        uint amountRaised;
        bool completed;
    }

    mapping(uint => Campaign) public campaigns;
    uint public campaignCount;

    event CampaignCreated(uint campaignId, address creator, uint goal, uint deadline);
    event ContributionReceived(uint campaignId, address contributor, uint amount);

    function createCampaign(uint _goal, uint _duration) public {
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            creator: payable(msg.sender),
            goal: _goal,
            deadline: block.timestamp + _duration,
            amountRaised: 0,
            completed: false
        });

        emit CampaignCreated(campaignCount, msg.sender, _goal, block.timestamp + _duration);
    }

    function contribute(uint _campaignId) public payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(!campaign.completed, "Campaign is completed");

        campaign.amountRaised += msg.value;

        emit ContributionReceived(_campaignId, msg.sender, msg.value);

        if (campaign.amountRaised >= campaign.goal) {
            campaign.completed = true;
            campaign.creator.transfer(campaign.amountRaised);
        }
    }

    function getRefund(uint _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign is still ongoing");
        require(!campaign.completed, "Campaign reached its goal");

        uint amount = address(this).balance;
        payable(msg.sender).transfer(amount);
    }
}
