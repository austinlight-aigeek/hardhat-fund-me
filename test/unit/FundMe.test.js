const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");

describe("FundMe", function () {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  let fundMeProvider;
  const sendValue = ethers.parseEther("1");

  beforeEach(async function () {
    // deploy FundMe contract using hardhat deploy
    // const accounts = await ethers.getSigners();
    // const accountZero = accounts[0];

    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    const signer = await ethers.getSigner(deployer);

    fundMeProvider = signer.provider;

    const fundMeDeployment = await deployments.get("FundMe");
    fundMe = await ethers.getContractAt(
      "FundMe",
      fundMeDeployment.address,
      signer
    );

    const mockV3AggregatorDeployment = await deployments.get(
      "MockV3Aggregator"
    );
    mockV3Aggregator = await ethers.getContractAt(
      "MockV3Aggregator",
      mockV3AggregatorDeployment.address,
      signer
    );
  });

  describe("constructor", function () {
    it("sets the aggregator address correctly", async function () {
      const response = fundMe.priceFeed;
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe("fund", function () {
    it("Fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH"
      );
    });

    it("Update the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });

    it("Adds funder to array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.funders(0);
      assert.equal(funder, deployer);
    });
  });

  describe("withdraw", function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });

    it("Withdraw ETH from a single founder", async function () {
      // Arrange
      const fundMeAddress = await fundMe.getAddress();

      const startingFundMeBalance = await fundMeProvider.getBalance(
        fundMeAddress
      );

      const startingDeployerBalance = await fundMeProvider.getBalance(deployer);

      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      const { gasUsed, gasPrice } = transactionReceipt;
      const totalGasCost = gasUsed * gasPrice;

      const endingFundMeBalance = await fundMeProvider.getBalance(
        fundMeAddress
      );
      const endingDeployerBalance = await fundMeProvider.getBalance(deployer);

      // Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance + startingDeployerBalance,
        endingDeployerBalance + totalGasCost
      );
    });

    it("Allows us to withdraw with multiple funders", async function () {
      const accounts = await ethers.getSigners();
      const fundMeAddress = await fundMe.getAddress();

      for (let i = 0; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMeProvider.getBalance(
        fundMeAddress
      );

      const startingDeployerBalance = await fundMeProvider.getBalance(deployer);

      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, gasPrice } = transactionReceipt;
      const totalGasCost = gasUsed * gasPrice;

      // Assert
      const endingFundMeBalance = await fundMeProvider.getBalance(
        fundMeAddress
      );
      const endingDeployerBalance = await fundMeProvider.getBalance(deployer);

      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance + startingDeployerBalance,
        endingDeployerBalance + totalGasCost
      );

      // Make sure that the funders are reset properly
      await expect(fundMe.funders(0)).to.be.reverted;
      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.addressToAmountFunded(accounts[i].address),
          "0"
        );
      }
    });

    it("Only allows the owner to withdraw", async function () {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);

      // try {
      //   await attackerConnectedContract.withdraw();
      // } catch (error) {
      //   // Decode the custom error
      //   const errorData = error.error.data;

      //   console.log(error);
      //   const errorSelector = errorData.slice(0, 10); // First 4 bytes (8 hex chars) are the function selector
      //   const customErrorSelector = ethers.utils
      //     .id("FundMe__NotOwner()")
      //     .slice(0, 10);

      //   expect(errorSelector).to.equal(customErrorSelector);
      // }

      await expect(
        attackerConnectedContract.withdraw()
      ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
    });
  });
});
