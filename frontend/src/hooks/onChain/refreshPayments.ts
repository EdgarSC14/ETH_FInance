import { ScheduledPayment } from "@/types";

export async function refreshOnChainPayments(opts: {
  fetchPayments: () => Promise<ScheduledPayment[]>;
  setPayments: (payments: ScheduledPayment[]) => void;
}): Promise<void> {
  try {
    const onChain = await opts.fetchPayments();
    opts.setPayments(onChain);
  } catch {
    opts.setPayments([]);
  }
}
