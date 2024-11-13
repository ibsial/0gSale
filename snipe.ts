import {Contract, JsonRpcProvider, Wallet, ethers, formatEther, formatUnits, parseEther, parseUnits} from 'ethers'
import {c, defaultSleep, getRandomElementFromArray, log} from './utils/helpers'
import {aethir_abi, WETH_abi} from './utils/abi.js'
import {zksyncRPCs, tierConfig} from './config'

async function getStartTimestamp(distributorContract: Contract): Promise<bigint> {
    try {
        log(c.blue('fetching start sale timestamp...'))
        // const startSaleTimestamp = await distributorContract.distributionStartTimestamp();
        const startSaleTimestamp = await distributorContract.startTime()
        log(
            c.blue(
                `${
                    new Date(Number(startSaleTimestamp) * 1000).toLocaleDateString() +
                    ' ' +
                    new Date(Number(startSaleTimestamp) * 1000).toLocaleTimeString()
                }`
            )
        )
        return startSaleTimestamp
    } catch (e: any) {
        log(c.red(`could not fetch start sale timestamp`))
        log(c.red(e?.message))
        return getStartTimestamp(distributorContract)
    }
}
async function sendRawTx(signer: Wallet, rawTx: string) {
    try {
        let receipt = await signer.provider!.broadcastTransaction(rawTx)
        log('https://arbiscan.io/tx/' + receipt.hash)
    } catch (e: any) {
        log(e?.message)
        log(c.red(`error on sending tx, you've probably bought or sale is sold out..`))
    }
}
function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000)
}
async function prePrepare(
    signer: Wallet,
    tiers: {
        address: string
        tier: string
        count: number
        code: string
    }[]
) {
    const distributor = new Contract(tiers[0].address, aethir_abi, signer)
    let sumApprove = 0n
    for (let i = 0; i < tiers.length; i++) {
        try {
            let salePrice = (await distributor.tiers(tiers[i].tier)).price
            let totalPayment = BigInt(tiers[i].count) * salePrice
            console.log(
                c.cyan(
                    `want to buy ${c.underline(tiers[i].count)} nodes for ${c.underline(
                        formatUnits(totalPayment, 6)
                    )} USDC at avg price: ${c.underline(formatUnits(totalPayment / BigInt(tiers[i].count), 6))}`
                )
            )
            sumApprove += totalPayment
        } catch (e) {
            console.log(e)
            return prePrepare(signer, tiers)
        }
    }
    try {
        const usdc = new Contract('0xaf88d065e77c8cC2239327C5EDb3A432268e5831', WETH_abi, signer)
        const usdcBalance = await usdc.balanceOf(signer.address)
        const allowance = await usdc.allowance(signer.address, await distributor.getAddress())
        console.log(
            `USDC balance: ${formatUnits(usdcBalance, 6)} | allowance: ${formatUnits(allowance, 6)} (want ${formatUnits(sumApprove, 6)} USDC)`
        )
        if (allowance < sumApprove) {
            console.log(c.yellow('allowance not enough, approving..'))
            let tx = await usdc.approve(tiers[0].address, sumApprove * 2n)
            console.log(`approved ${'https://arbiscan.io/tx/' + tx.hash}`)
        }
    } catch (e: any) {
        console.log(e)
        return prePrepare(signer, tiers)
    }
}
async function participate(
    signer: Wallet,
    tiers: {
        address: string
        tier: string
        count: number
        code: string
    }[],
    retry = false
) {
    try {
        let provider = new JsonRpcProvider(getRandomElementFromArray(zksyncRPCs), 42161, {
            staticNetwork: true
        })
        let rotatedSigner
        if (retry) {
            rotatedSigner = signer.connect(provider)
        } else {
            rotatedSigner = signer
        }
        // get all the data ready for sign
        let signerNonce = await rotatedSigner.provider!.getTransactionCount(rotatedSigner.address)
        for (let i = 0; i < tiers.length; i++) {
            const distributor = new Contract(tiers[i].address, aethir_abi, signer)
            // let salePrice = (await distributor.tiers(tiers[i].tier)).price
            // let totalPayment = BigInt(tiers[i].count) * salePrice
            let maxFeePerGas = parseUnits('0.1', 'gwei')
            let maxPriorityFeePerGas = parseUnits('0.05', 'gwei')
            const txData = distributor.interface.encodeFunctionData('whitelistedPurchaseInTierWithCode', [
                tiers[i].tier,
                BigInt(tiers[i].count),
                [],
                tiers[i].code,
                BigInt(tiers[i].count) // is not validated
            ])

            // // wait timestamp
            while (true) {
                log(`wait sale`)
                try {
                    let estimate = await distributor.whitelistedPurchaseInTierWithCode.estimateGas(
                        tiers[i].tier,
                        BigInt(tiers[i].count),
                        [],
                        tiers[i].code,
                        BigInt(tiers[i].count)
                    )
                    break
                } catch (e: any) {}
                await defaultSleep(0.3, false)
            }
            // // spam TXns
            let j = 0
            while (true) {
                // let provider = new JsonRpcProvider(getRandomElementFromArray(zksyncRPCs), 42161, {
                //     staticNetwork: true
                // })
                // let rotatedSigner = signer.connect(provider)
                if (j >= 2) {
                    break
                }
                const tx = {
                    nonce: signerNonce,
                    from: rotatedSigner.address,
                    to: await distributor.getAddress(),
                    data: txData,
                    maxFeePerGas: maxFeePerGas,
                    maxPriorityFeePerGas: maxPriorityFeePerGas,
                    gasLimit: 2_000_000n,
                    value: 0n,
                    chainId: '42161'
                }
                let rawTx = await rotatedSigner.signTransaction(tx)
                sendRawTx(rotatedSigner, rawTx)
                signerNonce++
                await defaultSleep(0.05, false)
                j++
            }
        }
    } catch (e: any) {
        log(e)
        return participate(signer, tiers, true)
    }
}

async function runWallet(
    signer: Wallet,
    tiers: {
        address: string
        tier: string
        count: number
        code: string
    }[]
) {
    for (let i = 0; i < tiers.length; i++) {
        if (tiers[i].code == '') {
            console.log(c.red(`SET REF CODE FOR ${signer.privateKey}!!!!\n`.repeat(20)))
        }
    }
    await prePrepare(signer, tiers)
    await participate(signer, tiers)
}
async function snipe() {
    let j = 0
    for (let tierKey in tierConfig) {
        try {
            const signer = new Wallet(tierKey)
        } catch (e) {
            continue
        }
        let tiers = []
        for (let i = 0; i < tierConfig[tierKey].tiers.length; i++) {
            tiers.push({
                address: '0x23d73C47AddC85dcDCE321736b12078fafD88640',
                tier: tierConfig[tierKey].tiers[i],
                count: tierConfig[tierKey].count[i],
                code: tierConfig[tierKey].code
            })
        }
        const arb_provider = new JsonRpcProvider(zksyncRPCs[j % zksyncRPCs.length], 42161, {
            staticNetwork: true
        })
        const signer = new Wallet(tierKey, arb_provider)
        console.log(`starting ${signer.address} (${tierKey.slice(0, 5)}...${tierKey.slice(tierKey.length-5, tierKey.length-1)})`)
        runWallet(signer, tiers)
        await defaultSleep(0.07, false)
        j++
    }
}

snipe()
