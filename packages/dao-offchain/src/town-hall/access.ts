import { Address, PublicClient } from 'viem';

export type MembershipType = 'signer' | 'tokenHolder' | 'hatsRole';

export interface AccessCheckResult {
  hasAccess: boolean;
  membershipType: MembershipType | null;
}

/**
 * Check if an address is a signer on a Safe multisig.
 */
async function isSafeSigner(
  client: PublicClient,
  safeAddress: Address,
  userAddress: Address,
): Promise<boolean> {
  try {
    const owners = await client.readContract({
      address: safeAddress,
      abi: [
        {
          name: 'getOwners',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ type: 'address[]' }],
        },
      ],
      functionName: 'getOwners',
    });
    return (owners as Address[]).some(
      owner => owner.toLowerCase() === userAddress.toLowerCase(),
    );
  } catch {
    return false;
  }
}

/**
 * Check if an address holds governance tokens (ERC20Votes balance > 0).
 */
async function hasGovernanceTokens(
  client: PublicClient,
  tokenAddress: Address,
  userAddress: Address,
): Promise<boolean> {
  try {
    const balance = await client.readContract({
      address: tokenAddress,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [userAddress],
    });
    return (balance as bigint) > 0n;
  } catch {
    return false;
  }
}

/**
 * Verify on-chain DAO membership for Town Hall access.
 * Checks in order: Safe signer → governance token holder → Hats role.
 */
export async function checkDaoMembership(
  client: PublicClient,
  safeAddress: Address,
  userAddress: Address,
  governanceTokenAddress?: Address,
): Promise<AccessCheckResult> {
  // Check Safe signer
  if (await isSafeSigner(client, safeAddress, userAddress)) {
    return { hasAccess: true, membershipType: 'signer' };
  }

  // Check governance token balance
  if (governanceTokenAddress) {
    if (await hasGovernanceTokens(client, governanceTokenAddress, userAddress)) {
      return { hasAccess: true, membershipType: 'tokenHolder' };
    }
  }

  // TODO: Check Hats Protocol role

  return { hasAccess: false, membershipType: null };
}
