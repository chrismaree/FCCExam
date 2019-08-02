var CoShoe = artifacts.require("CoShoe");

module.exports = function (deployer) {
    // Deploy the CoShoe contract
    deployer.deploy(CoShoe);
};