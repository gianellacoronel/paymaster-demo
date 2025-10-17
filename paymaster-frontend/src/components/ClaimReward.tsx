import { useEffect, useState } from "react";
import { createClient, sendTransaction, waitForBatchConfirmation } from "../utils/paymentService";
import { connectWallet, switchToBaseSepolia, disconnectWallet } from '../utils/walletServices'
import { checkPaymasterService } from '../utils/walletProvider';

const ClaimReward = () => {
  const [provider, setProvider] = useState(null);
  const [sdk, setSdk] = useState(null);
  const [status, setStatus] = useState('idle');
  const [batchId, setBatchId] = useState('');
  const [batchStatus, setBatchStatus] = useState(null);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  const contractAddress = import.meta.env.VITE_REWARDS_CONTRACT_ADDRESS;
  const paymasterUrl = import.meta.env.VITE_PAYMASTER_SERVICE_URL;

  const handleConnectWallet = async() => {
    try{
      setStatus('connecting');
      setError('');
      
      const result = await connectWallet();
      if(!result || !result.address){
        throw new Error('Failed to connect wallet!');
      }

      const {address, provider: walletProvider, sdk: accountSdk} = result;
      setProvider(walletProvider);
      setSdk(accountSdk);
      setUserAddress(address);

      await switchToBaseSepolia(walletProvider);

      setWalletConnected(true);
      setStatus('connected');
    } catch(error){
      setError(`Failed to connect: ${error}`);
      setStatus('error');
    }
  }

  const handleDisconnectWallet = async() => {
    await disconnectWallet(sdk);
    setWalletConnected(false);
    setUserAddress('');
    setProvider(null);
    setSdk(null);
    setBatchId('');
    setBatchStatus(null);
    setStatus('idle');
  }

  const claimReward = async() => {
    try{
      if(!contractAddress || !paymasterUrl) {
        throw new Error('Configuration Missing!');
      }

      if(!walletConnected || !userAddress){
        throw new Error("Please connect your wallet first");
      }

      setStatus('claiming');
      setError('');
      setBatchId('');
      setBatchStatus(null);

      const isPaymasterConfigured = await checkPaymasterService(paymasterUrl, provider);
      if(!isPaymasterConfigured){
        throw new Error("Paymaster service not configured properly");
      }

      const result = await sendTransaction(provider, userAddress, contractAddress, paymasterUrl);
      setBatchId(result);
      setStatus('claimed');

      if(result){
        setStatus('confirming');
        const finalStatus = await waitForBatchConfirmation(provider, result);
        setBatchStatus(finalStatus);
        setStatus('Confirmed');
      }

    }catch(error){
      setError(`Failed to claim reward: ${error}`);
      setStatus('error');
    }
  } 

  return(
    <div className="claim-reward-container">
      <h2>Claim Reward</h2>
      <p className="subtitle">Gasless transactions powered by Coinbase Paymaster</p>

      <div className="button">
        {
          !walletConnected ? (
            <button>{status === 'connecting' ? 'Connecting...' : 'Connect with Base Account'}</button>
          ) : (
            <div className="wallet-info">
              <span>Connected to Base Account: {userAddress.substring(0,6)}...{userAddress.substring(userAddress.length - 4)}</span>
              <div className="action-buttons">
                <button onClick={claimReward} disabled={status === 'claiming' || status === 'confirming'} className="claim-button">
                  {status === 'claiming' ? 'Claiming...' : status === 'confirming' ? 'Confirming...' : 'Claim Reward (Gasless)'}
                </button>
                <button onClick={handleDisconnectWallet} className="disconnect-button">Disconnect</button>
              </div>
            </div>
          )
        }
      </div>
      {
        error && (
          <div className="error-message">{error}</div>
        )
      }
      {
        batchId && batchStatus && (
          <div className="transaction-info">
            <h3>Transaction Status</h3>
            <p><strong>Status:</strong>{
              batchStatus.status === 'CONFIRMED'
                ? '✅ Success - Reward Claimed!'
                : batchStatus.status === 'PENDING'
                ? '⌛ Pending...'
                : '❌ Failed'
            }</p>
            {
              batchStatus.receipts && batchStatus.receipts.length > 0 && (
                <>
                  <p><strong>Transaction Hash:</strong><span style={{fontSize: '0.85em', wordBreak: 'break-all'}}>{batchStatus.receipts[0].transactionHash}</span></p>
                  {
                    batchStatus.receipts[0].blockNumber && (
                      <p><strong>Block:</strong>{batchStatus.receipts[0].blockNumber}</p>
                    )
                  }
                </>
              )
            }
          </div>
        )
      }
    </div>
  )
}

export default ClaimReward;