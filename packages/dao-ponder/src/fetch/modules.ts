import { Address, getAddress } from 'viem';
import { legacy } from '@luxdao/contracts';
import { Context } from 'ponder:registry';
import { getPages, PAGE_SIZE, SENTINEL_ADDRESS } from './common';

export type Module = {
  type: 'Governor' | 'FractalModule';
  address: Address;
  strategies?: Address[]; // Only Governor modules have strategies
};

export async function checkModule(
  context: Context,
  _address: Address,
): Promise<Module | null> {
  const address = getAddress(_address);

  const [
    domainSeparatorTypeHash,
    transactionTypeHash,
    strategiesResponse,
    fractalModuleAddress,
    controllers,
  ] = await context.client.multicall({
    contracts: [
      {
        abi: legacy.abis.Governor,
        address,
        functionName: 'DOMAIN_SEPARATOR_TYPEHASH',
      },
      {
        abi: legacy.abis.Governor,
        address,
        functionName: 'TRANSACTION_TYPEHASH',
      },
      {
        abi: legacy.abis.Governor,
        address,
        functionName: 'getStrategies',
        args: [SENTINEL_ADDRESS, PAGE_SIZE],
      },
      {
        abi: legacy.abis.FractalModule,
        address,
        functionName: 'avatar',
      },
      {
        abi: legacy.abis.FractalModule,
        address,
        functionName: 'controllers',
        // don't care about the address, just want the controllers
        // call to be successful to determine if it's a Fractal module
        args: [SENTINEL_ADDRESS],
      },
    ],
    allowFailure: true,
  });

  // Governor module
  if (
    domainSeparatorTypeHash.status === 'success' &&
    transactionTypeHash.status === 'success' &&
    strategiesResponse.status === 'success'
  ) {
    const strategies = [...strategiesResponse.result[0]];
    if (strategies.length === Number(PAGE_SIZE)) {
      const moreStrategies = await getPages(context, address, 'Governor', 'getStrategies');
      strategies.push(...moreStrategies);
    }
    return {
      type: 'Governor',
      address,
      strategies,
    };
  }

  // Fractal module
  if (
    fractalModuleAddress.status === 'success' &&
    controllers.status === 'success'
  ) {
    return {
      type: 'FractalModule',
      address,
    };
  }

  // Other module, ignore it
  return null;
}
