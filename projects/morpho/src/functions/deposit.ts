// SPDX-License-Identifier: MIT
/**
 * @module deposit
 * @description Contains the deposit function which calls Morpho.sol's supply function.
 *
 * Users call this function to deposit a specific asset amount into a selected vault.
 * The function constructs a transaction using ethers.js and sends it to the Morpho contract.
 */

import { ethers } from "ethers";

// Import the Morpho.sol ABI (ensure that the path matches your project structure)
import MorphoABI from "../abis/Morpho.json";

// Environment variable for the deployed Morpho.sol contract address.
const MORPHO_CONTRACT_ADDRESS = process.env.MORPHO_CONTRACT_ADDRESS || "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

// ========================================================================
// Type Definitions
// ========================================================================

/**
 * Defines the structure of the market parameters.
 * This type should match the struct expected by the supply function on Morpho.sol.
 */
export interface MarketParamsInput {
  loanToken: string;
  collateralToken: string;
  oracle: string;
  irm: string;
  lltv: ethers.BigNumber; // scaled value (usually in WAD)
  // Depending on your needs, add other fields or helper methods (e.g., id())
  id: string; // The computed market id, if you plan to use it directly.
}

/**
 * Options to deposit into a vault.
 */
export interface DepositOptions {
  marketParams: MarketParamsInput;
  /**
   * The amount of assets (in the token's smallest unit) to deposit.
   */
  depositAmount: ethers.BigNumber;
  /**
   * Optional: if depositing on behalf of a different address. Otherwise, the signer's address will be used.
   */
  onBehalf?: string;
}

/**
 * The return structure from a deposit call.
 */
export interface DepositResult {
  /**
   * The exact amount of assets deposited.
   */
  assets: ethers.BigNumber;
  /**
   * The number of shares issued in return for the deposit.
   */
  shares: ethers.BigNumber;
}

// ========================================================================
// Deposit Function
// ========================================================================

/**
 * Deposits the specified amount of assets into the Morpho protocol.
 *
 * Internally, it calls the `supply` function on the Morpho.sol contract.
 *
 * @param options - An object of type DepositOptions with the deposit parameters.
 * @param signer - An ethers.js Signer instance used to sign the transaction.
 * @returns A promise resolving to the deposit result containing asset and share values.
 *
 * @example
 * ```typescript
 * import { ethers } from 'ethers';
 * import { deposit, DepositOptions } from './functions/deposit';
 *
 * // Assume we obtain a signer from your wallet provider.
 * const provider = new ethers.providers.Web3Provider(window.ethereum);
 * const signer = provider.getSigner();
 *
 * const options: DepositOptions = {
 *   marketParams: {
 *     loanToken: "0xTokenAddress",
 *     collateralToken: "0xCollateralTokenAddress",
 *     oracle: "0xOracleAddress",
 *     irm: "0xIrmAddress",
 *     lltv: ethers.BigNumber.from("900000000000000000"), // example: 0.9 WAD
 *     id: "0xComputedMarketId",  // computed externally per your logic
 *   },
 *   depositAmount: ethers.utils.parseUnits("50", 6), // example: 50 USDC (6 decimals)
 *   // onBehalf: "0xOptionalDifferentAddress", // optional parameter
 * };
 *
 * deposit(options, signer)
 *   .then(({ assets, shares }) => {
 *     console.log(`Deposited ${assets.toString()} assets for ${shares.toString()} shares.`);
 *   })
 *   .catch((err) => console.error(err));
 * ```
 */
export async function deposit(
  options: DepositOptions,
  signer: ethers.Signer
): Promise<DepositResult> {
  // Create a contract instance connected to the signer.
  const morphoContract = new ethers.Contract(
    MORPHO_CONTRACT_ADDRESS,
    MorphoABI,
    signer
  );

  // Determine the onBehalf address
  const onBehalfAddress = options.onBehalf || (await signer.getAddress());

  // For a deposit, we pass the deposit amount as assets and set shares = 0.
  // (The contract will compute shares based on its internal conversion.)
  const assets = options.depositAmount;
  const shares = ethers.BigNumber.from(0);
  
  // We use an empty bytes array for additional data.
  const data = "0x";

  try {
    // Send the transaction by calling the supply function.
    // IMPORTANT: Make sure that the MarketParamsInput type aligns with what the contract expects.
    const txResponse: ethers.ContractTransaction = await morphoContract.supply(
      options.marketParams,
      assets,
      shares,
      onBehalfAddress,
      data
    );

    // Wait for the transaction to be mined.
    const receipt = await txResponse.wait();

    // If desired, you can parse events from the receipt to extract the actual assets and shares values returned.
    // For simplicity, we return the deposit amount and assume the shares are computed by the contract.
    // In practice, you may process the receipt events from EventsLib.Supply to determine the exact values.
    return { assets, shares: receipt.events?.[0]?.args?.shares || shares };

  } catch (error) {
    // Re-throw with a descriptive error message.
    throw new Error(
      `Deposit failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
