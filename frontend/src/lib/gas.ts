import { ethers, Signer } from "ethers";

/** Buffer gas fees to avoid "max fee per gas less than block base fee" on L2s. */
export async function getGasOverrides(signer: Signer): Promise<ethers.TransactionRequest> {
  const provider = signer.provider;
  if (!provider) return {};

  const feeData = await provider.getFeeData();
  if (!feeData.maxFeePerGas) return {};

  const maxFeePerGas = (feeData.maxFeePerGas * BigInt(150)) / BigInt(100);
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
    ? (feeData.maxPriorityFeePerGas * BigInt(150)) / BigInt(100)
    : maxFeePerGas / BigInt(10);

  return { maxFeePerGas, maxPriorityFeePerGas };
}

/** Send a contract tx with fresh EIP-1559 gas overrides. */
export async function sendTx(
  contract: ethers.BaseContract,
  method: string,
  args: unknown[],
  signer: Signer
) {
  const gas = await getGasOverrides(signer);
  const tx = await (contract as ethers.Contract).getFunction(method)(...args, gas);
  return tx.wait();
}
