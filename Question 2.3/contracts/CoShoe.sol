pragma solidity^0.5.0;

/// @title CoShoe: digital twin for custom shoes
/// @author Chris Maree
/// this implementation enables one to buy a CoShoe with a CoToken.

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";
import "./CoToken.sol";

contract CoShoe is ERC721Metadata {

    struct Shoe {
        address owner;
        string name;
        string image;
        bool sold;
    }
    
    Shoe[] public shoes;
    
    uint256 public shoesSold = 0;
    
    // local instance of the CoToken contract used to move the cotokens around when buying/selling
    CoToken public coTokenContract;

    constructor(address _coTokenContractAddress) public ERC721Metadata("Co Shoe Digital Twin", "SHOE"){
        uint256 numberOfTokensToMint = 5;
        for (uint256 i = 0; i < numberOfTokensToMint; i ++){
            uint256 _id = shoes.push(Shoe(msg.sender,"", "", false)) - 1;
            _mint(msg.sender, _id);
        }
        coTokenContract = CoToken(_coTokenContractAddress);
    }
    
    function buyShoe(string memory _name, string memory _image) public {
        uint256 newShoeId = shoesSold;
        
        require(!shoes[newShoeId].sold, "The Shoe has not already been sold");
        require(coTokenContract.balanceOf(msg.sender) >= 1, "Caller does not have enough CoTokens");
        require(coTokenContract.allowance(msg.sender, address(this)) >= 1, "Caller has not granted enough allowance for transfer");
        
        //transfer the single ERC20 CoToken from the sender to the owner of the contract when buying the shoe
        require(coTokenContract.transferFrom(msg.sender, coTokenContract.owner(), 1),"Transfer of CoTokens from sender to owner failed");
        
        //transfer the ERC721 token
        _transferFrom(shoes[newShoeId].owner, msg.sender,newShoeId);
        require(ownerOf(newShoeId) == msg.sender, "NFT token did not transfer correctly");
        
        shoes[newShoeId].owner = msg.sender;
        shoes[newShoeId].name = _name;
        shoes[newShoeId].image = _image;
        shoes[newShoeId].sold = true;
        shoesSold = shoesSold + 1;
    }
    
    function checkPurchases() public view returns (bool[] memory) {
        bool[] memory _arrayToReturn = new bool[](shoesSold);
        for(uint256 i = 0; i < shoesSold; i ++){
            _arrayToReturn[i] = shoes[i].owner == msg.sender;
        }
        return _arrayToReturn;
    }
}



