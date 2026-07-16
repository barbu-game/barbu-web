import { test, expect } from "../fixtures";
import { HomePage } from "../pages/HomePage";
import { LobbyPage } from "../pages/LobbyPage";
import { register, seedAuth, uniqueName } from "../helpers/api";

test("a second player joins the table by code", async ({ twoClients }) => {
  const { a, b } = twoClients;
  const homeA = new HomePage(a);
  await homeA.goto();
  await homeA.setName("Host");
  await homeA.setPlayerCount(3);
  await homeA.createTable();

  const lobbyA = new LobbyPage(a);
  const code = await lobbyA.roomCode();

  const homeB = new HomePage(b);
  await homeB.goto();
  await homeB.setName("Guest");
  await homeB.joinByCode(code);

  const lobbyB = new LobbyPage(b);
  expect(await lobbyB.roomCode()).toBe(code);
  await expect.poll(async () => lobbyA.seatCount()).toBeGreaterThanOrEqual(3);
});

test("quick match pairs two players into the same room", async ({ twoClients }) => {
  const { a, b } = twoClients;
  for (const [p, name] of [
    [a, "Q1"],
    [b, "Q2"],
  ] as const) {
    const home = new HomePage(p);
    await home.goto();
    await home.setName(name);
    await home.setPlayerCount(2);
    await home.quickMatch();
  }
  // With 2 players the room fills with humans; both leave the Home for a shared code.
  const codeA = (await a.getByTestId("room-code").innerText()).trim();
  await expect
    .poll(async () => b.getByTestId("room-code").innerText().catch(() => ""))
    .toBe(codeA);
});

test("when the host leaves, the other human becomes host", async ({ twoClients }) => {
  const { a, b } = twoClients;
  const homeA = new HomePage(a);
  await homeA.goto();
  await homeA.setName("Host");
  await homeA.setPlayerCount(3);
  await homeA.createTable();
  const code = await new LobbyPage(a).roomCode();

  const homeB = new HomePage(b);
  await homeB.goto();
  await homeB.setName("Guest");
  await homeB.joinByCode(code);
  await expect(b.getByTestId("room-code")).toHaveText(code);

  await new LobbyPage(a).leave();
  // B (lowest remaining human seat) inherits the host controls.
  await expect.poll(async () => new LobbyPage(b).hasHostControls()).toBe(true);
});

test("ranked match pairs two accounts", async ({ browser, request }) => {
  const a1 = await register(request, uniqueName("rk"), "pw-123456");
  const a2 = await register(request, uniqueName("rk"), "pw-123456");
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  await seedAuth(ctxA, a1);
  await seedAuth(ctxB, a2);
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();

  for (const p of [a, b]) {
    const home = new HomePage(p);
    await home.goto();
    await p.getByTestId("ranked-match").click();
  }
  const codeA = (await a.getByTestId("room-code").innerText()).trim();
  await expect
    .poll(async () => b.getByTestId("room-code").innerText().catch(() => ""))
    .toBe(codeA);

  await ctxA.close();
  await ctxB.close();
});

test("the host adds a bot and sees an occupied seat", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await home.setName("Host");
  await home.setPlayerCount(2);
  await home.createTable();
  const lobby = new LobbyPage(page);
  await page.getByTestId("add-bot").click();
  await expect.poll(async () => lobby.seatCount()).toBe(2);
});
