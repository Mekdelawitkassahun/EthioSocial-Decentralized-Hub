export interface Profile {
  userAddress: string;
  username: string;
  displayName: string;
  bio: string;
  avatarHash: string;
  coverImageHash: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: number;
  isActive: boolean;
}

export interface Post {
  id: number;
  author: string;
  content: string;
  mediaHash: string;
  postType: PostType;
  timestamp: number;
  likes: number;
  tips: number;
  tags: string[];
  commentCount: number;
}

export interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  timestamp: number;
  likes: number;
}

export enum PostType {
  TEXT = 0,
  IMAGE = 1,
  VIDEO = 2,
  AUDIO = 3,
  LINK = 4
}

export interface UploadResponse {
  ipfsHash: string;
  pinSize: number;
  timestamp: string;
}

export interface Message {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}
