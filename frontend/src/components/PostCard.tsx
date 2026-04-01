import { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaSpinner } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { getIPFSUrl } from '../utils/ipfs';
import Link from 'next/link';
import { useEthioSocial } from '../hooks/useEthioSocial';

interface PostCardProps {
  post: {
    id: number;
    author: string;
    content: string;
    mediaHash: string;
    timestamp: number;
    likes: number;
    commentCount: number;
  };
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  hasLiked: boolean;
  authorProfile?: {
    username: string;
    displayName: string;
    avatarHash: string;
  };
}

export default function PostCard({ post, onLike, onComment, hasLiked, authorProfile: initialAuthorProfile }: PostCardProps) {
  const { loadUserProfile } = useEthioSocial();
  const [isLiking, setIsLiking] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(initialAuthorProfile);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!initialAuthorProfile);

  useEffect(() => {
    if (!initialAuthorProfile && post.author) {
      const fetchProfile = async () => {
        try {
          const profile = await loadUserProfile(post.author);
          if (profile) {
            setAuthorProfile({
              username: profile.username,
              displayName: profile.displayName,
              avatarHash: profile.avatarHash
            });
          }
        } catch (error) {
          console.error('Error fetching post author profile:', error);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [initialAuthorProfile, post.author, loadUserProfile]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await onLike(post.id);
    setIsLiking(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
      {/* Author Info */}
      <div className="flex items-start gap-3">
        <Link href={`/profile/${authorProfile?.username || post.author}`}>
          <div className="w-12 h-12 bg-gradient-to-tr from-ethiopian-green via-ethiopian-yellow to-ethiopian-red rounded-xl flex items-center justify-center text-white font-bold text-xl cursor-pointer overflow-hidden shadow-sm">
            {isLoadingProfile ? (
              <FaSpinner className="animate-spin text-sm" />
            ) : authorProfile?.avatarHash ? (
              <img 
                src={getIPFSUrl(authorProfile.avatarHash)} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              authorProfile?.displayName?.charAt(0) || post.author.charAt(2).toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${authorProfile?.username || post.author}`}>
              <span className="font-bold text-gray-900 hover:text-blue-600 cursor-pointer truncate">
                {isLoadingProfile ? 'Loading...' : authorProfile?.displayName || `${post.author.slice(0, 6)}...${post.author.slice(-4)}`}
              </span>
            </Link>
            {!isLoadingProfile && (
              <span className="text-sm text-gray-400 truncate">
                @{authorProfile?.username || 'anonymous'}
              </span>
            )}
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(post.timestamp * 1000)} ago
            </span>
          </div>
          
          {/* Post Content */}
          <p className="text-gray-800 mt-2 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          
          {/* Post Image */}
          {post.mediaHash && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-gray-50 shadow-sm">
              <img
                src={getIPFSUrl(post.mediaHash)}
                alt="Post content"
                className="max-h-[500px] w-full object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-8 mt-5 pt-4 border-t border-gray-50">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 transition-colors group ${hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
              <div className={`p-2 rounded-full transition-all ${hasLiked ? 'bg-red-50' : 'group-hover:bg-red-50'}`}>
                {hasLiked ? <FaHeart className="text-lg" /> : <FaRegHeart className="text-lg" />}
              </div>
              <span className="text-sm font-bold">{post.likes}</span>
            </button>
            
            <button
              onClick={() => onComment(post.id)}
              className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-all">
                <FaComment className="text-lg" />
              </div>
              <span className="text-sm font-bold">{post.commentCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
