// getVaultList.ts
// SPDX-License-Identifier: MIT

/**
 * This file contains the getter function getVaultList which fetches a list of Morpho vaults
 * from the public GraphQL endpoint exposed by the Morpho API.
 *
 * Users of the HeyAnon integration can call this function to retrieve details about vaults,
 * including asset data, daily APYs, liquidity metrics, and chain information.
 *
 * @module getVaultList
 */

import axios from "axios";

/* ========================================================================
   Type Definitions for Vault Data
   ======================================================================== */

/**
 * Represents the underlying asset information for a vault.
 */
export interface VaultAsset {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

/**
 * Represents an aggregated daily APY value.
 */
export interface DailyApy {
  apy: number;
}

/**
 * Represents liquidity information for a vault.
 */
export interface VaultLiquidity {
  underlying: number;
  usd: number;
}

/**
 * Represents the chain details for the vault.
 */
export interface VaultChain {
  id: number;
  network: string;
  currency: string;
}

/**
 * Represents a vault item as returned by the Morpho GraphQL API.
 */
export interface VaultItem {
  address: string;
  name: string;
  symbol: string;
  whitelisted: boolean;
  asset: VaultAsset;
  dailyApys: DailyApy[];
  warnings: { level: string }[];
  liquidity: VaultLiquidity;
  chain: VaultChain;
}

/**
 * Represents the GraphQL response structure for querying vaults.
 */
export interface VaultResponse {
  vaults: {
    items: VaultItem[];
  };
}

/* ========================================================================
   GraphQL Query
   ======================================================================== */

// Use an environment variable for the GraphQL endpoint; fallback to Morpho's public endpoint if not set.
const GRAPHQL_URL = process.env.MORPHO_GRAPHQL_URL || "https://blue-api.morpho.org/graphql";

// Query to fetch vaults with desired fields.
// You can adjust the requested subfields as needed for your integration.
const VAULTS_QUERY = `
  query FetchVaults($first: Int!, $skip: Int!) {
    vaults(first: $first, skip: $skip) {
      items {
        address
        name
        symbol
        whitelisted
        asset {
          address
          name
          symbol
          decimals
        }
        dailyApys {
          apy
        }
        warnings {
          level
        }
        liquidity {
          underlying
          usd
        }
        chain {
          id
          network
          currency
        }
      }
    }
  }
`;

/* ========================================================================
   Getter Function
   ======================================================================== */

/**
 * Fetches a list of vaults from the Morpho GraphQL endpoint.
 *
 * @param first - The number of vault items to retrieve. Defaults to 1000.
 * @param skip - The number of vault items to skip for pagination. Defaults to 0.
 * @returns A promise that resolves with an array of VaultItem objects.
 * @throws If there is an error with the GraphQL query or response.
 *
 * @example
 * ```typescript
 * getVaultList().then(vaults => {
 *   vaults.forEach(vault => {
 *     console.log(`Vault ${vault.name} (${vault.symbol}) available on chain ${vault.chain.network}`);
 *   });
 * }).catch(err => console.error(err));
 * ```
 */
export async function getVaultList(first: number = 1000, skip: number = 0): Promise<VaultItem[]> {
  try {
    const response = await axios.post<VaultResponse>(
      GRAPHQL_URL,
      {
        query: VAULTS_QUERY,
        variables: { first, skip },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // If the response includes errors, throw an error with details.
    if (response.data.errors && response.data.errors.length > 0) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    // Return the array of vault items from the response data.
    return response.data.data.vaults.items;
  } catch (error) {
    // Provide a descriptive error message.
    throw new Error(`Failed to fetch vault list: ${error instanceof Error ? error.message : String(error)}`);
  }
}
