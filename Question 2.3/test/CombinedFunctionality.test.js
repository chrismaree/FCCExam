// Tests do no re-test the functionality already checked.
// Only the integration between the two contracts is checked

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
const CoShoe = artifacts.require("./CoShoe.sol");

contract("Combined functionality", ([contractOwner, buyer1]) => {
  beforeEach(async function() {
    this.coToken = await CoToken.new({ from: contractOwner });

    this.coShoe = await CoShoe.new(this.coToken.address, {
      from: contractOwner
    });
  });
  context("Deployment", function() {
    it("Can Correctly deploy contract and set constructor for new CoToken", async function() {
      let coTokenContract = await this.coShoe.coTokenContract();
      assert.equal(
        coTokenContract,
        this.coToken.address,
        "CoToken not initalized correctly"
      );
    });
  });
  context("Can correctly buy CoShoe with CoToken", function() {
    it("Transfers CoToken and receives CoShoe", async function() {
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

      await this.coToken.approve(this.coShoe.address, 10, { from: buyer1 });

      await this.coShoe.buyShoe("Shoe name", "Shoe Image!", { from: buyer1 });

      let buyerERC20Balance = await this.coToken.balanceOf(buyer1);
      assert.equal(
        buyerERC20Balance.toNumber(),
        tokensToBuy - 1,
        "Did not correctly transfer ERC20 token from buyer"
      );

      let buyerERC721Balance = await this.coShoe.balanceOf(buyer1);
      assert.equal(
        buyerERC721Balance.toNumber(),
        1,
        "Did not correctly transfer ERC721 token to buyer"
      );

      let ownerERC20Balance = await this.coToken.balanceOf(contractOwner);
      assert.equal(
        ownerERC20Balance.toNumber(),
        1,
        "Did not correctly transfer ERC20 token to owner"
      );

      let ownerERC721Balance = await this.coShoe.balanceOf(contractOwner);
      assert.equal(
        ownerERC721Balance.toNumber(),
        4,
        "Did not correctly transfer ERC721 token from owner"
      );
    });
    it("Reverts if incorrect allowance or balance of user in CoToken", async function() {
      await expectRevert.unspecified(
        this.coShoe.buyShoe("Shoe name", "Shoe Image!", { from: buyer1 })
      );
    });
  });
});
