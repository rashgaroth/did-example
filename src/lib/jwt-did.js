import { ethers } from 'ethers'
import { EthrDID } from 'ethr-did'
import { credentialsConfig, rpc } from '../shared/index.js'

export default class JwtDid extends EthrDID {
  keypair
  wallet
  provider

  constructor(params) {
    const keyPair = EthrDID.createKeyPair()
    const provider = new ethers.providers.JsonRpcProvider(rpc)
    const wallet = new ethers.Wallet(keyPair.privateKey, provider)

    console.log(`data: `, keyPair)

    super({
      ...keyPair,
      // chainNameOrId: 420,
      provider: provider,
      alg: 'ES256K',
      rpcUrl: rpc,
      txSigner: wallet,
      identifier: `did:ethr:goerly:${keyPair.address}`
    })

    this.provider = provider
    this.wallet = wallet
    this.keypair = keyPair
  }

  async getKpTxHash() {
    try {
      console.log(await this.provider.getNetwork())
      const { kp, txHash } = await this.createSigningDelegate()
      return {
        kp,
        txHash
      }
    } catch (error) {
      throw new Error(error)
    }
  }
}