// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy MockUSDC first
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.deployed();
  console.log("MockUSDC deployed to:", mockUSDC.address);
  
  // Deploy StakingChallenge with the MockUSDC address
  console.log("Deploying StakingChallenge...");
  const StakingChallenge = await hre.ethers.getContractFactory("StakingChallenge");
  const stakingChallenge = await StakingChallenge.deploy(mockUSDC.address);
  await stakingChallenge.deployed();
  console.log("StakingChallenge deployed to:", stakingChallenge.address);
  
  console.log("Deployment complete! Contract addresses:");
  console.log("----------------------------------------");
  console.log("MockUSDC:         ", mockUSDC.address);
  console.log("StakingChallenge: ", stakingChallenge.address);
  console.log("----------------------------------------");
  console.log("Update your .env file with these addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });