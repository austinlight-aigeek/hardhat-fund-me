const { network } = require("hardhat");

const {
  developmentChains,
  DECIMALS,
  INITIAL_ETH_USD,
} = require("../helper-hardhat-config");

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId,
  getUnnamedAccounts,
}) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ETH_USD],
    });
    log("Mocks deployed!");
    log("---------------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
