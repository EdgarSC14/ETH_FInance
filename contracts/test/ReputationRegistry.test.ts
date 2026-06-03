import { expect } from "chai";
import { ethers } from "hardhat";

describe("ReputationRegistry", function () {
  it("records score for authorized recorder", async function () {
    const [owner, user, stranger] = await ethers.getSigners();

    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    const registry = await ReputationRegistry.deploy(owner.address);
    await registry.waitForDeployment();

    await registry.connect(owner).setAuthorizedRecorder(stranger.address, true);
    await registry.connect(stranger).recordAction(user.address, 1, 10);

    expect(await registry.getScore(user.address)).to.equal(10n);
  });

  it("rejects unauthorized recorder", async function () {
    const [owner, user, stranger] = await ethers.getSigners();
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    const registry = await ReputationRegistry.deploy(owner.address);
    await registry.waitForDeployment();

    try {
      await registry.connect(stranger).recordAction(user.address, 0, 5);
      expect.fail("expected revert");
    } catch (err) {
      expect(String(err)).to.include("not authorized");
    }
  });
});
