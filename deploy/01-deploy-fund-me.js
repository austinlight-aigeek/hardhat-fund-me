const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
require("dotenv").config();

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let ethUsdPriceFeed;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await get("MockV3Aggregator");
    ethUsdPriceFeed = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeed = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  // when going for localhost or hardhat network, we want to use a mock
  // the following will only deploy "FundMe" if the contract was never deployed or if the code changed since last deployment

  const args = [ethUsdPriceFeed];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  // verify
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }

  log("-----------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
