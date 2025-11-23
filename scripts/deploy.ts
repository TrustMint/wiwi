import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy DeMarketToken ($DMT)
  // ------------------------------------------------
  console.log("1. Deploying DeMarketToken...");
  const DeMarketToken = await ethers.getContractFactory("DeMarketToken");
  const dmt = await DeMarketToken.deploy(deployer.address);
  await dmt.waitForDeployment();
  const dmtAddress = await dmt.getAddress();
  console.log("   - $DMT deployed to:", dmtAddress);

  // 2. Deploy Payment Tokens (Mock or Real)
  // ------------------------------------------------
  let usdcAddress = "";
  let usdtAddress = "";

  if (network.name === "arbitrumOne") {
    // Mainnet Addresses
    usdcAddress = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
    usdtAddress = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
    console.log("   - Using Mainnet USDC/USDT");
  } else {
    // Localhost/Testnet: Deploy Mocks
    console.log("2. Deploying Mock Tokens...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUsdt = await MockUSDT.deploy();
    await mockUsdt.waitForDeployment();
    usdtAddress = await mockUsdt.getAddress();
    console.log("   - MockUSDC deployed to:", usdcAddress);
    console.log("   - MockUSDT deployed to:", usdtAddress);
  }

  // 3. Deploy StakingManager
  // ------------------------------------------------
  console.log("3. Deploying StakingManager...");
  const StakingManager = await ethers.getContractFactory("StakingManager");
  const stakingManager = await StakingManager.deploy(dmtAddress);
  await stakingManager.waitForDeployment();
  const stakingAddress = await stakingManager.getAddress();
  console.log("   - StakingManager deployed to:", stakingAddress);

  // 4. Deploy ArbitrationRegistry
  // ------------------------------------------------
  console.log("4. Deploying ArbitrationRegistry...");
  const ArbitrationRegistry = await ethers.getContractFactory("ArbitrationRegistry");
  const arbitration = await ArbitrationRegistry.deploy(stakingAddress);
  await arbitration.waitForDeployment();
  const arbitrationAddress = await arbitration.getAddress();
  console.log("   - ArbitrationRegistry deployed to:", arbitrationAddress);

  // 5. Deploy ReputationReview
  // ------------------------------------------------
  console.log("5. Deploying ReputationReview...");
  const ReputationReview = await ethers.getContractFactory("ReputationReview");
  const reputation = await ReputationReview.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("   - ReputationReview deployed to:", reputationAddress);

  // 6. Deploy DeMarketTreasury (Timelock)
  // ------------------------------------------------
  console.log("6. Deploying DeMarketTreasury...");
  // Min Delay: 0 for dev, 172800 (2 days) for prod
  const minDelay = network.name === "localhost" ? 0 : 172800; 
  const proposers: string[] = []; // Will be set to DAO later
  const executors = ["0x0000000000000000000000000000000000000000"]; // Anyone
  
  const DeMarketTreasury = await ethers.getContractFactory("DeMarketTreasury");
  const treasury = await DeMarketTreasury.deploy(minDelay, proposers, executors, deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   - DeMarketTreasury deployed to:", treasuryAddress);

  // 7. Deploy DeMarketMarketplace (The Core)
  // ------------------------------------------------
  console.log("7. Deploying DeMarketMarketplace...");
  const DeMarketMarketplace = await ethers.getContractFactory("DeMarketMarketplace");
  const marketplace = await DeMarketMarketplace.deploy(
    treasuryAddress,
    dmtAddress,
    arbitrationAddress,
    reputationAddress
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("   - DeMarketMarketplace deployed to:", marketplaceAddress);

  // 8. Deploy DeMarketSoulbound (SBT)
  // ------------------------------------------------
  console.log("8. Deploying Soulbound Badges...");
  const DeMarketSoulbound = await ethers.getContractFactory("DeMarketSoulbound");
  const soulbound = await DeMarketSoulbound.deploy("ipfs://QmYourMetadataBaseUri/");
  await soulbound.waitForDeployment();
  const soulboundAddress = await soulbound.getAddress();
  console.log("   - DeMarketSoulbound deployed to:", soulboundAddress);

  // 9. Deploy DeMarketDAO
  // ------------------------------------------------
  console.log("9. Deploying DeMarketDAO...");
  const DeMarketDAO = await ethers.getContractFactory("DeMarketDAO");
  const dao = await DeMarketDAO.deploy(dmtAddress, treasuryAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("   - DeMarketDAO deployed to:", daoAddress);

  // =================================================
  //                 POST-DEPLOYMENT SETUP
  // =================================================
  console.log("\n--- Configuring Permissions ---");

  // A. Marketplace Configuration
  // Allow tokens
  await marketplace.setAllowedToken(usdcAddress, true);
  await marketplace.setAllowedToken(usdtAddress, true);
  console.log("   - Tokens whitelisted on Marketplace");

  // B. Link Arbitration -> Marketplace
  // Give Marketplace role to Arbitration contract so it can create disputes
  await arbitration.setMarketplace(marketplaceAddress);
  console.log("   - Linked Arbitration to Marketplace");

  // C. Link Reputation -> Marketplace
  // Give Marketplace role to Reputation contract so it can trigger reviews
  await reputation.setMarketplace(marketplaceAddress);
  console.log("   - Linked Reputation to Marketplace");

  // D. Link Staking -> Marketplace & Arbitration
  // Allow Marketplace to lock stake (for reports)
  await stakingManager.setProtocolRole(marketplaceAddress, true);
  // Allow Arbitration to slash stake
  await stakingManager.setProtocolRole(arbitrationAddress, true);
  console.log("   - Staking permissions granted");

  // E. Link Soulbound -> Marketplace
  // Allow Marketplace to mint badges (e.g., 'First Purchase')
  const MINTER_ROLE = await soulbound.MINTER_ROLE();
  await soulbound.grantRole(MINTER_ROLE, marketplaceAddress);
  console.log("   - Soulbound Minter role granted to Marketplace");

  // F. Treasury & DAO Setup
  const PROPOSER_ROLE = await treasury.PROPOSER_ROLE();
  // const TIMELOCK_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();

  // DAO can propose to Treasury
  await treasury.grantRole(PROPOSER_ROLE, daoAddress);
  
  // (Optional) Revoke deployer admin rights on Treasury for pure decentralization
  // await treasury.renounceRole(TIMELOCK_ADMIN_ROLE, deployer.address);
  console.log("   - Treasury connected to DAO");

  console.log("\nDEPLOYMENT COMPLETE! 🚀");
  console.log("----------------------------------------------------");
  console.table({
    DMT: dmtAddress,
    USDC: usdcAddress,
    USDT: usdtAddress,
    Staking: stakingAddress,
    Arbitration: arbitrationAddress,
    Reputation: reputationAddress,
    Treasury: treasuryAddress,
    Marketplace: marketplaceAddress,
    Soulbound: soulboundAddress,
    DAO: daoAddress
  });
}

main().catch((error) => {
  console.error(error);
  (process as any).exit(1);
});
