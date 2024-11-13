import {tierConfigType} from './types'
/*  0g
1: Public0gTier1Arb  |  157 USDC | 5
2: Public0gTier2Arb  |  182 USDC | 5
3: Public0gTier3Arb  |  210 USDC | 10
4: Public0gTier4Arb  |  244 USDC | 10
5: Public0gTier5Arb  |  282 USDC | 20
6: Public0gTier6Arb  |  322 USDC | 20
*/

export const tierConfig: tierConfigType = {
    '0x_private_key_1': {
        tiers: ['Public0gTier1Arb', 'Public0gTier2Arb'], // tiers
        count: [5, 5], // count per tier
        code: 'defigen' // DONT FORGET TO SET
    },
    '0x_private_key_2': {
        tiers: ['Public0gTier1Arb', 'Public0gTier2Arb'], // tiers
        count: [5, 5], // count per tier
        code: 'defigen' // DONT FORGET TO SET
    },
}

export const zksyncRPCs = [
    'https://arb1.arbitrum.io/rpc', // -- better keep this one
    'https://arb1.arbitrum.io/rpc', // -- better keep this one
    'https://arb1.arbitrum.io/rpc', // -- better keep this one
    'https://arb1.arbitrum.io/rpc', // -- better keep this one
    'https://arb1.arbitrum.io/rpc', // -- better keep this one

    'https://arbitrum-one-rpc.publicnode.com', // may remove this one
    'https://arbitrum-one.public.blastapi.io', // may remove this one
    'https://rpc.ankr.com/arbitrum',            // may remove this one

    // better use alchemy/ankr/infura/any other private rpc
]
