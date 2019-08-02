pragma solidity^0.5.0;

/// @title CoShoeCurve: Bonded token curve used to sell shoes shoes along a token curve
/// @author Chris Maree

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract CoShoeCurve is Ownable, ERC20 {

    string public symbol = "CO";
    string public name = "Co's bonging curve token";

    constructor() public Ownable() ERC20(){}

    function buyPrice(uint256 _n) public view returns (uint256){
        
        return 10;
    }
}