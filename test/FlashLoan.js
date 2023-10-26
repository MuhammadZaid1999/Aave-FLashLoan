const { expect } = require("chai");
const { Wallet } = require('ethers');
const { ethers } = require('hardhat');
const dotenv = require("dotenv");
dotenv.config()

describe("Flash Loan with Aave", async() => {
  
    let SimpleFlashLoan, simpleFlashLoan;
    let addr1, addr2;

    const POLYGON_POOL_PROVIDER = "0x4CeDCB57Af02293231BAA9D39354D6BFDFD251e0";
    const USDC_ADDRESS = "0x52D800ca262522580CeBAD275395ca6e7598C014";
    const USDC_ABI = ["function transfer(address to, uint256 value) external returns (bool)"];
    const USDC_DECIMALS = 6;
    const FLASHLOAN_AMOUNT = ethers.utils.parseUnits("1000", USDC_DECIMALS); 
   
    before(async()=>{
        [addr1, addr2] = await ethers.getSigners();
        
        SimpleFlashLoan = await ethers.getContractFactory("FlashLoan");
        simpleFlashLoan = await SimpleFlashLoan.deploy(POLYGON_POOL_PROVIDER);
        console.log("Flash Loan Contract Address: ", simpleFlashLoan.address);
        
        // Transfer USDC to the FlashLoan contract
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545'); // Connect to the Hardhat Network
        const amount = ethers.utils.parseUnits("5", USDC_DECIMALS); 
        const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
        const deployer = new Wallet(deployerPrivateKey, provider);
        const erc20 = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
        const tx = await erc20.connect(deployer).transfer(simpleFlashLoan.address, amount);
        await tx.wait(1);
    })

    describe("after Deployment", function () {
        it("should return USDC balnce of Flash Loan Contract", async function () {
            const usdcBalance = await simpleFlashLoan.getBalance(USDC_ADDRESS);
            console.log(`USDC balance of the FlashLoan contract is: ${usdcBalance / 1e6} USDC`);
        });
    });

    // ***************** Execute FLASH LOAN ********************* 
    describe("Requesting a flash loan", async function () {
      it("it should success the flash loan request", async function () {
        await expect(simpleFlashLoan.connect(addr1).requestFlashLoan(USDC_ADDRESS, FLASHLOAN_AMOUNT)).not.to.be.reverted;
      });
    });

    
    describe("widthdraw remaining USDC", function () {
        it("should return USDC balnce of Flash Loan Contract", async function () {
            const remainingUSDC = await simpleFlashLoan.getBalance(USDC_ADDRESS);
            console.log(`Remaining ${remainingUSDC / 1e6} USDC from the FlashLoan contract...`);
        });
    
        it("should widthdraw remaining USDC", async function () {
            await expect(simpleFlashLoan.connect(addr1).withdraw(USDC_ADDRESS)).not.to.be.reverted;
        });
    });
   

})