// contracts/MockUSDC.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint8 private _decimals = 6; // USDC uses 6 decimals
    
    constructor() ERC20("USDC Test Token", "USDC") {
        // Mint 1 million USDC to deployer
        _mint(msg.sender, 1000000 * 10**_decimals);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    // For testing - anyone can mint tokens
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}