import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaUserPlus, FaSearch, FaTimes, FaSpinner, FaCommentDots, FaSignOutAlt } from 'react-icons/fa';
import { Profile } from '../types';
import { useRouter } from 'next/router';
import { getIPFSUrl } from '../utils/ipfs';
import { useEthioSocial } from '../hooks/useEthioSocial';

interface NavbarProps {
  account: string | null;
  profile: Profile | null;
  isContractOwner: boolean;
  onConnectWallet: () => void;
  onLogout: () => void;
  onShowProfileModal: () => void;
  getProfileByUsername?: (username: string) => Promise<any>;
  followUser?: (address: string) => Promise<void>;
  unfollowUser?: (address: string) => Promise<void>;
  isFollowing?: (follower: string, following: string) => Promise<boolean>;
}

export default function Navbar({ 
  account, 
  profile, 
  isContractOwner, 
  onConnectWallet, 
  onLogout,
  onShowProfileModal,
  getProfileByUsername,
  followUser,
  unfollowUser,
  isFollowing
}: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isFollowingSearchResult, setIsFollowingSearchResult] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !getProfileByUsername) return;

    setIsSearching(true);
    setShowResults(true);
    try {
      const result = await getProfileByUsername(searchQuery.trim());
      setSearchResults(result);
      if (result && account && isFollowing) {
        const following = await isFollowing(account, result.userAddress);
        setIsFollowingSearchResult(following);
      }
    } catch (error) {
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowResults(false);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
        <Link href="/">
          <div className="flex items-center gap-3 group cursor-pointer flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-ethiopian-green via-ethiopian-yellow to-ethiopian-red rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <span className="text-white font-bold text-xl drop-shadow-md">ኢ</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-ethiopian-green to-ethiopian-red bg-clip-text text-transparent">
                EthioSocial
              </h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-none">Decentralized Hub</p>
            </div>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              placeholder="Search by username or address..."
              className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pl-11 pr-10 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            {searchQuery && (
              <button 
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <FaTimes size={12} />
              </button>
            )}
          </form>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showResults && (searchQuery || isSearching) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
              >
                {isSearching ? (
                  <div className="p-8 flex flex-col items-center gap-3">
                    <FaSpinner className="animate-spin text-blue-500 text-xl" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Searching Blockchain...</p>
                  </div>
                ) : searchResults ? (
                  <div className="p-2">
                    <div 
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between rounded-xl group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0" onClick={() => {
                        router.push(`/profile/${searchResults.username}`);
                        clearSearch();
                      }}>
                        <div className="w-12 h-12 bg-gradient-to-tr from-ethiopian-green via-ethiopian-yellow to-ethiopian-red rounded-xl flex items-center justify-center text-white font-bold text-xl overflow-hidden flex-shrink-0">
                          {searchResults.avatarHash ? (
                            <img src={getIPFSUrl(searchResults.avatarHash)} className="w-full h-full object-cover" />
                          ) : (
                            searchResults.displayName.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{searchResults.displayName}</h4>
                          <p className="text-blue-500 text-sm font-bold truncate">@{searchResults.username}</p>
                        </div>
                      </div>

                      {/* Follow/Unfollow Button in Search Results */}
                      {account && searchResults.userAddress.toLowerCase() !== account.toLowerCase() && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!followUser || !unfollowUser || isActionLoading) return;
                            setIsActionLoading(true);
                            try {
                              if (isFollowingSearchResult) {
                                await unfollowUser(searchResults.userAddress);
                                setIsFollowingSearchResult(false);
                              } else {
                                await followUser(searchResults.userAddress);
                                setIsFollowingSearchResult(true);
                              }
                            } catch (error) {
                              console.error('Action failed:', error);
                            } finally {
                              setIsActionLoading(false);
                            }
                          }}
                          disabled={isActionLoading}
                          className={`ml-3 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm flex items-center gap-2 ${
                            isFollowingSearchResult 
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                          }`}
                        >
                          {isActionLoading ? (
                            <FaSpinner className="animate-spin" />
                          ) : isFollowingSearchResult ? (
                            <>Following</>
                          ) : (
                            <><FaUserPlus /> Follow</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : searchQuery && (
                  <div className="p-8 text-center">
                    <p className="text-gray-400 font-bold text-sm">No user found with that name</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          {account && (
            <Link href="/messages">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-all border border-gray-100"
              >
                <FaCommentDots size={20} />
              </motion.button>
            </Link>
          )}
          {account ? (
            <>
              <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Connected</span>
                <span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
              {profile ? (
                <Link href={`/profile/${profile.username}`}>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 bg-gradient-to-tr from-blue-50 to-purple-50 border-2 border-white rounded-2xl flex items-center justify-center cursor-pointer shadow-sm hover:border-blue-200 transition-all overflow-hidden" 
                  >
                    {profile.avatarHash ? (
                      <img 
                        src={getIPFSUrl(profile.avatarHash)} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-blue-600 font-black text-lg">{profile.displayName.charAt(0)}</span>
                    )}
                  </motion.div>
                </Link>
              ) : (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center cursor-pointer shadow-sm hover:border-blue-200 transition-all" 
                  onClick={onShowProfileModal}
                >
                  <FaUserPlus className="text-gray-400" />
                </motion.div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="w-11 h-11 bg-red-50 text-red-400 hover:text-red-500 hover:bg-red-100 rounded-2xl flex items-center justify-center transition-all border border-red-50 shadow-sm"
                title="Logout / Disconnect"
              >
                <FaSignOutAlt size={18} />
              </motion.button>
            </>
          ) : (
            <button 
              onClick={onConnectWallet}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              <FaWallet />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
