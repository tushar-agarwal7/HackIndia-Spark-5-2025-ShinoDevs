// scripts/mint-usdc.js
const hre = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  
  // Replace with your deployed MockUSDC address
  const mockUSDCAddress = process.env.USDC_CONTRACT_ADDRESS;
  
  if (!mockUSDCAddress) {
    console.error("Please set USDC_CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }
  
  console.log("Minting USDC to:", signerAddress);
  
  // Get contract instance
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.attach(mockUSDCAddress);
  
  // Mint 1000 USDC to your wallet
  const amount = ethers.utils.parseUnits("1000", 6); // 1000 USDC with 6 decimals
  
  // Check current balance
  const balanceBefore = await mockUSDC.balanceOf(signerAddress);
  console.log(`Current USDC balance: ${ethers.utils.formatUnits(balanceBefore, 6)} USDC`);
  
  // Mint tokens
  console.log(`Minting ${ethers.utils.formatUnits(amount, 6)} USDC...`);
  const tx = await mockUSDC.mint(signerAddress, amount);
  console.log("Transaction submitted:", tx.hash);
  
  // Wait for transaction confirmation
  await tx.wait();
  console.log("Transaction confirmed!");
  
  // Check updated balance
  const balanceAfter = await mockUSDC.balanceOf(signerAddress);
  console.log(`New USDC balance: ${ethers.utils.formatUnits(balanceAfter, 6)} USDC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });