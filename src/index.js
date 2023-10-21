import { ethers } from "ethers"
import { EthrDID } from "ethr-did"
import { rpc, credentialsConfig, issuerCredentialConfig } from "./shared/index.js"
import { createVerifiableCredentialJwt, createVerifiablePresentationJwt, verifyCredential } from 'did-jwt-vc'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { createDID, registerDID } from '@ayanworks/polygon-did-registrar'
import { buildCredentialApplication, buildKycAmlManifest, encodeVerifiableCredential, randomDidKey } from "verite"
import { randomBytes } from "ethers/lib/utils.js"
import Web3 from "web3"

const ethr = async () => {
  try {
    const web3 = new Web3()
    const provider = new ethers.providers.JsonRpcProvider("https://polygon-mumbai.infura.io/v3/74a97bae118345ecbadadaaeb1cf4a53")
    const upbondDid = `did:ethr:upbond:`
  
    const issuerDid = await new EthrDID({
      provider: provider,
      privateKey: issuerCredentialConfig.privKey,
      identifier: `${upbondDid}${issuerCredentialConfig.pubKey}`
    })

    const audienceDid = await new EthrDID({
      provider: provider,
      privateKey: credentialsConfig.privKey,
      identifier: `${upbondDid}${credentialsConfig.pubKey}`
    })

    const { eth: { abi } } = web3

    const userData = {
      dateAccepted: Date.now(),
      userAddress: credentialsConfig.pubKey,
      dapp: 'medium'
    }

    const encodedUserData = abi.encodeParameters(
      ['uint256', 'string', 'string'],
      [userData.dateAccepted, userData.userAddress, userData.dapp]
    )
    
    const vcJwt = await createVerifiableCredentialJwt({
      sub: audienceDid.did,
      nbf: 1562950282,
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: {
          id: 'did:ethr:upbond:<erc725ID>',
          '@scope': [
            'first_name',
            'last_name'
          ],
          userData,
          signHash: encodedUserData
        }
      }
    }, 
    issuerDid)
    const vpPayload = {
      vp: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: [vcJwt]
      }
    }
  
    const vpJwt = await createVerifiablePresentationJwt(vpPayload, audienceDid)
    
    console.log('1. create vc & vp JWT \n',{
      vpJwt,
      vcJwt
    })
  
    const providerConfig = {
      networks: [
        { name: "upbond", provider },
        { name: "0x5", rpcUrl: "https://goerli.infura.io/v3/ca465971f6f34a1bb6f41eebe6ab8496" },
        { name: "rsk:testnet", chainId: "0x1f", rpcUrl: "https://did.testnet.rsk.co:4444" },
        { name: "development", rpcUrl: "http://localhost:7545", registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b" },
        { name: "myprivatenet", chainId: 123456, rpcUrl: "https://my.private.net.json.rpc.url" }
      ]
    }
  
    const ethrDidResolver = getResolver(providerConfig)
    const resolver = new Resolver(ethrDidResolver)
    const verifiedVC = await verifyCredential(vcJwt, resolver)

    const { verifiableCredential: { credentialSubject } } = verifiedVC
    const { signHash } = credentialSubject
    const verifiedUserData = credentialSubject.userData
    const verifySignHash = abi.encodeParameters(
      ['uint256', 'string', 'string'],
      [verifiedUserData.dateAccepted, verifiedUserData.userAddress, verifiedUserData.dapp]
    )

    console.log('2. verified verifiable credentials \n', verifiedVC)

    if (signHash === verifySignHash) {
      console.log('3. ','signHash verified, now you can decode the erc725 key')
    } else {
      console.log('3. ', 'Failed to verify signHash')
    }
  } catch (error) {
    throw new Error(error)
  }
}

const verite = async () => {
  try {
    console.log({ ethrDid })
    const issuerDidKey = randomDidKey(randomBytes)
    console.log({ issuerDidKey })
    const manifest = buildKycAmlManifest({ id: issuerDidKey.controller, name: 'test' })
    console.log({ manifest })
    const application = await buildCredentialApplication(issuerDidKey, manifest)
    console.log({ application })

    const verifyCredential = await encodeVerifiableCredential({

    })
  } catch (error) {
    throw new Error(error)
  }
}

(async () => {
  ethr().catch(console.error)
})()