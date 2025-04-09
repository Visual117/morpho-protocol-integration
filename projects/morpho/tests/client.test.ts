// tests/client.test.ts
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { getVaultList } from "../src/functions/getVaultList";

// Use the same GraphQL URL as in the getVaultList.ts file.
const GRAPHQL_URL = process.env.MORPHO_GRAPHQL_URL || "https://blue-api.morpho.org/graphql";

describe("getVaultList", () => {
  let mock: AxiosMockAdapter;

  beforeAll(() => {
    // Create a new Axios mock adapter instance for axios.
    mock = new AxiosMockAdapter(axios);
  });

  afterEach(() => {
    // Reset the mock after each test.
    mock.reset();
  });

  afterAll(() => {
    // Restore axios to its original state.
    mock.restore();
  });

  test("should successfully fetch vaults", async () => {
    const sampleResponse = {
      data: {
        vaults: {
          items: [
            {
              address: "0xVaultAddress1",
              name: "Vault One",
              symbol: "VLT1",
              whitelisted: true,
              asset: {
                address: "0xAssetAddress1",
                name: "Asset One",
                symbol: "AST1",
                decimals: 18,
              },
              dailyApys: [{ apy: 123 }],
              warnings: [{ level: "low" }],
              liquidity: { underlying: 100, usd: 1000 },
              chain: { id: 1, network: "Ethereum", currency: "ETH" },
            },
          ],
        },
      },
    };

    // Mock the POST request to the correct GraphQL URL.
    mock.onPost(GRAPHQL_URL).reply(200, sampleResponse);

    const vaults = await getVaultList(100, 0);
    expect(vaults).toBeDefined();
    expect(vaults.length).toBe(1);
    expect(vaults[0].name).toBe("Vault One");
  });

  test("should throw error on GraphQL error", async () => {
    const sampleErrorResponse = {
      errors: [{ message: "Something went wrong" }],
    };

    // Mock the POST request to the correct URL to return an error response.
    mock.onPost(GRAPHQL_URL).reply(200, sampleErrorResponse);

    await expect(getVaultList(100, 0)).rejects.toThrow("Something went wrong");
  });
});
