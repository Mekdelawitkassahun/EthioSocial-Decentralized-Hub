import { useState } from 'react';
import { FaImage, FaVideo, FaLink, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { uploadPostImage, getIPFSUrl } from '../utils/ipfs';
import { PostType } from '../types';

interface CreatePostProps {
  onCreatePost: (content: string, mediaHash: string, postType: PostType) => Promise<void>;
  profile: any;
}

export default function CreatePost({ onCreatePost, profile }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) {
      toast.error('Please write something or add an image');
      return;
    }

    setIsCreating(true);
    let mediaHash = '';

    if (selectedFile) {
      setIsUploading(true);
      try {
        mediaHash = await uploadPostImage(selectedFile);
        toast.success('Image uploaded to IPFS!');
      } catch (error) {
        toast.error('Failed to upload image');
        setIsCreating(false);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    try {
      // Fixed: Removed the 4th argument (empty tags array)
      await onCreatePost(content, mediaHash, selectedFile ? PostType.IMAGE : PostType.TEXT);
      setContent('');
      setSelectedFile(null);
      setImagePreview(null);
      toast.success('Post shared successfully! 🇪🇹');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 mb-10 transition-all hover:shadow-xl hover:shadow-gray-200/50">
      <div className="flex gap-4">
        <div className="w-14 h-14 bg-gradient-to-tr from-ethiopian-green via-ethiopian-yellow to-ethiopian-red rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl shadow-sm ring-4 ring-gray-50 overflow-hidden">
          {profile?.avatarHash ? (
            <img src={getIPFSUrl(profile.avatarHash)} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            profile?.displayName?.charAt(0) || '?'
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in Ethiopia? 🇪🇹"
            className="w-full py-4 bg-transparent text-lg text-gray-800 placeholder:text-gray-300 outline-none resize-none min-h-[120px] font-medium"
          />
          
          {imagePreview && (
            <div className="relative mt-4 group">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-[400px] w-full object-cover rounded-[2rem] border border-gray-100 shadow-lg"
              />
              <button
                onClick={removeImage}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-500 transition-all shadow-lg active:scale-95"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
            <div className="flex gap-2">
              <label className="cursor-pointer w-12 h-12 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all group">
                <FaImage className="text-xl group-hover:scale-110 transition-transform" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileSelect}
                />
              </label>
              <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all group">
                <FaVideo className="text-xl group-hover:scale-110 transition-transform" />
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all group">
                <FaLink className="text-xl group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isCreating || isUploading || (!content.trim() && !selectedFile)}
              className="flex items-center gap-3 px-10 py-4 bg-black text-white rounded-[1.5rem] hover:opacity-90 transition-all disabled:opacity-20 font-black shadow-xl shadow-gray-200 active:scale-95"
            >
              {isCreating || isUploading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPaperPlane className="text-sm" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Share Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}