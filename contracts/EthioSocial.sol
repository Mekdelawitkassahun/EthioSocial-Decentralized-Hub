// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EthioSocial is Ownable, ReentrancyGuard {
    
    // ============ STRUCTURES ============
    
    struct Profile {
        address userAddress;
        string username;
        string displayName;
        string bio;
        string avatarHash;
        string coverImageHash;
        uint256 followersCount;
        uint256 followingCount;
        uint256 postsCount;
        uint256 createdAt;
        bool isActive;
    }
    
    enum PostType { TEXT, IMAGE, VIDEO, AUDIO, LINK }
    
    struct Post {
        uint256 id;
        address author;
        string content;
        string mediaHash;
        PostType postType;
        uint256 timestamp;
        uint256 likes;
        uint256 tips;
        string[] tags;
        uint256 commentCount;
    }
    
    struct Comment {
        uint256 id;
        uint256 postId;
        address author;
        string content;
        uint256 timestamp;
        uint256 likes;
    }

    struct Message {
        uint256 id;
        address sender;
        address receiver;
        string content;
        uint256 timestamp;
        bool isRead;
    }
    
    // ============ STATE VARIABLES ============
    
    uint256 private _postIdCounter = 0;
    uint256 private _commentIdCounter = 0;
    uint256 private _messageIdCounter = 0;
    
    mapping(address => Profile) public profiles;
    mapping(string => address) public usernameToAddress;
    mapping(uint256 => Post) public posts;
    mapping(uint256 => Comment[]) public postComments;
    mapping(uint256 => mapping(address => bool)) public postLikes;
    mapping(uint256 => mapping(address => bool)) public commentLikes;
    mapping(address => mapping(address => bool)) public follows;
    mapping(address => uint256[]) public userPosts;
    
    // Direct Messages
    mapping(address => mapping(address => Message[])) private _messages;
    mapping(address => address[]) private _conversations;
    
    // ============ EVENTS ============
    
    event ProfileCreated(address indexed user, string username, string displayName);
    event ProfileUpdated(address indexed user, string username, string displayName);
    event PostCreated(uint256 indexed postId, address indexed author, string content, PostType postType);
    event PostLiked(uint256 indexed postId, address indexed user);
    event PostUnliked(uint256 indexed postId, address indexed user);
    event TipSent(uint256 indexed postId, address indexed tipper, uint256 amount);
    event CommentAdded(uint256 indexed postId, uint256 indexed commentId, address indexed author);
    event Followed(address indexed follower, address indexed following);
    event Unfollowed(address indexed follower, address indexed following);
    event MessageSent(address indexed sender, address indexed receiver, string content);
    
    // ============ MODIFIERS ============
    
    modifier onlyExistingProfile() {
        require(profiles[msg.sender].userAddress != address(0), "Profile not found");
        _;
    }
    
    modifier onlyValidUsername(string memory username) {
        require(bytes(username).length >= 3, "Username too short");
        require(bytes(username).length <= 30, "Username too long");
        _;
    }
    
    // ============ PROFILE MANAGEMENT ============
    
    constructor() Ownable(msg.sender) ReentrancyGuard() {}
    
    function createProfile(
        string memory username,
        string memory displayName,
        string memory bio,
        string memory avatarHash,
        string memory coverImageHash
    ) external onlyValidUsername(username) {
        require(profiles[msg.sender].userAddress == address(0), "Profile already exists");
        require(usernameToAddress[username] == address(0), "Username taken");
        
        profiles[msg.sender] = Profile({
            userAddress: msg.sender,
            username: username,
            displayName: displayName,
            bio: bio,
            avatarHash: avatarHash,
            coverImageHash: coverImageHash,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            createdAt: block.timestamp,
            isActive: true
        });
        
        usernameToAddress[username] = msg.sender;
        
        emit ProfileCreated(msg.sender, username, displayName);
    }
    
    function updateProfile(
        string memory username,
        string memory displayName,
        string memory bio,
        string memory avatarHash,
        string memory coverImageHash
    ) external onlyExistingProfile onlyValidUsername(username) {
        Profile storage profile = profiles[msg.sender];
        
        if (keccak256(bytes(profile.username)) != keccak256(bytes(username))) {
            require(usernameToAddress[username] == address(0), "Username taken");
            usernameToAddress[profile.username] = address(0);
            usernameToAddress[username] = msg.sender;
        }
        
        profile.username = username;
        profile.displayName = displayName;
        profile.bio = bio;
        profile.avatarHash = avatarHash;
        profile.coverImageHash = coverImageHash;
        
        emit ProfileUpdated(msg.sender, username, displayName);
    }
    
    function getProfile(address user) external view returns (Profile memory) {
        return profiles[user];
    }
    
    function getProfileByUsername(string memory username) external view returns (Profile memory) {
        address userAddress = usernameToAddress[username];
        require(userAddress != address(0), "User not found");
        return profiles[userAddress];
    }
    
    // ============ POST MANAGEMENT ============
    
    function createPost(
        string memory content,
        string memory mediaHash,
        PostType postType,
        string[] memory tags
    ) external onlyExistingProfile {
        require(bytes(content).length > 0 || bytes(mediaHash).length > 0, "Content required");
        
        _postIdCounter++;
        uint256 newPostId = _postIdCounter;
        
        posts[newPostId] = Post({
            id: newPostId,
            author: msg.sender,
            content: content,
            mediaHash: mediaHash,
            postType: postType,
            timestamp: block.timestamp,
            likes: 0,
            tips: 0,
            tags: tags,
            commentCount: 0
        });
        
        userPosts[msg.sender].push(newPostId);
        profiles[msg.sender].postsCount++;
        
        emit PostCreated(newPostId, msg.sender, content, postType);
    }
    
    function likePost(uint256 postId) external {
        require(posts[postId].author != address(0), "Post not found");
        require(!postLikes[postId][msg.sender], "Already liked");
        
        postLikes[postId][msg.sender] = true;
        posts[postId].likes++;
        
        emit PostLiked(postId, msg.sender);
    }
    
    function unlikePost(uint256 postId) external {
        require(posts[postId].author != address(0), "Post not found");
        require(postLikes[postId][msg.sender], "Not liked");
        
        postLikes[postId][msg.sender] = false;
        posts[postId].likes--;
        
        emit PostUnliked(postId, msg.sender);
    }
    
    function tipPost(uint256 postId) external payable nonReentrant {
        require(posts[postId].author != address(0), "Post not found");
        require(msg.value > 0, "Tip amount must be greater than 0");
        
        address author = posts[postId].author;
        posts[postId].tips += msg.value;
        
        (bool sent, ) = author.call{value: msg.value}("");
        require(sent, "Failed to send tip");
        
        emit TipSent(postId, msg.sender, msg.value);
    }
    
    function addComment(uint256 postId, string memory content) external onlyExistingProfile {
        require(posts[postId].author != address(0), "Post not found");
        require(bytes(content).length > 0, "Comment cannot be empty");
        
        _commentIdCounter++;
        uint256 newCommentId = _commentIdCounter;
        
        Comment memory newComment = Comment({
            id: newCommentId,
            postId: postId,
            author: msg.sender,
            content: content,
            timestamp: block.timestamp,
            likes: 0
        });
        
        postComments[postId].push(newComment);
        posts[postId].commentCount++;
        
        emit CommentAdded(postId, newCommentId, msg.sender);
    }
    
    function getPost(uint256 postId) external view returns (Post memory) {
        require(posts[postId].author != address(0), "Post not found");
        return posts[postId];
    }
    
    function getUserPosts(address user) external view returns (uint256[] memory) {
        return userPosts[user];
    }
    
    function getComments(uint256 postId) external view returns (Comment[] memory) {
        return postComments[postId];
    }
    
    // ============ SOCIAL MANAGEMENT ============
    
    function followUser(address userToFollow) external onlyExistingProfile {
        require(userToFollow != msg.sender, "Cannot follow yourself");
        require(profiles[userToFollow].userAddress != address(0), "User not found");
        require(!follows[msg.sender][userToFollow], "Already following");
        
        follows[msg.sender][userToFollow] = true;
        profiles[msg.sender].followingCount++;
        profiles[userToFollow].followersCount++;
        
        emit Followed(msg.sender, userToFollow);
    }
    
    function unfollowUser(address userToUnfollow) external onlyExistingProfile {
        require(follows[msg.sender][userToUnfollow], "Not following");
        
        follows[msg.sender][userToUnfollow] = false;
        profiles[msg.sender].followingCount--;
        profiles[userToUnfollow].followersCount--;
        
        emit Unfollowed(msg.sender, userToUnfollow);
    }
    
    function isFollowing(address follower, address following) external view returns (bool) {
        return follows[follower][following];
    }
    
    function hasLikedPost(uint256 postId, address user) external view returns (bool) {
        return postLikes[postId][user];
    }

    // ============ MESSAGE MANAGEMENT ============

    function sendMessage(address receiver, string memory content) external onlyExistingProfile {
        require(receiver != address(0), "Invalid receiver");
        require(receiver != msg.sender, "Cannot message yourself");
        require(bytes(content).length > 0, "Empty message");

        _messageIdCounter++;
        Message memory newMessage = Message({
            id: _messageIdCounter,
            sender: msg.sender,
            receiver: receiver,
            content: content,
            timestamp: block.timestamp,
            isRead: false
        });

        _messages[msg.sender][receiver].push(newMessage);
        _messages[receiver][msg.sender].push(newMessage);

        // Track conversations
        _addConversation(msg.sender, receiver);
        _addConversation(receiver, msg.sender);

        emit MessageSent(msg.sender, receiver, content);
    }

    function getMessages(address otherUser) external view returns (Message[] memory) {
        return _messages[msg.sender][otherUser];
    }

    function getConversations() external view returns (address[] memory) {
        return _conversations[msg.sender];
    }

    function _addConversation(address user, address otherUser) private {
        bool exists = false;
        for (uint i = 0; i < _conversations[user].length; i++) {
            if (_conversations[user][i] == otherUser) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            _conversations[user].push(otherUser);
        }
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    function withdrawTips() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool sent, ) = owner().call{value: balance}("");
        require(sent, "Withdrawal failed");
    }
}
