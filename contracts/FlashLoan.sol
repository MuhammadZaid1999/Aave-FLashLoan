// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

contract FlashLoan is FlashLoanSimpleReceiverBase {
    address payable public owner;

    constructor(address _addressProvider)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
    {
        owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "You are not the owner!"
        );
        _;
    }

    receive() external payable {}


    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {

        // This function is called by the Aave lending pool contract after this contract receives the flash loan.
        
        /** OUR CUSTOM LOGIC HERE */

        // Approve the lending pool contract to pull funds from this contract to pay back the flash loan.
        
        uint256 amountOwed = amount + premium;
        IERC20(asset).approve(address(POOL), amountOwed);

        return true; // Return true to indicate that the flash loan has been repaid.
    }

    function requestFlashLoan(address _token, uint256 _amount) public onlyOwner {
        address receiverAddress = address(this); 
        address asset = _token; 
        uint256 amount = _amount; 
        bytes memory params = "";
        uint16 referralCode = 0; 

        // Call the Aave lending pool contract to initiate the flash loan.
        POOL.flashLoanSimple(
            receiverAddress,
            asset,
            amount,
            params,
            referralCode
        );
    }

    function getBalance(address _tokenAddress) external view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function withdraw(address _tokenAddress) external onlyOwner {
        IERC20 token = IERC20(_tokenAddress);                           
        token.transfer(msg.sender, token.balanceOf(address(this))); 
    }

}