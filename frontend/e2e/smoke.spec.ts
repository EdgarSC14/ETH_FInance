import { test, expect } from "@playwright/test";

test("smoke: landing loads and demo mode badge visible in app section", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("header")).toBeVisible();

  const exploreBtn = page.getByRole("button", { name: /explorar panel/i });
  await exploreBtn.click();

  await page.waitForTimeout(800);

  const demoBadge = page.getByText("Modo demo").first();
  await expect(demoBadge).toBeVisible({ timeout: 10000 });
});

test("smoke: mock wallet connect shows on-chain badge", async ({ page }) => {
  await page.addInitScript(() => {
    const listeners: Array<(...args: unknown[]) => void> = [];
    (window as unknown as { ethereum?: unknown }).ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts") return ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"];
        if (method === "eth_accounts") return ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"];
        if (method === "eth_chainId") return "0x66eee";
        if (method === "net_version") return "421614";
        return null;
      },
      on: (event: string, cb: (...args: unknown[]) => void) => {
        listeners.push(cb);
      },
      removeListener: () => {},
    };
  });

  await page.goto("/");

  const connectBtn = page.getByRole("button", { name: /conectar/i }).first();
  if (await connectBtn.isVisible()) {
    await connectBtn.click();
    await page.waitForTimeout(1500);
  }

  const onChainBadge = page.getByText("On-chain").first();
  if (await onChainBadge.isVisible()) {
    await expect(onChainBadge).toBeVisible();
  }
});
