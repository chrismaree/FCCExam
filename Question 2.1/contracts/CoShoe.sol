pragma solidity^0.5.0;

/// @title CoShoe: digital twin for custom shoes
/// @author Chris Maree

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";
contract CoShoe is ERC721Metadata {

    struct Shoe {
        address owner;
        string name;
        string image;
        bool sold;
    }
    
    Shoe[] public shoes;
    
    uint256 public price = 0.5 ether;
    uint256 public shoesSold = 0;

    constructor() public ERC721Metadata("Co Shoe Digital Twin", "SHOE"){
        uint256 numberOfTokensToMint = 5;
        for (uint256 i = 0; i < numberOfTokensToMint; i ++){
            uint256 _id = shoes.push(Shoe(msg.sender,"", "", false)) - 1;
            _mint(msg.sender, _id);
        }
    }
    
    function buyShoe(string memory _name, string memory _image) public payable {
        uint256 newShoeId = shoesSold;
        
        require(!shoes[newShoeId].sold, "There are no more shoes on sale");
        require(msg.value == price, "Value of ether sent is less than price of shoe");
        
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

