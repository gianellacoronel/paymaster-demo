import {baseSepolia} from "viem/chains";
import {createPublicClient, http, numberToHex, encodeFunctionData, ProviderDisconnectedError, getContractAddress} from 'viem';

const REWARDS_ABI = [
  {
    input: [],
    name: "claimReward",
    stateMutability: "nonpayable",
    type: "function",
  }
]

export const createClient = (rpcUrl) => {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  })
}

export const sendTransaction = async(provider, fromAddress, contractAddress, paymasterUrl) => {
  const data = encodeFunctionData({
    abi: REWARDS_ABI,
    functionName: "claimReward",
  });

  try{
    if(!provider || !provider.request){
      throw new Error("No provider available. Please connect to a base account");
    }

    if(!paymasterUrl){
      throw new Error("Paymaster URL is required!");
    }

    const calls = [{
      to: contractAddress,
      value: '0x0',
      data: data
    }]

    const result = await provider.request({
      method: 'wallet_sendCalls',
      params: [{
        version: '1.0',
        chainId: numberToHex(baseSepolia.id),
        from: fromAddress,
        calls: calls,
        capabilities: {
          paymasterService: {
            url: paymasterUrl
          }
        }
      }]
    });

    return result;
  } catch(error){
    console.log(`Error sending transaction: ${error}` )
  }
}

export const getCallsStatus = async(provider, batchId) => {
  const status = await provider.request({
    method: 'wallet_getCallsStatus',
    params: [batchId]
  });
  return status;
}

export const waitForBatchConfirmation = async(provider, batchId, maxAttempts = 60, intervalMs=2000) => {
  for(let attempt = 0; attempt < maxAttempts; attempt++){
    const status = await getCallsStatus(provider, batchId);

    if(status.status == 'CONFIRMED'){
      return status;
    }

    if(status.status = 'FAILED'){
      throw new Error (`Batch failed: ${status.error}`);
    }

    await new Promise(resolve => setTimeout(resolve.intervalMs));
  }

  throw new Error('Batch Confirmation timeout');
}