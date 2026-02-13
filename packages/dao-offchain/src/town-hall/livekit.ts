import { Address, PublicClient } from 'viem';
import { checkDaoMembership } from './access';

export interface TokenRequest {
  userAddress: Address;
  safeAddress: Address;
  sessionId: string;
  role: 'presenter' | 'participant';
  governanceTokenAddress?: Address;
}

export interface TokenResponse {
  token: string;
  roomName: string;
}

/**
 * Generate a LiveKit room token after verifying DAO membership.
 *
 * In production, this would use the LiveKit Server SDK:
 *   import { AccessToken } from 'livekit-server-sdk';
 *
 * For now, returns a placeholder structure that the frontend
 * can use once LiveKit infrastructure is deployed.
 */
export async function generateRoomToken(
  client: PublicClient,
  request: TokenRequest,
): Promise<TokenResponse> {
  // Verify on-chain membership
  const { hasAccess } = await checkDaoMembership(
    client,
    request.safeAddress,
    request.userAddress,
    request.governanceTokenAddress,
  );

  if (!hasAccess) {
    throw new Error('Access denied: not a DAO member');
  }

  const roomName = `townhall-${request.safeAddress}-${request.sessionId}`;

  // TODO: Generate actual LiveKit token using livekit-server-sdk
  // const at = new AccessToken(apiKey, apiSecret, {
  //   identity: request.userAddress,
  // });
  // at.addGrant({
  //   roomJoin: true,
  //   room: roomName,
  //   canPublish: request.role === 'presenter',
  //   canPublishData: true,
  // });
  // const token = await at.toJwt();

  return {
    token: '', // placeholder until LiveKit is configured
    roomName,
  };
}
