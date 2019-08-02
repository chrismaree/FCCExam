var CoShoeCurve = artifacts.require("CoShoeCurve");

module.exports = function (deployer) {
    // Deploy the CoShoeCurve contract
    deployer.deploy(CoShoeCurve);
};