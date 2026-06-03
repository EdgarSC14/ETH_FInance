import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import {
  NETWORKS,
  resolveNetworkKey,
  resolveUsdcAddress,
  type NetworkKey,
} from "./networks";
import { checksumAddress } from "./checksum";

export interface DeploymentAddresses {
  network: string;
  chainId: number;
  deployer: string;
  deployedAt: string;
  usdc: string;
  smartVault: string;
  goalManager: string;
  paymentRouter: string;
  reputationRegistry: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkKey = resolveNetworkKey(network.name);
  const netMeta = networkKey ? NETWORKS[networkKey] : null;
  const chainId = netMeta?.chainId ?? (await ethers.provider.getNetwork()).chainId;

  console.log("Network:", network.name);
  console.log("Chain ID:", chainId.toString());
  console.log("Deployer:", deployer.address);

  let usdcAddress = networkKey ? resolveUsdcAddress(networkKey) : process.env.USDC_ADDRESS?.trim() || "";

  if (!usdcAddress) {
    console.log("Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log("MockUSDC:", usdcAddress);
  } else {
    console.log("Using USDC:", usdcAddress);
  }

  console.log("Deploying SmartVault...");
  const SmartVault = await ethers.getContractFactory("SmartVault");
  const vault = await SmartVault.deploy(usdcAddress, deployer.address);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("SmartVault:", vaultAddr);

  console.log("Deploying GoalManager...");
  const GoalManager = await ethers.getContractFactory("GoalManager");
  const goalManager = await GoalManager.deploy(vaultAddr, usdcAddress, deployer.address);
  await goalManager.waitForDeployment();
  const goalAddr = await goalManager.getAddress();
  console.log("GoalManager:", goalAddr);

  console.log("Deploying PaymentRouter...");
  const PaymentRouter = await ethers.getContractFactory("PaymentRouter");
  const router = await PaymentRouter.deploy(vaultAddr, usdcAddress, deployer.address);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("PaymentRouter:", routerAddr);

  console.log("Deploying ReputationRegistry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
  const reputation = await ReputationRegistry.deploy(deployer.address);
  await reputation.waitForDeployment();
  const reputationAddr = await reputation.getAddress();
  console.log("ReputationRegistry:", reputationAddr);

  console.log("Authorizing modules on SmartVault...");
  await (await vault.setAuthorizedContract(goalAddr, true)).wait();
  await (await vault.setAuthorizedContract(routerAddr, true)).wait();

  console.log("Authorizing recorders on ReputationRegistry...");
  await (await reputation.setAuthorizedRecorder(goalAddr, true)).wait();
  await (await reputation.setAuthorizedRecorder(routerAddr, true)).wait();
  await (await reputation.setAuthorizedRecorder(vaultAddr, true)).wait();

  const payload: DeploymentAddresses = {
    network: network.name,
    chainId: Number(chainId),
    deployer: checksumAddress(deployer.address),
    deployedAt: new Date().toISOString(),
    usdc: checksumAddress(usdcAddress),
    smartVault: checksumAddress(vaultAddr),
    goalManager: checksumAddress(goalAddr),
    paymentRouter: checksumAddress(routerAddr),
    reputationRegistry: checksumAddress(reputationAddr),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));

  console.log("\n=== Deployment Complete ===");
  console.log(JSON.stringify(payload, null, 2));
  console.log("\nSaved to:", outFile);

  if (netMeta?.explorer) {
    console.log("\nExplorer (SmartVault):", `${netMeta.explorer}/address/${vaultAddr}`);
  }

  printFrontendEnv(networkKey, payload);
}

function printFrontendEnv(networkKey: NetworkKey | null, d: DeploymentAddresses) {
  if (!networkKey || networkKey === "hardhat" || networkKey === "localhost") return;

  const prefix = envPrefixForNetwork(networkKey);
  console.log("\n--- Frontend .env.local (copy) ---");
  console.log(`NEXT_PUBLIC_VAULT_${prefix}=${checksumAddress(d.smartVault)}`);
  console.log(`NEXT_PUBLIC_GOAL_MANAGER_${prefix}=${checksumAddress(d.goalManager)}`);
  console.log(`NEXT_PUBLIC_PAYMENT_ROUTER_${prefix}=${checksumAddress(d.paymentRouter)}`);
  console.log(`NEXT_PUBLIC_REPUTATION_${prefix}=${checksumAddress(d.reputationRegistry)}`);
}

function envPrefixForNetwork(key: NetworkKey): string {
  const map: Record<NetworkKey, string> = {
    hardhat: "LOCAL",
    localhost: "LOCAL",
    arbitrumSepolia: "ARBITRUM_SEPOLIA",
    baseSepolia: "BASE_SEPOLIA",
    scrollSepolia: "SCROLL_SEPOLIA",
  };
  return map[key];
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
