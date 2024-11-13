## installation
`npm i`

## description and advice
- before starting the script withdraw enough ETH and USDC for sale and  ~200$ more for TXns spam
- Script perform basic checks, **pay attention** to it. It also approves USDC.
-  1 RPC is assinged to 1 wallet. If multiple wallets are run, its better to use multiple RPCs.

## setup
- tier is the TIERs tiers name (listed in config.ts file)
- count is limited by the sale rules. Do not set more than its allowed by the docs
- many tiers can go into one key, ***make sure to match tier names and counts***: 
```
tiers: ['Public0gTier1Arb', 'Public0gTier2Arb'],
count: [5, 5],
```

## running
`npm run start`
> Run it some time before sale start, so the script can **appprove** and perform basic checks