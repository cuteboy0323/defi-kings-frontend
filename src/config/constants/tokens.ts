import { CIDS } from 'config';
import { Token } from 'types/token';
import { CHAIN_ID } from './networks';

const { MAINNET, TESTNET } = CIDS;

interface TokenList {
    [symbol: string]: Token;
}

const defineTokens = <T extends TokenList>(t: T) => t;

export const mainnetTokens = defineTokens({
    wbnb: {
        chainId: MAINNET,
        address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        decimals: 18,
        symbol: 'WBNB',
        name: 'Wrapped BNB',
        apiId: 'binancecoin',
        projectLink: 'https://www.binance.com/'
    },
    bnb: {
        chainId: MAINNET,
        address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        decimals: 18,
        symbol: 'BNB',
        name: 'BNB',
        apiId: 'binancecoin',
        projectLink: 'https://www.binance.com/'
    },
    busd: {
        chainId: MAINNET,
        address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        decimals: 18,
        symbol: 'BUSD',
        name: 'Binance USD',
        apiId: 'binance-usd',
        projectLink: 'https://www.paxos.com/busd/'
    },
    dfk: {
        chainId: MAINNET,
        address: '0x8956692426786F16CF96922181553ef2d308de5C',
        decimals: 9,
        symbol: 'DFK',
        name: 'Defi Kings',
        apiId: '',
        projectLink: 'https://www.defikings.io/'
    }
} as const);

export const testnetTokens = defineTokens({
    wbnb: {
        chainId: TESTNET,
        address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
        decimals: 18,
        symbol: 'WBNB',
        name: 'Wrapped BNB',
        projectLink: 'https://www.binance.com/'
    },
    bnb: {
        chainId: TESTNET,
        address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
        decimals: 18,
        symbol: 'BNB',
        name: 'BNB',
        projectLink: 'https://www.binance.com/'
    },
    dfk: {
        chainId: TESTNET,
        address: '0x2360622D4Dbbbd32a58D99FC9CA86d26Ff341c16',
        decimals: 5,
        symbol: 'DFK',
        name: 'DEFI KINGS',
        projectLink: 'https://www.defikings.io/'
    }
} as const);

const tokens = () => {
    const chainId = CHAIN_ID;

    // If testnet - return list comprised of testnetTokens wherever they exist, and mainnetTokens where they don't
    if (parseInt(chainId, 10) === TESTNET) {
        return Object.keys(mainnetTokens).reduce((accum, key) => {
            return {
                ...accum,
                [key]: testnetTokens[key] || mainnetTokens[key]
            };
        }, {} as typeof testnetTokens & typeof mainnetTokens);
    }

    return mainnetTokens;
};

const unserializedTokens = tokens();
export default unserializedTokens;
