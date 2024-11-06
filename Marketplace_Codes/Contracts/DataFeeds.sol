// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);

    function latestRoundData() external view returns
    (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

// using Chanlink oracle
contract DataFeeder {
    AggregatorV3Interface private constant ETH = AggregatorV3Interface(0x0715A7794a1dc8e42615F059dD6e406A6594651A);
    AggregatorV3Interface private constant BTC = AggregatorV3Interface(0x007A22900a3B98143368Bd5906f8E17e9867581b);
    AggregatorV3Interface private constant MATIC = AggregatorV3Interface(0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada);
    
    function ethPrice() public view returns(int256, uint8) {
        (,int price,,,) = ETH.latestRoundData();

        return (price, ETH.decimals());
    }

    function btcPrice() public view returns(int256, uint8) {
        (,int price,,,) = BTC.latestRoundData();

        return (price, BTC.decimals());
    }

    function maticPrice() public view returns(int256, uint8) {
        (,int price,,,) = MATIC.latestRoundData();

        return (price, MATIC.decimals());
    }
}