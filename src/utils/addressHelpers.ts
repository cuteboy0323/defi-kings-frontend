import { CIDS } from 'config';
import { CHAIN_ID } from 'config/constants/networks';
import { Address } from 'config/constants/types';

import addresses from 'config/constants/contracts';

export const getAddress = (address: Address): string => {
    return address[CHAIN_ID] ? address[CHAIN_ID] : address[CIDS.MAINNET];
};
export const getRouterAddress = () => {
    return getAddress(addresses.router);
};
export const getSwapAddress = () => {
    return getAddress(addresses.swap);
};
export const getMulticallAddress = () => {
    return getAddress(addresses.multiCall);
};
export const getBaseAddress = () => {
    return getAddress(addresses.base);
};
export const getDividendAddress = () => {
    return getAddress(addresses.dividend);
};
export const getDistributeAddress = () => {
    return getAddress(addresses.distribute);
};
