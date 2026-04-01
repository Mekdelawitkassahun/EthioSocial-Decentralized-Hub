import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEthioSocial } from '../../hooks/useEthioSocial';
import { FaEdit, FaUserPlus, FaUserCheck, FaCamera, FaSpinner, FaArrowLeft, FaCheck, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { uploadAvatar, uploadCoverImage, getIPFSUrl } from '../../utils/ipfs';
import PostCard from '../../components/PostCard';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { 
    account, 
    profile, 
    followUser, 
    unfollowUser,
    updateProfile,
    getProfileByUsername,
    isFollowing,
    loadUserPosts,
    likePost,
    addComment,
    connectWallet,
    logout,
    isContractOwner,
  } = useEthioSocial();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    avatarHash: '',
    coverImageHash: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState({
    avatar: '',
    cover: ''
  });
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const loadData = useCallback(async () => {
    if (!username) return;
    try {
      const profileData = await getProfileByUsername(username as string);
      if (profileData) {
        setViewedProfile(profileData);
        
        if (account && account.toLowerCase() !== profileData.userAddress.toLowerCase()) {
          const following = await isFollowing(account, profileData.userAddress);
          setIsFollowingState(following);
        }
        
        const postsData = await loadUserPosts(profileData.userAddress);
        setUserPosts(postsData);
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [username, account, getProfileByUsername, isFollowing, loadUserPosts]);

  useEffect(() => {
    if (username) {
      setIsLoadingProfile(true);
      setViewedProfile(null);
      setUserPosts([]);
      loadData();
    }
  }, [username, loadData]);

  const handleEditClick = () => {
    setEditForm({
      displayName: viewedProfile?.displayName || '',
      bio: viewedProfile?.bio || '',
      avatarHash: viewedProfile?.avatarHash || '',
      coverImageHash: viewedProfile?.coverImageHash || ''
    });
    setPreviews({ avatar: '', cover: '' });
    setIsEditing(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    const previewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, avatar: previewUrl }));
    
    setIsUploading(true);
    try {
      const hash = await uploadAvatar(file);
      setEditForm(prev => ({ ...prev, avatarHash: hash }));
      toast.success('Avatar uploaded!');
    } catch (error) {
      toast.error('Failed to upload avatar');
      setPreviews(prev => ({ ...prev, avatar: '' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    const previewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, cover: previewUrl }));

    setIsUploading(true);
    try {
      const hash = await uploadCoverImage(file);
      setEditForm(prev => ({ ...prev, coverImageHash: hash }));
      toast.success('Cover photo uploaded!');
    } catch (error) {
      toast.error('Failed to upload cover');
      setPreviews(prev => ({ ...prev, cover: '' }));
    } finally {
      setIsUploading(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!viewedProfile) return;
    
    if (isUploading) {
      toast.error('Please wait for image upload to complete');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Initiating blockchain update...');
    
    const dataToSave = {
      username: viewedProfile.username,
      displayName: editForm.displayName,
      bio: editForm.bio,
      avatarHash: editForm.avatarHash,
      coverImageHash: editForm.coverImageHash
    };

    try {
      await updateProfile(
        dataToSave.username,
        dataToSave.displayName,
        dataToSave.bio,
        dataToSave.avatarHash,
        dataToSave.coverImageHash
      );
      
      toast.success('Blockchain updated! Syncing UI...', { id: toastId });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadData();
      
      setIsEditing(false);
      setPreviews({ avatar: '', cover: '' });
      toast.success('Profile updated successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollowAction = async () => {
    if (!account) {
      toast.error('Please connect wallet first');
      return;
    }
    if (!viewedProfile) return;

    try {
      if (isFollowingState) {
        await unfollowUser(viewedProfile.userAddress);
        setIsFollowingState(false);
      } else {
        await followUser(viewedProfile.userAddress);
        setIsFollowingState(true);
      }
      await loadData();
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  const isOwnProfile = account?.toLowerCase() === viewedProfile?.userAddress?.toLowerCase();

  if (isLoadingProfile && !viewedProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <p className="text-gray-400 font-bold animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>EthioSocial | {viewedProfile?.displayName || 'Profile'}</title>
      </Head>

      <Navbar 
        account={account}
        profile={profile}
        isContractOwner={isContractOwner}
        onConnectWallet={connectWallet}
        onLogout={logout}
        onShowProfileModal={() => router.push('/')}
        getProfileByUsername={getProfileByUsername}
        followUser={followUser}
        unfollowUser={unfollowUser}
        isFollowing={isFollowing}
      />

      {/* Profile Header Navigation */}
      <div className="bg-white/80 backdrop-blur-md sticky top-[65px] z-40 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link href="/">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
              <FaArrowLeft className="text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-black text-gray-900">{viewedProfile?.displayName}</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{viewedProfile?.postsCount} Posts</p>
          </div>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="relative h-64 bg-gradient-to-r from-ethiopian-green via-ethiopian-yellow to-ethiopian-red group">
        {(isEditing ? (previews.cover || editForm.coverImageHash) : viewedProfile?.coverImageHash) && (
          <img
            src={isEditing && previews.cover ? previews.cover : getIPFSUrl(isEditing ? editForm.coverImageHash : viewedProfile.coverImageHash)}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        {isOwnProfile && isEditing && (
          <label className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md p-4 rounded-2xl cursor-pointer hover:bg-black/70 transition-all shadow-lg border border-white/20 active:scale-95">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <FaCamera />
              <span>Change Cover</span>
            </div>
            <input type="file" className="hidden" onChange={handleCoverUpload} accept="image/jpeg,image/png,image/jpg" />
          </label>
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 pb-20">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-100 relative">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0 mx-auto md:mx-0">
              <div className="w-40 h-40 rounded-[3rem] border-8 border-white bg-gradient-to-tr from-ethiopian-green via-ethiopian-yellow to-ethiopian-red flex items-center justify-center text-6xl text-white font-black shadow-2xl overflow-hidden ring-1 ring-gray-100">
                {(isEditing ? (previews.avatar || editForm.avatarHash) : viewedProfile?.avatarHash) ? (
                  <img
                    src={isEditing && previews.avatar ? previews.avatar : getIPFSUrl(isEditing ? editForm.avatarHash : viewedProfile.avatarHash)}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  viewedProfile?.displayName?.charAt(0) || '?'
                )}
              </div>
              {isOwnProfile && isEditing && (
                <label className="absolute bottom-2 right-2 bg-blue-600 p-4 rounded-2xl cursor-pointer shadow-xl border-4 border-white hover:bg-blue-700 transition-all active:scale-90">
                  <FaCamera className="text-white text-lg" />
                  <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/jpeg,image/png,image/jpg" />
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left pt-4">
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Display Name</label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="text-2xl font-bold bg-gray-50 border-none rounded-2xl px-6 py-4 w-full focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      placeholder="Display Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="text-gray-600 bg-gray-50 border-none rounded-2xl px-6 py-4 w-full focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none h-32"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isUploading || isSaving}
                      className="flex-1 py-4 bg-black text-white font-black rounded-2xl hover:opacity-90 shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isUploading || isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setPreviews({ avatar: '', cover: '' });
                      }}
                      className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-4xl font-black text-gray-900 leading-tight">{viewedProfile?.displayName}</h1>
                      <p className="text-lg font-bold text-blue-500">@{viewedProfile?.username}</p>
                    </div>
                    
                    {isOwnProfile ? (
                      <button
                        onClick={handleEditClick}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-gray-100 rounded-2xl font-black text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95 shadow-sm"
                      >
                        <FaEdit />
                        Edit Profile
                      </button>
                    ) : account && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => router.push(`/messages?u=${viewedProfile.userAddress}`)}
                          className="flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-gray-100 rounded-2xl font-black text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95 shadow-sm"
                        >
                          <FaPaperPlane className="text-sm" />
                          Message
                        </button>
                        <button
                          onClick={handleFollowAction}
                          className={`flex items-center justify-center gap-2 px-10 py-3.5 rounded-2xl font-black transition-all active:scale-95 shadow-xl ${
                            isFollowingState 
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                          }`}
                        >
                          {isFollowingState ? (
                            <><FaUserCheck /> Following</>
                          ) : (
                            <><FaUserPlus /> Follow</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mt-6 text-lg font-medium leading-relaxed max-w-2xl">
                    {viewedProfile?.bio || "This user hasn't added a bio yet."}
                  </p>
                  
                  <div className="flex flex-wrap gap-8 mt-8 justify-center md:justify-start">
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-gray-900">{viewedProfile?.postsCount}</span>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Posts</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-gray-900">{viewedProfile?.followersCount}</span>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Followers</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black text-gray-900">{viewedProfile?.followingCount}</span>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Following</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Posts Section */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">User Posts</h2>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {userPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold">No posts shared yet 🇪🇹</p>
            </div>
          ) : (
            <div className="space-y-8">
              {userPosts.map((post: any) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={likePost} 
                  onComment={(content: string) => addComment(post.id, content)}  // ✅ FIXED
                  hasLiked={false}
                  authorProfile={viewedProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}