
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

declare const describe: any;
declare const it: any;

describe("DeMarket Ecosystem", function () {
  
  async function deployFixture() {
    const [owner, buyer, seller, arbiter] = await ethers.getSigners();

    // 1. Tokens
    const DeMarketToken = await ethers.getContractFactory("DeMarketToken");
    const dmt = await DeMarketToken.deploy(owner.address);
    
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // 2. Features
    const StakingManager = await ethers.getContractFactory("StakingManager");
    const staking = await StakingManager.deploy(await dmt.getAddress());

    const ArbitrationRegistry = await ethers.getContractFactory("ArbitrationRegistry");
    const arbitration = await ArbitrationRegistry.deploy(await staking.getAddress());

    const ReputationReview = await ethers.getContractFactory("ReputationReview");
    const reputation = await ReputationReview.deploy();

    const DeMarketTreasury = await ethers.getContractFactory("DeMarketTreasury");
    const treasury = await DeMarketTreasury.deploy(0, [], [], owner.address);

    // 3. Marketplace
    const DeMarketMarketplace = await ethers.getContractFactory("DeMarketMarketplace");
    const marketplace = await DeMarketMarketplace.deploy(
      await treasury.getAddress(),
      await dmt.getAddress(),
      await arbitration.getAddress(),
      await reputation.getAddress()
    );

    // 4. Setup
    await marketplace.setAllowedToken(await usdc.getAddress(), true);
    await arbitration.setMarketplace(await marketplace.getAddress());
    await reputation.setMarketplace(await marketplace.getAddress());

    // Mint funds
    await usdc.mint(buyer.address, 1000000000); // 1000 USDC
    await dmt.mint(seller.address, ethers.parseEther("1000"));

    return { dmt, usdc, marketplace, staking, arbitration, reputation, owner, buyer, seller, arbiter };
  }

  it("Should complete a full trade cycle", async function () {
    const { marketplace, usdc, buyer, seller } = await loadFixture(deployFixture);

    // 1. Seller creates listing
    await marketplace.connect(seller).createListing(
      await usdc.getAddress(),
      1000000, // 1 USDC
      1,
      "ipfs://test"
    );

    // 2. Buyer approves USDC
    await usdc.connect(buyer).approve(await marketplace.getAddress(), 1000000);

    // 3. Buyer buys
    await marketplace.connect(buyer).buy(1, 1);

    // Check escrow state
    const escrow = await marketplace.escrows(1);
    expect(escrow.buyer).to.equal(buyer.address);
    expect(escrow.status).to.equal(0); // Funded

    // 4. Confirm receipt
    await marketplace.connect(buyer).confirmReceipt(1);

    // Verify funds moved (seller gets 99% due to fee)
    expect(await usdc.balanceOf(seller.address)).to.equal(990000);
  });
});
