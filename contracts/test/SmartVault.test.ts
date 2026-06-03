import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SmartVault, MockUSDC, GoalManager, PaymentRouter } from "../typechain-types";

describe("AI Financial Layer", () => {
  let vault: SmartVault;
  let usdc: MockUSDC;
  let goalManager: GoalManager;
  let paymentRouter: PaymentRouter;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  const MINT_AMOUNT = ethers.parseUnits("10000", 6);
  const DEPOSIT = ethers.parseUnits("500", 6);

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();

    const Vault = await ethers.getContractFactory("SmartVault");
    vault = await Vault.deploy(await usdc.getAddress(), owner.address);

    const GM = await ethers.getContractFactory("GoalManager");
    goalManager = await GM.deploy(await vault.getAddress(), await usdc.getAddress(), owner.address);

    const PR = await ethers.getContractFactory("PaymentRouter");
    paymentRouter = await PR.deploy(await vault.getAddress(), await usdc.getAddress(), owner.address);

    await vault.setAuthorizedContract(await goalManager.getAddress(), true);
    await vault.setAuthorizedContract(await paymentRouter.getAddress(), true);

    await usdc.mint(alice.address, MINT_AMOUNT);
    await usdc.mint(bob.address, MINT_AMOUNT);
  });

  describe("SmartVault", () => {
    it("accepts USDC deposits and tracks balances", async () => {
      await usdc.connect(alice).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(alice).deposit(DEPOSIT);
      expect(await vault.balances(alice.address)).to.equal(DEPOSIT);
    });

    it("allows withdrawals", async () => {
      await usdc.connect(alice).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(alice).deposit(DEPOSIT);
      const before = await usdc.balanceOf(alice.address);
      await vault.connect(alice).withdraw(DEPOSIT);
      const after = await usdc.balanceOf(alice.address);
      expect(after - before).to.equal(DEPOSIT);
    });

    it("applies allocation rules on deposit", async () => {
      await vault.connect(alice).addAllocationRule(bob.address, 2000, "Savings");
      await usdc.connect(alice).approve(await vault.getAddress(), DEPOSIT);
      await vault.connect(alice).deposit(DEPOSIT);
      const expectedShare = (DEPOSIT * 2000n) / 10000n;
      expect(await usdc.balanceOf(bob.address)).to.equal(MINT_AMOUNT + expectedShare);
    });
  });

  describe("GoalManager", () => {
    it("creates and funds a goal", async () => {
      const target = ethers.parseUnits("1000", 6);
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      await goalManager.connect(alice).createGoal(
        "Emergency Fund", "🛡️", target, deadline, ethers.parseUnits("100", 6)
      );
      const amount = ethers.parseUnits("200", 6);
      await usdc.connect(alice).approve(await goalManager.getAddress(), amount);
      await goalManager.connect(alice).fundGoal(0, amount);
      const goals = await goalManager.getUserGoals(alice.address);
      expect(goals[0].savedAmount).to.equal(amount);
    });
  });
});
