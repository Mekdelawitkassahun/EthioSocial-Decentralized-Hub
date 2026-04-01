import { ethers } from 'ethers';
import EthioSocialABI from './EthioSocial.json';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x510f06959D4206f7995d17380d87984959430B17';
export const SEPOLIA_CHAIN_ID = 11155111;

export const getContract = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, EthioSocialABI, signer);
  }
  return null;
};

export const getReadOnlyContract = () => {
  // Use multiple RPCs as fallback to prevent net::ERR_FAILED
  const rpcUrls = [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://rpc.ankr.com/eth_sepolia',
    'https://eth-sepolia.public.blastapi.io'
  ];
  
  // Try to create a provider with fallback logic or just pick the first one for now
  // For a real production app, use ethers.providers.FallbackProvider
  const provider = new ethers.providers.JsonRpcProvider(rpcUrls[0]);
  return new ethers.Contract(CONTRACT_ADDRESS, EthioSocialABI, provider);
};

export const switchToSepolia = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'SepoliaETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
        return true;
      }
      return false;
    }
  }
  return false;
};
