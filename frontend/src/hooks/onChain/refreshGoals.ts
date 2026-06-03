import { Goal } from "@/types";

export async function refreshOnChainGoals(opts: {
  fetchGoals: () => Promise<Goal[]>;
  setGoals: (goals: Goal[]) => void;
}): Promise<void> {
  try {
    const onChain = await opts.fetchGoals();
    opts.setGoals(onChain);
  } catch {
    opts.setGoals([]);
  }
}
