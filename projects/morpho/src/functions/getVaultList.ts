// src/functions/getVaultList.ts
// SPDX-License-Identifier: MIT

/**
 * getVaultList.ts
 *
 * This file exports the getVaultList function, which fetches a list of Morpho vaults
 * from the Morpho GraphQL API endpoint. The function retrieves details such as vault address,
 * name, symbol, whitelist status, asset details, daily APY, liquidity metrics, warnings, and chain information.
 *
 * Usage:
 * ```typescript
 * import { getVaultList } from './functions/getVaultList';
 *
 * getVaultList().then(vaults => {
 *   vaults.forEach(vault => {
 *     console.log(`Vault: ${vault.name} (${vault.symbol}) on ${vault.chain.network}`);
 *   });
 * }).catch(err => console.error(err));
 * ```
 */

import axios from "axios";

/* ========================================================================
   Type Definitions for GraphQL Response and Vault Data
   ======================================================================== */

/**
 * Represents a GraphQL error.
 */
export interface GraphQLError {
  message: string;
  // Add more fields (extensions, path, etc.) if needed.
}

/**
 * Generic interface for a GraphQL response.
 */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

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
 * Represents the chain details for a vault.
 */
export interface VaultChain {
  id: number;
  network: string;
  currency: string;
}

/**
 * Represents a single vault item as returned by the Morpho GraphQL API.
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
 * This interface represents the expected data portion of the GraphQL response.
 */
export interface VaultResponseData {
  vaults: {
    items: VaultItem[];
  };
}

/* ========================================================================
   GraphQL Query and Constants
   ======================================================================== */

// Use the environment variable if available; otherwise use Morpho's public endpoint.
const GRAPHQL_URL = process.env.MORPHO_GRAPHQL_URL || "https://blue-api.morpho.org/graphql";

// GraphQL query for retrieving vaults.
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
   Getter Function: getVaultList
   ======================================================================== */

/**
 * Fetches a list of vaults from the Morpho GraphQL API endpoint.
 *
 * @param first - (Optional) The number of vault items to retrieve; default is 1000.
 * @param skip  - (Optional) The number of vault items to skip, for pagination; default is 0.
 * @returns A promise that resolves with an array of VaultItem objects.
 * @throws If the GraphQL response contains errors or the HTTP request fails.
 *
 * @example
 * ```typescript
 * getVaultList().then(vaults => {
 *   vaults.forEach(vault => {
 *     console.log(`Vault: ${vault.name} (${vault.symbol}) on ${vault.chain.network}`);
 *   });
 * }).catch(err => console.error(err));
 * ```
 */
export async function getVaultList(first: number = 1000, skip: number = 0): Promise<VaultItem[]> {
  try {
    const response = await axios.post<GraphQLResponse<VaultResponseData>>(
      GRAPHQL_URL,
      {
        query: VAULTS_QUERY,
        variables: { first, skip },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // Check for GraphQL errors in the response
    if (response.data.errors && response.data.errors.length > 0) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    // Ensure that the data exists
    if (!response.data.data) {
      throw new Error("No data returned from the GraphQL API");
    }

    // Return the retrieved vault items
    return response.data.data.vaults.items;
  } catch (error) {
    throw new Error(`Failed to fetch vault list: ${error instanceof Error ? error.message : String(error)}`);
  }
}
