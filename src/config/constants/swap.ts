import tokens from './tokens';

export const SWAP_TOKENS = [
    {
        ...tokens.bnb,
        id: 'bnb',
        icon: require('assets/img/bnb.png'),
        isBase: true,
        method: ['buy', 'sell']
    },
    {
        ...tokens.dfk,
        id: 'dfk',
        icon: require('assets/img/dfk.jpg'),
        isBase: false,
        method: ['buy', 'sell']
    }
];
