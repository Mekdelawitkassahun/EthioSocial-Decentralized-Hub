import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { getContract, getReadOnlyContract, switchToSepolia, SEPOLIA_CHAIN_ID } from '../utils/contract';
import { Profile, Post, PostType, Message } from '../types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useEthioSocial = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isContractOwner, setIsContractOwner] = useState(false);

  const checkNetwork = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        
        setWrongNetwork(chainId !== SEPOLIA_CHAIN_ID);
      } catch (error) {
        console.error('Error checking network:', error);
      }
    }
  }, []);

  const loadUserProfile = useCallback(async (address?: string) => {
    const targetAddress = address || account;
    if (!targetAddress) return null;
    try {
      const contract = await getContract() || getReadOnlyContract();
      if (!contract) return null;

      const userProfile = await contract.getProfile(targetAddress);
      if (userProfile.userAddress !== '0x0000000000000000000000000000000000000000') {
        const formattedProfile: Profile = {
          userAddress: userProfile.userAddress,
          username: userProfile.username,
          displayName: userProfile.displayName,
          bio: userProfile.bio,
          avatarHash: userProfile.avatarHash,
          coverImageHash: userProfile.coverImageHash,
          followersCount: Number(userProfile.followersCount),
          followingCount: Number(userProfile.followingCount),
          postsCount: Number(userProfile.postsCount),
          createdAt: Number(userProfile.createdAt),
          isActive: userProfile.isActive
        };
        if (!address || address === account) {
          setProfile(formattedProfile);
        }
        return formattedProfile;
      }
      return null;
    } catch (error) {
      if (!address || address === account) {
        setProfile(null);
      }
      return null;
    }
  }, [account]);

  const loadUserPosts = useCallback(async (address?: string) => {
    const targetAddress = address || account;
    if (!targetAddress) return [];
    try {
      const contract = await getContract() || getReadOnlyContract();
      if (!contract) return [];

      const userPostIds = await contract.getUserPosts(targetAddress);
      const postsData: Post[] = [];
      
      for (const postId of userPostIds) {
        try {
          const postData = await contract.getPost(postId);
          postsData.push({
            id: Number(postData.id),
            author: postData.author,
            content: postData.content,
            mediaHash: postData.mediaHash,
            postType: Number(postData.postType),
            timestamp: Number(postData.timestamp),
            likes: Number(postData.likes),
            tips: Number(postData.tips),
            tags: postData.tags,
            commentCount: Number(postData.commentCount)
          });
        } catch (e) {}
      }
      
      postsData.sort((a, b) => b.timestamp - a.timestamp);
      if (!address || address === account) {
        setPosts(postsData);
      }
      return postsData;
    } catch (error) {
      console.error('Error loading posts:', error);
      return [];
    }
  }, [account]);

  const loadGlobalData = useCallback(async () => {
    try {
      const contract = getReadOnlyContract();
      if (!contract) return;

      try {
        const owner = await contract.owner();
        setIsContractOwner(account?.toLowerCase() === owner.toLowerCase());
      } catch (e) {}

      const globalPosts: Post[] = [];
      for (let i = 1; i <= 50; i++) {
        try {
          const postData = await contract.getPost(i);
          if (postData.author === '0x0000000000000000000000000000000000000000') break;
          
          globalPosts.push({
            id: Number(postData.id),
            author: postData.author,
            content: postData.content,
            mediaHash: postData.mediaHash,
            postType: Number(postData.postType),
            timestamp: Number(postData.timestamp),
            likes: Number(postData.likes),
            tips: Number(postData.tips),
            tags: postData.tags,
            commentCount: Number(postData.commentCount)
          });
        } catch (e) {
          break; 
        }
      }
      
      globalPosts.sort((a, b) => b.timestamp - a.timestamp);
      setAllPosts(globalPosts);
    } catch (error) {
      console.error('Error loading global data:', error);
    }
  }, [account]);

  const loadUserData = useCallback(async () => {
    if (!account) {
      await loadGlobalData();
      return;
    }
    await Promise.all([
      loadUserProfile(),
      loadUserPosts(),
      loadGlobalData()
    ]);
  }, [account, loadUserProfile, loadUserPosts, loadGlobalData]);

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const isLoggedOut = localStorage.getItem('ethiosocial_logged_out') === 'true';
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0 && !isLoggedOut) {
          setAccount(accounts[0]);
        } else {
          setLoading(false);
          await loadGlobalData();
        }

        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length === 0) {
            setAccount(null);
            setProfile(null);
            setPosts([]);
          } else {
            localStorage.removeItem('ethiosocial_logged_out');
            setAccount(accounts[0]);
          }
        };

        const handleChainChanged = () => window.location.reload();

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
      } else {
        setLoading(false);
        await loadGlobalData();
      }
    };
    init();
  }, [loadGlobalData]);

  useEffect(() => {
    if (account) {
      const load = async () => {
        setLoading(true);
        await checkNetwork();
        await loadUserData();
        setLoading(false);
      };
      load();
    }
  }, [account, checkNetwork, loadUserData]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await loadUserData();
    setLoading(false);
    toast.success('Feed refreshed!');
  }, [loadUserData]);

  const connectWallet = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        localStorage.removeItem('ethiosocial_logged_out');
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        toast.success('Wallet connected!');
      } catch (error) {
        toast.error('Failed to connect wallet');
        console.error('Error connecting wallet:', error);
      }
    } else {
      toast.error('MetaMask not installed');
    }
  }, []);

  const handleSwitchNetwork = useCallback(async () => {
    const success = await switchToSepolia();
    if (success) {
      setWrongNetwork(false);
      toast.success('Switched to Sepolia network');
      await loadUserData();
    } else {
      toast.error('Failed to switch network');
    }
  }, [loadUserData]);

  const createProfile = useCallback(async (username: string, displayName: string, bio: string, avatarHash: string, coverImageHash: string) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.createProfile(username, displayName, bio, avatarHash, coverImageHash);
      await tx.wait();
      
      await loadUserData();
      toast.success('Profile created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
      throw error;
    }
  }, [loadUserData]);

  const updateProfile = useCallback(async (username: string, displayName: string, bio: string, avatarHash: string, coverImageHash: string) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.updateProfile(username, displayName, bio, avatarHash, coverImageHash);
      
      await tx.wait();
      
      await loadUserData();
    } catch (error: any) {
      throw error;
    }
  }, [loadUserData]);

  const getProfileByUsername = useCallback(async (username: string) => {
    try {
      const contract = await getContract() || getReadOnlyContract();
      if (!contract) return null;

      // First check if username is an address
      let targetAddress = '';
      if (ethers.utils.isAddress(username)) {
        targetAddress = username;
      } else {
        targetAddress = await contract.usernameToAddress(username);
      }

      if (!targetAddress || targetAddress === '0x0000000000000000000000000000000000000000') return null;

      const userProfile = await contract.getProfile(targetAddress);
      if (userProfile.userAddress !== '0x0000000000000000000000000000000000000000') {
        return {
          userAddress: userProfile.userAddress,
          username: userProfile.username,
          displayName: userProfile.displayName,
          bio: userProfile.bio,
          avatarHash: userProfile.avatarHash,
          coverImageHash: userProfile.coverImageHash,
          followersCount: Number(userProfile.followersCount),
          followingCount: Number(userProfile.followingCount),
          postsCount: Number(userProfile.postsCount),
          createdAt: Number(userProfile.createdAt),
          isActive: userProfile.isActive
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting profile by username:', error);
      return null;
    }
  }, []);

  const isFollowing = useCallback(async (follower: string, following: string) => {
    try {
      const contract = await getContract() || getReadOnlyContract();
      if (!contract) return false;
      return await contract.isFollowing(follower, following);
    } catch (error) {
      return false;
    }
  }, []);

  const createPost = useCallback(async (content: string, mediaHash: string, postType: PostType, tags: string[]) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.createPost(content, mediaHash, postType, tags);
      await tx.wait();
      
      await loadUserData();
      toast.success('Post created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
      throw error;
    }
  }, [loadUserData]);

  const likePost = useCallback(async (postId: number) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.likePost(postId);
      await tx.wait();
      
      await loadUserData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to like post');
      throw error;
    }
  }, [loadUserData]);

  const tipPost = useCallback(async (postId: number, amount: string) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.tipPost(postId, {
        value: ethers.utils.parseEther(amount)
      });
      await tx.wait();
      
      await loadUserData();
      toast.success(`Tip of ${amount} ETH sent!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send tip');
      throw error;
    }
  }, [loadUserData]);

  const withdrawTips = useCallback(async () => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.withdrawTips();
      await tx.wait();
      toast.success('Tips withdrawn successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to withdraw tips');
      throw error;
    }
  }, []);

  const addComment = useCallback(async (postId: number, content: string) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.addComment(postId, content);
      await tx.wait();
      
      await loadUserData();
      toast.success('Comment added!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
      throw error;
    }
  }, [loadUserData]);

  const followUser = useCallback(async (userAddress: string) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.followUser(userAddress);
      await tx.wait();
      
      await loadUserData();
      toast.success('User followed!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to follow user');
      throw error;
    }
  }, [loadUserData]);

  const unfollowUser = useCallback(async (userAddress: string) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      const tx = await contract.unfollowUser(userAddress);
      await tx.wait();
      
      await loadUserData();
      toast.success('User unfollowed!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unfollow user');
      throw error;
    }
  }, [loadUserData]);

  const logout = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Attempt to force the account selector to show up in MetaMask for a better "Switch" experience
        try {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
          });
        } catch (e) {
          // If the user cancels the picker, we still proceed with the local logout
        }
      }
      
      localStorage.setItem('ethiosocial_logged_out', 'true');
      setAccount(null);
      setProfile(null);
      setPosts([]);
      toast.success('Logged out from EthioSocial. Switch accounts in MetaMask for a full change.');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  const sendMessage = useCallback(async (receiver: string, content: string) => {
    try {
      const contract = await getContract();
      if (!contract) throw new Error('Contract not available');

      // Check for profile existence locally first for a better UX
      const currentProfile = await contract.getProfile(account);
      if (!currentProfile || currentProfile.userAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Please create a profile first to send messages');
      }

      if (receiver.toLowerCase() === account?.toLowerCase()) {
        throw new Error('You cannot message yourself');
      }

      try {
        await contract.estimateGas.sendMessage(receiver, content);
      } catch (estimateError: any) {
        // If estimation fails, it's likely a contract revert or missing function
        if (estimateError.message.includes('execution reverted')) {
          throw new Error('Transaction would fail. The contract might need to be redeployed with the latest messaging features.');
        }
        throw estimateError;
      }

      const tx = await contract.sendMessage(receiver, content);
      await tx.wait();
      toast.success('Message sent!');
    } catch (error: any) {
      const errorMsg = error.reason || error.message || 'Failed to send message';
      toast.error(errorMsg);
      throw error;
    }
  }, [account]);

  const getMessages = useCallback(async (otherUser: string) => {
    try {
      const contract = await getContract() || getReadOnlyContract();
      if (!contract) return [];

      const messagesData = await contract.getMessages(otherUser);
      return messagesData.map((m: any) => ({
        id: Number(m.id),
        sender: m.sender,
        receiver: m.receiver,
        content: m.content,
        timestamp: Number(m.timestamp),
        isRead: m.isRead
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }, []);

  const getConversations = useCallback(async () => {
    try {
      const contract = await getContract() || getReadOnlyContract();
      if (!contract) return [];

      return await contract.getConversations();
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }, []);

  return {
    account,
    loading,
    wrongNetwork,
    profile,
    posts,
    allPosts,
    isContractOwner,
    connectWallet,
    logout,
    handleSwitchNetwork,
    createProfile,
    updateProfile,
    getProfileByUsername,
    isFollowing,
    createPost,
    likePost,
    tipPost,
    withdrawTips,
    addComment,
    followUser,
    unfollowUser,
    sendMessage,
    getMessages,
    getConversations,
    refreshData,
    loadUserProfile,
    loadUserPosts
  };
};
