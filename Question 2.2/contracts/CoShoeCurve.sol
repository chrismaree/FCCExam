pragma solidity^0.5.0;

/// @title CoShoeCurve: Bonded token curve used to sell shoes shoes along a token curve
/// @author Chris Maree

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract CoShoeCurve is ERC20Detailed, ERC20, Ownable {

    uint maxTotalSupply = 100;

    constructor() public ERC20Detailed("CoShoe Bonding Curve Token", "CO", 1) ERC20() Ownable(){}

    function getPriceInWei(uint256 x1, uint256 x2) view public returns (uint256){
        require(x1 < x2,"Value of the start must be smaller than value of the end");
        uint256 price = x2 ** 2 - x1 ** 2 + 40 * (x2 - x1);
        return (price * 1 ether)/200;
    }
    
    function buyPrice(uint256 _tokensToBuy) view public returns(uint256) {
        return getPriceInWei(totalSupply(), totalSupply() + _tokensToBuy);
    }
    
    function sellPrice(uint256 _tokensToSell) view public returns(uint256 ){
        return getPriceInWei(totalSupply() - _tokensToSell, totalSupply());
    }
    
    function mint(uint256 _tokensToBuy) public payable{
        require(totalSupply() + _tokensToBuy <= maxTotalSupply, "Can't mint more than maxTotalSupply");
        require(msg.value == buyPrice(_tokensToBuy), "Incorrect value sent to buy requested number of tokens");
        _mint(msg.sender, _tokensToBuy);
    }
    
    function burn(uint256 _tokensToBurn) public onlyOwner {
        require(_tokensToBurn <= totalSupply(), "Can't burn more tokens than current supply");
        msg.sender.send(sellPrice(_tokensToBurn));
        _burn(msg.sender, _tokensToBurn);
    }
    
    function destroy() public onlyOwner {
        selfdestruct(msg.sender);
    }
    
    function contractBalance() public view returns(uint256){
        return address(this).balance;
    }

    
}