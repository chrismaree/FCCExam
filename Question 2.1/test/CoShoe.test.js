// Import all required modules from openzeppelin-test-helpers
const {
  BN,
  constants,
  expectEvent,
  expectRevert
} = require("openzeppelin-test-helpers");
const { expect } = require("chai");

// Contracts
const CoShoe = artifacts.require("./CoShoe.sol");

const validBuyAmount = new BN(web3.utils.toWei("0.5", "ether"));
const invalidBuyAmount = new BN(web3.utils.toWei("0.4", "ether"));
const exampleShoe = { name: "My New Shoe!", image: "Fancy Shoe Image" };

contract("ERC721 Co Shoe Contract", ([contractOwner, buyer1, buyer2, buyer3]) => {
  beforeEach(async function() {
    this.coShoe = await CoShoe.new({ from: contractOwner });
  });

  context("Deployment & initial mint", function() {
    it("Correct contract deployment & naming assignment", async function() {
      let tokenName = await this.coShoe.name();
      assert.equal(tokenName, "Co Shoe Digital Twin", "Token name not set correctly");

      let tokenSymbol = await this.coShoe.symbol();
      assert.equal(tokenSymbol, "SHOE", "Token symbol not set correctly");
    });
    it("Correct NFT minting of 100 tokens", async function() {
      let ownerBallance = await this.coShoe.balanceOf(contractOwner);
      ownerBallance.should.be.bignumber.equal("100");
    });
  });
  context("BuyShoe functionality", function() {
    it("Can Correctly buy shoes & associated token transfer", async function() {
      await this.coShoe.buyShoe(exampleShoe.name, exampleShoe.image, {
        from: buyer1,
        value: validBuyAmount
      });
      let buyer1Balance = await this.coShoe.balanceOf(buyer1);
      buyer1Balance.should.be.bignumber.equal("1");

      let shoeObj = await this.coShoe.shoes(0);
      assert.equal(
        shoeObj.owner,
        buyer1,
        "Buyer not set correctly on new shoe"
      );
      assert.equal(
        shoeObj.name,
        exampleShoe.name,
        "Shoe name not set correctly"
      );
      assert.equal(
        shoeObj.image,
        exampleShoe.image,
        "Shoe image not set correctly"
      );
    });
    it("Correctly reverts if incorrect value of sent", async function() {
      await expectRevert.unspecified(
        this.coShoe.buyShoe(exampleShoe.name, exampleShoe.image, {
          from: buyer1,
          value: invalidBuyAmount
        }),
        "Did not correctly revert with invalid buy amount for shoe"
      );
    });
  });
  context("Check Purchases functionality", function() {
    it("Correctly returns array of purchases", async function() {
      //buy 2 shoes for buyer1 and 1 shoe for buyer2

      await this.coShoe.buyShoe(exampleShoe.name, exampleShoe.image, {
        from: buyer1,
        value: validBuyAmount
      });
      await this.coShoe.buyShoe(exampleShoe.name, exampleShoe.image, {
        from: buyer2,
        value: validBuyAmount
      });
      await this.coShoe.buyShoe(exampleShoe.name, exampleShoe.image, {
        from: buyer1,
        value: validBuyAmount
      });

      let checkPurchasesBuyer1 = await this.coShoe.checkPurchases({
        from: buyer1
      });
      let expectedCheckPurchasesBuyer1 = [true, false, true];
      assert.deepEqual(
        checkPurchasesBuyer1,
        expectedCheckPurchasesBuyer1,
        "Check purchases for buyer 1 is incorrect"
      );

      let checkPurchasesBuyer2 = await this.coShoe.checkPurchases({
        from: buyer2
      });
      let expectedCheckPurchasesBuyer2 = [false, true, false];
      assert.deepEqual(
        checkPurchasesBuyer2,
        expectedCheckPurchasesBuyer2,
        "Check purchases for buyer 1 is incorrect"
      );

      let checkPurchasesBuyer3 = await this.coShoe.checkPurchases({
        from: buyer3
      });
      let expectedCheckPurchasesBuyer3 = [false, false, false];
      assert.deepEqual(
        checkPurchasesBuyer3,
        expectedCheckPurchasesBuyer3,
        "Check purchases for buyer 1 is incorrect"
      );
    });
  });
});