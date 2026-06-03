#!/usr/bin/env node
/**
 * Verifies EIP-55 checksums for canonical USDC + baked-in contract defaults.
 */
import { getAddress } from "ethers";

const addresses = [
  ["Arbitrum Sepolia USDC", "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"],
  ["Base Sepolia USDC", "0x036CbD53842c5426634e7929541eC2318f3dCF7e"],
  ["Scroll Sepolia USDC", "0x2a56d0544C45A59486665a83987C65317367B901"],
  ["Optimism Sepolia USDC", "0x5fD84259D06603f7aA9162260a644DA2997f813A"],
  ["Scroll SmartVault", "0x95Df8D0A9Ff0fcB9D3a5778b7a72E231DAff8aC4"],
  ["Scroll GoalManager", "0x72704695cEE3fbF38EF68Ed5F849A6F4E468Dd33"],
  ["Scroll PaymentRouter", "0xc18d514daA63f7733850121cE02FC995197314d1"],
  ["Scroll ReputationRegistry", "0xa1C7142598Cbd26135544b074D4cee04ddd61002"],
];

let failed = 0;
for (const [label, addr] of addresses) {
  try {
    const normalized = getAddress(addr);
    if (normalized !== addr) {
      console.error(`FAIL ${label}: expected ${addr}, got ${normalized}`);
      failed++;
    } else {
      console.log(`OK   ${label}`);
    }
  } catch (e) {
    console.error(`FAIL ${label}: ${e.message}`);
    failed++;
  }
}

process.exit(failed > 0 ? 1 : 0);
