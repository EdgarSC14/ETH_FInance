import { ethers } from "ethers";

/** Per-chain lookback in blocks (~24h of recent history). */
const CHAIN_LOOKBACK_BLOCKS: Record<number, number> = {
  421614: 500_000,  // Arbitrum Sepolia (~0.25s/block → ~35h)
  84532: 43_200,   // Base Sepolia (~2s/block → ~24h)
  534351: 28_800,  // Scroll Sepolia (~3s/block → ~24h)
};
const DEFAULT_LOOKBACK_BLOCKS = 50_000;

/**
 * Some public RPCs (notably Scroll Sepolia) limit eth_getLogs to ~1000 blocks
 * per call. We start with a generous chunk and halve on "Block range is too
 * large" failures until we either succeed or reach a safe floor.
 */
const INITIAL_CHUNK_SIZE = 500_000;
const MIN_CHUNK_SIZE = 800;

export function getLookbackBlocks(chainId: number): number {
  return CHAIN_LOOKBACK_BLOCKS[chainId] ?? DEFAULT_LOOKBACK_BLOCKS;
}

/**
 * Calls `contract.queryFilter(filter, from, to)` chunking the range when the
 * RPC rejects large requests. Returns the combined event list. Errors on
 * specific chunks are logged but never thrown.
 */
export async function queryFilterChunked<T extends ethers.EventLog | ethers.Log>(
  contract: ethers.Contract,
  filter: ethers.DeferredTopicFilter | ethers.ContractEventName,
  fromBlock: number,
  toBlock: number,
): Promise<T[]> {
  const events: T[] = [];
  let chunkSize = INITIAL_CHUNK_SIZE;
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    const end = Math.min(toBlock, cursor + chunkSize - 1);
    try {
      const chunk = (await contract.queryFilter(filter, cursor, end)) as T[];
      events.push(...chunk);
      cursor = end + 1;
    } catch (err) {
      if (chunkSize <= MIN_CHUNK_SIZE) {
        // We've hit the floor — skip this segment to avoid an infinite loop.
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[queryFilterChunked] giving up segment [${cursor}..${end}]`,
            err,
          );
        }
        cursor = end + 1;
        chunkSize = INITIAL_CHUNK_SIZE; // Reset for the next segment
      } else {
        // Halve the chunk and retry the same cursor.
        chunkSize = Math.max(MIN_CHUNK_SIZE, Math.floor(chunkSize / 2));
      }
    }
  }

  return events;
}
