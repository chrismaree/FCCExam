// Import all required modules from openzeppelin-test-helpers
const {
  BN,
  constants,
  expectEvent,
  expectRevert
} = require("openzeppelin-test-helpers");
const { expect } = require("chai");

// Contracts
const CoToken = artifacts.require("./CoToken.sol");
// the functions below are used to validate the correctness of the bonding curve
// implementation with the contract. They are used to check the values of the buy/sell prices
// and to verify the contract reserve ratio. 
function expectedBuyPrice(x1, x2) {
  let price = 0.005 * (Math.pow(x2, 2) - Math.pow(x1, 2)) + 0.2 * (x2 - x1);
  return price.toFixed(10);
}

// The reserve ratio is used to ensure that there
// is always the correct amount of collateral within the contract relative to the outstanding supply of tokens.
function expectedReserveRatio(n) {
  let ratio = (0.005 * Math.pow(n, 2) + 0.2 * n) / ((0.01 * n + 0.2) * n);
  return ratio.toFixed(10);
}

function calcReserveRatio(poolBalance, currentPrice, tokenSupply) {
  return (poolBalance / (currentPrice * tokenSupply)).toFixed(0);
}

function tokenPriceFromSupply(tokenSuply) {
  return 0.01 * tokenSuply + 0.2;
}

contract("ERC20 Bonding Curve Contract", ([contractOwner, buyer1]) => {
  beforeEach(async function() {
    this.coToken = await CoToken.new({ from: contractOwner });
  });
  context("Deployment", function() {
    it("Can Correctly deploy contract and set constructor variables", async function() {
      let tokenName = await this.coToken.name();
      assert.equal(
        tokenName,
        "CoShoe Bonding Curve Token",
        "TokenName is not correctly set"
      );

      let tokenSymbol = await this.coToken.symbol();
      assert.equal(tokenSymbol, "CO", "TokenSymbol is not correctly set");
      let tokenDecimals = await this.coToken.decimals();
      assert.equal(tokenDecimals, 1, "TokenDecimal is not correctly set");
    });
  });
  context("Contract bonding curve maths helpers", function() {
    it("Can correctly calculate the buy price between two values", async function() {
      let x1 = 20;
      let x2 = 40;

      let manualCalc = expectedBuyPrice(x1, x2);
      manualCalc = new BN(web3.utils.toWei(manualCalc, "ether"));

      let contractCalc = await this.coToken.getPriceInWei(x1, x2);

      assert.equal(
        manualCalc.toString(),
        contractCalc.toString(),
        "Incorrectly calculated cost of moving price"
      );
    });
    it("Can correctly calculate the buy price for buying x tokens", async function() {
      let x1 = 0;
      let tokensToBuy = 10;
      let x2 = x1 + tokensToBuy;

      let manualCalc = expectedBuyPrice(x1, x2);
      manualCalc = new BN(web3.utils.toWei(manualCalc, "ether"));

      let contractCalc = await this.coToken.buyPrice(tokensToBuy);

      assert.equal(
        manualCalc.toString(),
        contractCalc.toString(),
        "Incorrectly calculated cost of buying x tokens"
      );
    });
  });
  context("mint functionality", function() {
    it("Calculates cost to buy tokens, mints correct # of ERC20 & stores ETH", async function() {
      let tokensToBuy = 10;
      let costOfTokens = await this.coToken.buyPrice(tokensToBuy);
      await this.coToken.mint(tokensToBuy, {
        from: buyer1,
        value: costOfTokens
      });

      let buyerBalance = await this.coToken.balanceOf(buyer1);
      assert.equal(
        buyerBalance,
        tokensToBuy,
        "Buyer did not correctly receive tokens"
      );

      let contractBalance = await web3.eth.getBalance(this.coToken.address);
      assert.equal(
        contractBalance.toString(),
        costOfTokens.toString(),
        "Did not correctly store ether balance after mint"
      );
    });
    it("Reverts if incorrect price sent with transaction", async function() {
      let invalidBuyPrice = 10;
      let validBuyNumber = 1;

      await expectRevert.unspecified(
        this.coToken.mint(validBuyNumber, {
          from: buyer1,
          value: invalidBuyPrice
        })
      );
    });
    it("Reverts if more than maximum token supply is requested", async function() {
      let invalidNo = 101;
      let validBuyPrice = await this.coToken.buyPrice(invalidNo);

      await expectRevert.unspecified(
        this.coToken.mint(invalidNo, {
          from: buyer1,
          value: validBuyPrice
        })
      );
    });
    it("Curve correctly maintains token to eth reserve ratio during mint", async function() {
      let tokensToBuy = 5;
      let costOfTokens = await this.coToken.buyPrice(tokensToBuy);
      await this.coToken.mint(tokensToBuy, {
        from: buyer1,
        value: costOfTokens
      });

      let expectedReserveRatioValue = expectedReserveRatio(tokensToBuy);
      expectedReserveRatioValue = new BN(
        web3.utils.toWei(expectedReserveRatioValue, "ether")
      ).toString();

      let poolBalance = await web3.eth.getBalance(this.coToken.address);
      let currentPrice = tokenPriceFromSupply(tokensToBuy);
      let tokenSupply = await this.coToken.totalSupply();
      let actualReserveRatio = calcReserveRatio(
        poolBalance,
        currentPrice,
        tokenSupply
      );

      assert.equal(
        actualReserveRatio,
        expectedReserveRatioValue,
        "Curve Reserve ratio not maintained"
      );
    });
  });
  context("Burn functionality", function() {
    it("Calculates cost to sell tokens, burns correct # of ERC20 & returns ETH", async function() {
      let tokensToBuy = 10;
      let costOfTokens = await this.coToken.buyPrice(tokensToBuy);
      await this.coToken.mint(tokensToBuy, {
        from: contractOwner,
        value: costOfTokens
      });

      let tokensToBurn = 5;
      await this.coToken.burn(tokensToBurn, { from: contractOwner });

      let buyerBalance = await this.coToken.balanceOf(contractOwner);
      assert.equal(
        buyerBalance.toNumber(),
        tokensToBuy - tokensToBurn,
        "Buyer ballance did not correctly reduce"
      );
      //get curve contract balance after the burn
      let contractBalanceAfter = await web3.eth.getBalance(
        this.coToken.address
      );

      let expectedTokenBalance = expectedBuyPrice(
        0,
        tokensToBuy - tokensToBurn
      );
      expectedTokenBalance = new BN(
        web3.utils.toWei(expectedTokenBalance, "ether")
      );

      assert.equal(
        contractBalanceAfter.toString(),
        expectedTokenBalance.toString(),
        "Did not correctly store ether balance after mint"
      );
    });
    it("Reverts if not owner", async function() {
      let tokensToBuy = 10;
      let costOfTokens = await this.coToken.buyPrice(tokensToBuy);
      await this.coToken.mint(tokensToBuy, {
        from: buyer1,
        value: costOfTokens
      });

      let tokensToBurn = 2;
      await expectRevert.unspecified(
        this.coToken.burn(tokensToBurn, { from: buyer1 })
      );
    });
    it("Reverts if attempt to burn more tokens than are owned or total supply", async function() {
      let tokensToBuy = 10;
      let costOfTokens = await this.coToken.buyPrice(tokensToBuy);
      await this.coToken.mint(tokensToBuy, {
        from: buyer1,
        value: costOfTokens
      });

      let tokensToBurn = 2;
      await expectRevert.unspecified(
        this.coToken.burn(tokensToBurn, { from: contractOwner })
      );

      costOfTokens = await this.coToken.buyPrice(tokensToBuy);
      await this.coToken.mint(tokensToBuy, {
        from: contractOwner,
        value: costOfTokens
      });

      await expectRevert.unspecified(
        this.coToken.burn(tokensToBuy + tokensToBurn, {
          from: contractOwner
        })
      );
    });
  });
  context("Self destruct functionality", function() {
    it("Correctly self destruct the contract and return all value to owner", async function() {
      let tokensToBuy = 10;
      let costOfTokens = await this.coToken.buyPrice(tokensToBuy);
      await this.coToken.mint(tokensToBuy, {
        from: contractOwner,
        value: costOfTokens
      });

      let ownerBalanceBefore = await web3.eth.getBalance(contractOwner);

      await this.coToken.destroy({ from: contractOwner });

      let ownerBalanceAfter = await web3.eth.getBalance(contractOwner);

      assert(
        ownerBalanceAfter > ownerBalanceBefore,
        "Value was not returned to the owner"
      );

      let contractBalance = await web3.eth.getBalance(this.coToken.address);
      assert.equal(
        contractBalance,
        0,
        "Not all value was removed from the contract"
      );
    });
    it("Reverts if called by not owner", async function() {
      await expectRevert.unspecified(this.coToken.destroy({ from: buyer1 }));
    });
    it("Reverts if there is still outstanding tokens that owner does not have", async function() {
      let tokensToBuy = 10;
      let costOfTokens = await this.coToken.buyPrice(tokensToBuy);
      await this.coToken.mint(tokensToBuy, {
        from: buyer1,
        value: costOfTokens
      });

      await expectRevert.unspecified(
        this.coToken.destroy({ from: contractOwner })
      );
    });
  });
});
