pragma solidity^0.5.0;

/// @title CoToken: Bonded token curve used to sell shoes shoes along a token curve
/// @author Chris Maree
/// This contract implements a bonding curve with the equation f(x) = 0.01x + 0.2
/// the function get PriceInWei is used to calculate the change in area between a 
/// defined start and end of the curve. This was found by taking the intergral of f(x)
/// and then finding the diffrence between the value at x2 and x1 like evaluating a definate intergral.
/// This ultimatly is the same as using a reserve
/// ratio in the same way that bancor implements their curves.
/// Numerically, this was checked using wolframalpha to ensure that the number of tokens
/// minted at each point in time is correct given the total outstanding suply.

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract CoToken is ERC20Detailed, ERC20, Ownable {

    uint maxTotalSupply = 100;

    constructor() public ERC20Detailed("CoShoe Bonding Curve Token", "CO", 1) ERC20() Ownable(){}

    // the equation below calculates the change in area by shifting the graph from x1
    // to x2. this is scaled by 200 to remove the coefficent thereby removing the
    // need to deal with decimals. the value returned is the number of wei needed
    // to take the supply of tokens from x1 to x2. This function can be used for
    // both buying or selling by simply adding the nunmber of tokens one wants to buy
    // to the end (for buying) or subtracting from the start(for selling). this can be
    // seen in the functions buy price and sell price that follow.
    function getPriceInWei(uint256 x1, uint256 x2) public pure returns (uint256){
        require(x1 < x2,"Value of the start must be smaller than value of the end");
        uint256 price = x2 ** 2 - x1 ** 2 + 40 * (x2 - x1);
        return (price * 1 ether)/200;
    }
    
    function buyPrice(uint256 _tokensToBuy) public view returns(uint256) {
        return getPriceInWei(totalSupply(), totalSupply() + _tokensToBuy);
    }
    
    function sellPrice(uint256 _tokensToSell) public view returns(uint256 ){
        return getPriceInWei(totalSupply() - _tokensToSell, totalSupply());
    }
    
    function mint(uint256 _tokensToBuy) public payable{
        require(totalSupply() + _tokensToBuy <= maxTotalSupply, "Can't mint more than maxTotalSupply");
        require(msg.value == buyPrice(_tokensToBuy), "Incorrect value sent to buy requested number of tokens");
        // appon mint create the new ERC20 token for the sender
        _mint(msg.sender, _tokensToBuy);
    }
    
    function burn(uint256 _tokensToBurn) public onlyOwner {
        require(_tokensToBurn <= totalSupply(), "Can't burn more tokens than current supply");
        msg.sender.transfer(sellPrice(_tokensToBurn));
        // apon burn remove the erc20 token from the senders account
        _burn(msg.sender, _tokensToBurn);
    }
    
    function contractBalance() public view returns(uint256){
        return address(this).balance;
    }

    function destroy() public onlyOwner {
        require(balanceOf(owner()) == totalSupply(), "Some tokens are still owned by users other than the owner");
        selfdestruct(msg.sender);
    }
}