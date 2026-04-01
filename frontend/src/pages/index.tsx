import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useEthioSocial } from '../hooks/useEthioSocial';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWallet,
  FaSpinner,
  FaSync,
  FaUserPlus,
  FaInfoCircle,
  FaEthereum,
  FaShieldAlt
} from 'react-icons/fa';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import Navbar from '../components/Navbar';
import { PostType } from '../types';

export default function Home() {
  const {
    account,
    loading,
    wrongNetwork,
    profile,
    allPosts,
    isContractOwner,
    connectWallet,
    logout,
    handleSwitchNetwork,
    createProfile,
    createPost,
    likePost,
    tipPost,
    addComment,
    refreshData,
    getProfileByUsername,
    followUser,
    unfollowUser,
    isFollowing,
  } = useEthioSocial();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  
  // ✅ FIXED: Correct argument order - postType before tags
  const handleCreatePost = async (
    content: string, 
    mediaHash: string, 
    postType: PostType
  ) => {
    // Create a typed empty array for tags
    const tags: string[] = [];
    
    // Call createPost with correct order: content, mediaHash, postType, tags
    await createPost(content, mediaHash, postType, tags);
  };
  
  const handleCreateProfile = async () => {
    if (!username || !displayName) {
      toast.error('Username and Display Name are required');
      return;
    }
    try {
      await createProfile(username, displayName, bio, '', '');
      setShowProfileModal(false);
    } catch (error) {}
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
        <Head>
          <title>EthioSocial | Welcome</title>
        </Head>
        <div className="w-24 h-24 bg-gradient-to-tr from-ethiopian-green via-ethiopian-yellow to-ethiopian-red rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl animate-bounce">
          <span className="text-white font-black text-4xl drop-shadow-md">ኢ</span>
        </div>
        <h1 className="text-5xl font-black mb-4 tracking-tight text-gray-900">
          Welcome to <span className="text-blue-600">EthioSocial</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-md font-medium leading-relaxed">
          Ethiopia's first decentralized social media platform. Own your voice, your content, and your data.
        </p>
        <button 
          onClick={connectWallet}
          className="flex items-center gap-4 bg-black text-white px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-gray-800 transition-all shadow-2xl shadow-gray-200 active:scale-95"
        >
          <FaWallet className="text-xl" />
          Connect MetaMask
        </button>
        <div className="mt-12 flex gap-8 text-gray-300">
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-sm" />
            <span className="text-xs font-bold uppercase tracking-widest">Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <FaEthereum className="text-sm" />
            <span className="text-xs font-bold uppercase tracking-widest">Web3 Powered</span>
          </div>
        </div>
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-[1.5rem] flex items-center justify-center mb-8">
          <FaInfoCircle className="text-3xl text-red-500" />
        </div>
        <h2 className="text-3xl font-black mb-4 text-gray-900">Wrong Network</h2>
        <p className="text-gray-500 mb-8 max-w-sm font-medium">Please switch to the Sepolia Test Network to use EthioSocial.</p>
        <button 
          onClick={handleSwitchNetwork}
          className="bg-red-500 text-white px-10 py-4 rounded-2xl font-black hover:bg-red-600 transition-all shadow-xl shadow-red-100 active:scale-95"
        >
          Switch to Sepolia
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] selection:bg-ethiopian-yellow selection:text-black">
      <Head>
        <title>EthioSocial | Feed</title>
      </Head>
      <Toaster position="top-right" />
      
      {/* Top Banner */}
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-ethiopian-green" />
        <div className="h-full flex-1 bg-ethiopian-yellow" />
        <div className="h-full flex-1 bg-ethiopian-red" />
      </div>
      
      <Navbar 
        account={account}
        profile={profile}
        isContractOwner={isContractOwner}
        onConnectWallet={connectWallet}
        onLogout={logout}
        onShowProfileModal={() => setShowProfileModal(true)}
        getProfileByUsername={getProfileByUsername}
        followUser={followUser}
        unfollowUser={unfollowUser}
        isFollowing={isFollowing}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-gray-100"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6 border-2 border-blue-100">
                <FaUserPlus className="text-4xl text-blue-500" />
              </div>
              <h2 className="text-3xl font-black text-gray-900">Create Profile</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Step into the future</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Username</label>
                <input 
                  type="text" 
                  placeholder="e.g. abebe_bikila" 
                  className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Display Name</label>
                <input 
                  type="text" 
                  placeholder="Abebe Bikila" 
                  className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Bio (Optional)</label>
                <textarea 
                  placeholder="Tell us about yourself..." 
                  className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium resize-none h-28"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-5 text-gray-500 font-black hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateProfile}
                  className="flex-[2] py-5 bg-black text-white font-black rounded-2xl hover:opacity-90 shadow-xl shadow-black/10 active:scale-95 transition-all"
                >
                  Join Community
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {!profile && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border-2 border-blue-50 rounded-[2.5rem] p-8 mb-12 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden group gap-6"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-blue-100 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                <FaInfoCircle className="text-2xl text-blue-600" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-xl mb-1">Finish your setup</h4>
                <p className="text-gray-400 font-medium">Unlock all decentralized social features.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowProfileModal(true)}
              className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all relative z-10 shadow-xl shadow-blue-200 active:scale-95"
            >
              Setup Now
            </button>
          </motion.div>
        )}

        {/* Create Post Component - USING THE WRAPPER FUNCTION */}
        <div className={!profile ? 'opacity-30 grayscale pointer-events-none' : ''}>
          <CreatePost onCreatePost={handleCreatePost} profile={profile} />
        </div>

        {/* Feed Section Title */}
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Recent Feed</h2>
          <button 
            onClick={refreshData}
            disabled={loading}
            className={`w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm active:scale-95 ${loading ? 'opacity-50' : ''}`}
            title="Refresh Feed"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        {/* Feed */}
        <AnimatePresence>
          {allPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100"
            >
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <FaSync className="text-4xl text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900">The feed is waiting</h3>
              <p className="text-gray-400 font-medium max-w-[240px] mx-auto mt-2">Be the pioneer to post on Ethiopia's decentralized web!</p>
            </motion.div>
          ) : (
            <div className="space-y-10">
              {allPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={likePost} 
                  onComment={addComment} 
                  hasLiked={false} 
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}