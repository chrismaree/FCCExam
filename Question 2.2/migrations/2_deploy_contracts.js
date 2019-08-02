var CoToken = artifacts.require("CoToken");

module.exports = function (deployer) {
    // Deploy the CoToken contract
    deployer.deploy(CoToken);
};