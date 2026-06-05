import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { es } from "@/lib/i18n/es";
import { Transaction } from "@/types";
import { getLookbackBlocks, queryFilterChunked } from "@/hooks/onChain/queryFilterChunked";

const VAULT_EVENTS_ABI = [
  "event Deposited(address indexed user, uint256 amount, uint256 timestamp)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 timestamp)",
];

const GOAL_EVENTS_ABI = [
  "event GoalFunded(uint256 indexed goalId, address indexed funder, uint256 amount, uint256 newTotal)",
];

const PAYMENT_ROUTER_ABI = [
  "event PaymentExecuted(uint256 indexed paymentId, address indexed recipient, uint256 amount, uint256 executionCount)",
  "function getUserPayments(address _user) external view returns (tuple(uint256 id, address owner, address recipient, uint256 amount, uint8 frequency, uint256 nextExecutionTime, uint256 timeLockEnd, string label, bool active, uint256 executionCount, uint256 maxExecutions)[])",
];

type RawPayment = { id: bigint; label: string };

function eventTimestamp(ts: bigint, blockTime?: number): string {
  const n = Number(ts);
  if (n > 0) {
    const ms = n > 1e12 ? n : n * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (blockTime) return new Date(blockTime * 1000).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export async function refreshOnChainTransactions(opts: {
  provider: ethers.Provider;
  address: string;
  chainId: number;
  setTransactions: (txs: Transaction[]) => void;
}): Promise<void> {
  const { provider, address, chainId, setTransactions } = opts;
  const cfg = CONTRACT_ADDRESSES[chainId];
  if (!cfg) return;

  try {
    const txs: Transaction[] = [];
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - getLookbackBlocks(chainId));

    if (cfg.smartVault?.trim()) {
      const vault = new ethers.Contract(cfg.smartVault, VAULT_EVENTS_ABI, provider);
      const [deposits, withdraws] = await Promise.all([
        queryFilterChunked<ethers.EventLog>(vault, vault.filters.Deposited(address), fromBlock, currentBlock),
        queryFilterChunked<ethers.EventLog>(vault, vault.filters.Withdrawn(address), fromBlock, currentBlock),
      ]);

      for (const ev of deposits) {
        if (!("args" in ev) || !ev.args) continue;
        const block = ev.blockNumber != null ? await provider.getBlock(ev.blockNumber) : null;
        txs.push({
          id: `chain-vault-dep-${ev.transactionHash}-${ev.index}`,
          type: "income",
          category: es.tx.categoryVault,
          amount: Number(ethers.formatUnits(ev.args.amount, 6)),
          description: es.tx.depositDesc,
          date: eventTimestamp(ev.args.timestamp, block?.timestamp),
          hash: ev.transactionHash,
        });
      }

      for (const ev of withdraws) {
        if (!("args" in ev) || !ev.args) continue;
        const block = ev.blockNumber != null ? await provider.getBlock(ev.blockNumber) : null;
        txs.push({
          id: `chain-vault-wd-${ev.transactionHash}-${ev.index}`,
          type: "transfer",
          category: es.tx.categoryWithdraw,
          amount: Number(ethers.formatUnits(ev.args.amount, 6)),
          description: es.tx.withdrawDesc,
          date: eventTimestamp(ev.args.timestamp, block?.timestamp),
          hash: ev.transactionHash,
        });
      }
    }

    if (cfg.goalManager?.trim()) {
      const goalManager = new ethers.Contract(cfg.goalManager, GOAL_EVENTS_ABI, provider);
      const funded = await queryFilterChunked<ethers.EventLog>(
        goalManager,
        goalManager.filters.GoalFunded(null, address),
        fromBlock,
        currentBlock,
      );

      for (const ev of funded) {
        if (!("args" in ev) || !ev.args) continue;
        const block = ev.blockNumber != null ? await provider.getBlock(ev.blockNumber) : null;
        txs.push({
          id: `chain-goal-${ev.transactionHash}-${ev.index}`,
          type: "expense",
          category: es.tx.categoryGoal,
          amount: Number(ethers.formatUnits(ev.args.amount, 6)),
          description: es.tx.goalContribution(ev.args.goalId.toString()),
          date: block ? new Date(block.timestamp * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          hash: ev.transactionHash,
        });
      }
    }

    if (cfg.paymentRouter?.trim()) {
      const router = new ethers.Contract(cfg.paymentRouter, PAYMENT_ROUTER_ABI, provider);
      const rawPayments = (await router.getUserPayments(address)) as RawPayment[];
      const labelById = new Map(rawPayments.map((p) => [p.id.toString(), p.label]));

      for (const payment of rawPayments) {
        const executed = await queryFilterChunked<ethers.EventLog>(
          router,
          router.filters.PaymentExecuted(payment.id),
          fromBlock,
          currentBlock,
        );
        for (const ev of executed) {
          if (!("args" in ev) || !ev.args) continue;
          const block = ev.blockNumber != null ? await provider.getBlock(ev.blockNumber) : null;
          const label = labelById.get(ev.args.paymentId.toString()) || es.tx.defaultPaymentLabel;
          txs.push({
            id: `chain-pay-${ev.transactionHash}-${ev.index}`,
            type: "expense",
            category: es.tx.categoryPayment,
            amount: Number(ethers.formatUnits(ev.args.amount, 6)),
            description: es.tx.paymentExecution(label, ev.args.executionCount.toString()),
            date: block ? new Date(block.timestamp * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            hash: ev.transactionHash,
          });
        }
      }
    }

    txs.sort((a, b) => b.date.localeCompare(a.date) || (b.hash ?? "").localeCompare(a.hash ?? ""));
    setTransactions(txs);
  } catch (err) {
    // Keep existing list on RPC errors but surface for debugging.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[refreshOnChainTransactions] failed", err);
    }
  }
}
