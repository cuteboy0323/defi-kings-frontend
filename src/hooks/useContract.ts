import { useMemo } from 'react';
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import {
    getRouterContract,
    getSwapContract,
    getBaseContract,
    getDividendContract,
    getDistributeContract
} from 'utils/contractHelpers';

// Imports below migrated from Exchange useContract.ts
import { Contract } from '@ethersproject/contracts';
import { getContract, getProviderOrSigner } from '../utils';

import BEP20_ABI from 'config/abi/bep20.json';

/**
 * Helper hooks to get specific contracts (by ABI)
 */

export const useRouterContract = (withSignerIfPossible = true) => {
    const { library, account } = useActiveWeb3React();
    const signer = useMemo(
        () => (withSignerIfPossible ? getProviderOrSigner(library, account) : null),
        [withSignerIfPossible, library, account]
    );
    return useMemo(() => getRouterContract(signer), [signer]);
};
export const useSwapContract = (withSignerIfPossible = true) => {
    const { library, account } = useActiveWeb3React();
    const signer = useMemo(
        () => (withSignerIfPossible ? getProviderOrSigner(library, account) : null),
        [withSignerIfPossible, library, account]
    );
    return useMemo(() => getSwapContract(signer), [signer]);
};
export const useBaseContract = (withSignerIfPossible = true) => {
    const { library, account } = useActiveWeb3React();
    const signer = useMemo(
        () => (withSignerIfPossible ? getProviderOrSigner(library, account) : null),
        [withSignerIfPossible, library, account]
    );
    return useMemo(() => getBaseContract(signer), [signer]);
};
export const useDividendContract = (withSignerIfPossible = true) => {
    const { library, account } = useActiveWeb3React();
    const signer = useMemo(
        () => (withSignerIfPossible ? getProviderOrSigner(library, account) : null),
        [withSignerIfPossible, library, account]
    );
    return useMemo(() => getDividendContract(signer), [signer]);
};
export const useDistributeContract = (withSignerIfPossible = true) => {
    const { library, account } = useActiveWeb3React();
    const signer = useMemo(
        () => (withSignerIfPossible ? getProviderOrSigner(library, account) : null),
        [withSignerIfPossible, library, account]
    );
    return useMemo(() => getDistributeContract(signer), [signer]);
};

// returns null on errors
function useContract<T extends Contract = Contract>(
    address: string | undefined,
    ABI: any,
    withSignerIfPossible = true
): T | null {
    const { library, account } = useActiveWeb3React();
    const signer = useMemo(
        () => (withSignerIfPossible ? getProviderOrSigner(library, account) : null),
        [withSignerIfPossible, library, account]
    );

    const canReturnContract = useMemo(
        () => address && ABI && (withSignerIfPossible ? library : true),
        [address, ABI, library, withSignerIfPossible]
    );

    return useMemo(() => {
        if (!canReturnContract) return null;
        try {
            return getContract(address, ABI, signer);
        } catch (error) {
            console.error('Failed to get contract', error);
            return null;
        }
    }, [address, ABI, signer, canReturnContract]) as T;
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean) {
    return useContract(tokenAddress, BEP20_ABI, withSignerIfPossible);
}
