const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EthioSocial to Sepolia...");
  console.log("📡 Deployer address:", "0xf1229D61ab3Bb4AF06396F65a1C2Bd456ec2941a");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("✅ Signer address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH");

  const EthioSocial = await hre.ethers.getContractFactory("EthioSocial");
  const ethioSocial = await EthioSocial.deploy();

  await ethioSocial.waitForDeployment();
  
  const contractAddress = await ethioSocial.getAddress();
  console.log("\n✅ EthioSocial deployed!");
  console.log("📝 Contract Address:", contractAddress);
  console.log("🔗 View:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  
  // Save address to file
  const fs = require("fs");
  fs.writeFileSync("deployed-address.txt", contractAddress);
  console.log("\n💾 Address saved to deployed-address.txt");
  
  console.log("\n📋 Update your frontend .env file:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_PINATA_JWT=TObJbwaAvfOIKXR8cNgeD`);
  
  // Verify on Etherscan
  console.log("\n🔍 Verifying on Etherscan...");
  console.log(`Run: npx hardhat verify --network sepolia ${contractAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
