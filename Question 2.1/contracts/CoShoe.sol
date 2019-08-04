pragma solidity^0.5.0;

/// @title CoShoe: digital twin for custom shoes. 
/// @author Chris Maree
/// This contract implements a varient of the ERC721 by leveraging
/// openzepplin as much as posible. Apon deployment 100 coShoes are 
/// created and sent to the owner of the contract. Buy shoe transfers
/// the NFT from the owner to the new buyer. This utalizes the _transfer
/// function from openzepplin's ERC721 implementation to move the actual token.

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
    uint256 public numberOfTokensToMint = 100;

    constructor() public ERC721Metadata("Co Shoe Digital Twin", "SHOE"){     
        for (uint256 i = 0; i < numberOfTokensToMint; i ++){
            uint256 _id = shoes.push(Shoe(msg.sender,"", "", false)) - 1;
            //mint a new erc721 from the ERC721Metadata implementation
            _mint(msg.sender, _id);
        }
    }
    
    function buyShoe(string memory _name, string memory _image) public payable {
        uint256 newShoeId = shoesSold;
        
        require(!shoes[newShoeId].sold, "There are no more shoes on sale");
        require(msg.value == price, "Value of ether sent is less than price of shoe");
        
        //transfer the erc720 to the new owner
        _transferFrom(shoes[newShoeId].owner, msg.sender,newShoeId);
        require(ownerOf(newShoeId) == msg.sender, "NFT token did not transfer correctly");
        
        shoes[newShoeId].owner = msg.sender;
        shoes[newShoeId].name = _name;
        shoes[newShoeId].image = _image;
        shoes[newShoeId].sold = true;
        shoesSold = shoesSold + 1;
    }

    function checkPurchases() public view returns (bool[] memory) {
        // Note that the implementation below only returns an array of length shoesSold. 
        // This means that if a shoe has yet to be sold but is still held by the owner
        // it is not added to this array and not returned. This makes it more gas saving as 
        // all will be false after that point and so returning anything more is redundent.
        bool[] memory _arrayToReturn = new bool[](shoesSold);
        for(uint256 i = 0; i < shoesSold; i ++){
            _arrayToReturn[i] = shoes[i].owner == msg.sender;
        }
        return _arrayToReturn;
    }
}

