export const isWalletSendCallsSupported = async(provider) => {
  if(!provider || typeof provider.request !== 'function') return false;

  try{
    const capabilities = await provider.request({
      method: 'wallet_getCapabilities',
    })

    if(capabilities){
      for(const chainId in capabilities){
        if(capabilities[chainId]?.paymasterService?.supported){
          return true;
        }
      }
    }

    return false;
  } catch(error) {
    console.log(`Error: ${error}`);
    return typeof provider.request === 'function';
  }
}

export const checkPaymasterService = async (paymasterUrl, provider) => {
  if(!paymasterUrl) return false;

  try{
    new URL(paymasterUrl);

    if(provider){
      return await isWalletSendCallsSupported(provider);
    }
    return true;
  } catch(error) {
    console.log(`Error: ${error}`);
    return false;
  }
}