import {createBaseAccountSDK, base} from "@base-org/account"
import {baseSepolia} from 'viem/chains'

let sdkInstance = null

export const getBaseAccountSDK = () => {
    if(!sdkInstance){
        try{
            sdkInstance = createBaseAccountSDK({
                appName: "Paymaster Demo",
                appLogoUrl: "https://raw.githubusercontent.com/base/brand-kit/eba9e730be34f8c9ae7f9a21f32cc6aafebe2ad1/logo/Basemark/Digital/Base_basemark_blue.svg",
                appChainIds: [base.constants.CHAIN_IDS.baseSepolia]
            })
        }catch(error){
            console.log(`Error setting up base account sdk: ${error}`);
        }
    }
    return sdkInstance;
}

export const isWalletAvailable = () => {
    try{
        return getBaseAccountSDK() !== null
    }catch(error){
        console.log(`Error: Cannot find SDK instance: ${error}`)
    }
}

export const connectWallet = async() => {
    const sdk = getBaseAccountSDK();

    const provider = sdk.getProvider();
    if(!provider){
        throw new error ("No provider available from base account sdk");
    }

    const accounts = await provider.request({method: 'eth_RequestAccounts'});
    if(!accounts || accounts.length === 0){
        throw new Error("No account returned");
    }

    return {
        address: accounts[0],
        provider,
        sdk
    }
}

export const switchToBaseSepolia = async (provider) => {
    try{
        if(!provider){
            throw new Error("No Provider Available");
        }

        const chainId = await provider.request({method: 'eth_chainId'});
        const currentChainId = parseInt(chainId, 16);
        const targetChainId = baseSepolia.id;

        if(currentChainId === targetChainId){
            return true;
        }

        await provider.request({method: 'wallet_switchEthereumChain',
            params: [{chainId: `0x${targetChainId.toString(16)}`}]
        })
        return true;
    } catch(error){
        if(error.code === 4902){
            try{
                const rpcUrl = import.meta.env.VITE_RPC_URL;
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${baseSepolia.id.toString(16)}`,
                        chainName: 'Base Sepolia',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: [rpcUrl],
                        blockExplorerUrls: ['https://sepolia.basescan.org']
                    }]
                })
                return true;
            }catch(error){
                console.log(`Error switching chains ${error}`);
                return false;
            }
        }
    }
}

export const disconnectWallet = async (sdk) => {
    try{
        if(sdk && typeof sdk.disconnect === 'function'){
            await sdk.disconnect();
        }
        return true;
    }catch(error){
        console.log(`Error disconnecting wallet: ${error}`);
        return false;
    }
}