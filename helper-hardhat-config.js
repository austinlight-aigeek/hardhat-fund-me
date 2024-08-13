const networkConfig = {
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
  80002: {
    name: "amoy",
    ethUsdPriceFeed: "0xF0d50568e3A7e8259E16663972b11910F89BD8e7",
  },
  31337: {},
};

const developmentChains = ["hardhat", "localhost"];

const DECIMALS = 8;
const INITIAL_ETH_USD = 200000000000;
const HARDHAT_CHAIN_ID = "31337";

module.exports = {
  networkConfig,
  developmentChains,
  DECIMALS,
  INITIAL_ETH_USD,
};
