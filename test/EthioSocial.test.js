const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EthioSocial", function () {
  let ethioSocial;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const EthioSocial = await ethers.getContractFactory("EthioSocial");
    ethioSocial = await EthioSocial.deploy();
    await ethioSocial.waitForDeployment();
  });

  describe("Profile Management", function () {
    it("Should create a profile", async function () {
      await ethioSocial.connect(user1).createProfile(
        "testuser",
        "Test User",
        "This is a test bio",
        "avatarHash",
        "coverHash"
      );

      const profile = await ethioSocial.getProfile(user1.address);
      expect(profile.username).to.equal("testuser");
      expect(profile.displayName).to.equal("Test User");
      expect(profile.bio).to.equal("This is a test bio");
      expect(profile.isActive).to.be.true;
    });

    it("Should not allow duplicate usernames", async function () {
      await ethioSocial.connect(user1).createProfile(
        "testuser",
        "Test User",
        "Bio",
        "avatar",
        "cover"
      );

      await expect(
        ethioSocial.connect(user2).createProfile(
          "testuser",
          "Another User",
          "Bio",
          "avatar",
          "cover"
        )
      ).to.be.revertedWith("Username taken");
    });

    it("Should update profile", async function () {
      await ethioSocial.connect(user1).createProfile(
        "testuser",
        "Test User",
        "Bio",
        "avatar",
        "cover"
      );

      await ethioSocial.connect(user1).updateProfile(
        "newuser",
        "New User",
        "New bio",
        "newAvatar",
        "newCover"
      );

      const profile = await ethioSocial.getProfile(user1.address);
      expect(profile.username).to.equal("newuser");
      expect(profile.displayName).to.equal("New User");
      expect(profile.bio).to.equal("New bio");
    });
  });

  describe("Post Management", function () {
    beforeEach(async function () {
      await ethioSocial.connect(user1).createProfile(
        "testuser",
        "Test User",
        "Bio",
        "avatar",
        "cover"
      );
    });

    it("Should create a post", async function () {
      await ethioSocial.connect(user1).createPost(
        "Hello, world!",
        "",
        0, // TEXT
        []
      );

      const posts = await ethioSocial.getUserPosts(user1.address);
      expect(posts.length).to.equal(1);

      const post = await ethioSocial.getPost(posts[0]);
      expect(post.content).to.equal("Hello, world!");
      expect(post.author).to.equal(user1.address);
      expect(post.likes).to.equal(0);
    });

    it("Should like and unlike posts", async function () {
      await ethioSocial.connect(user1).createPost(
        "Test post",
        "",
        0,
        []
      );

      const posts = await ethioSocial.getUserPosts(user1.address);
      const postId = posts[0];

      // Like post
      await ethioSocial.connect(user2).likePost(postId);
      let post = await ethioSocial.getPost(postId);
      expect(post.likes).to.equal(1);
      expect(await ethioSocial.hasLikedPost(postId, user2.address)).to.be.true;

      // Unlike post
      await ethioSocial.connect(user2).unlikePost(postId);
      post = await ethioSocial.getPost(postId);
      expect(post.likes).to.equal(0);
      expect(await ethioSocial.hasLikedPost(postId, user2.address)).to.be.false;
    });

    it("Should tip posts", async function () {
      await ethioSocial.connect(user1).createPost(
        "Test post",
        "",
        0,
        []
      );

      const posts = await ethioSocial.getUserPosts(user1.address);
      const postId = posts[0];

      const tipAmount = ethers.parseEther("0.1");
      
      await expect(
        ethioSocial.connect(user2).tipPost(postId, { value: tipAmount })
      ).to.changeEtherBalance(user1, tipAmount);

      const post = await ethioSocial.getPost(postId);
      expect(post.tips).to.equal(tipAmount);
    });
  });

  describe("Social Features", function () {
    beforeEach(async function () {
      await ethioSocial.connect(user1).createProfile(
        "user1",
        "User One",
        "Bio1",
        "avatar1",
        "cover1"
      );

      await ethioSocial.connect(user2).createProfile(
        "user2",
        "User Two",
        "Bio2",
        "avatar2",
        "cover2"
      );
    });

    it("Should follow and unfollow users", async function () {
      // Follow
      await ethioSocial.connect(user1).followUser(user2.address);
      expect(await ethioSocial.isFollowing(user1.address, user2.address)).to.be.true;

      let profile1 = await ethioSocial.getProfile(user1.address);
      let profile2 = await ethioSocial.getProfile(user2.address);
      expect(profile1.followingCount).to.equal(1);
      expect(profile2.followersCount).to.equal(1);

      // Unfollow
      await ethioSocial.connect(user1).unfollowUser(user2.address);
      expect(await ethioSocial.isFollowing(user1.address, user2.address)).to.be.false;

      profile1 = await ethioSocial.getProfile(user1.address);
      profile2 = await ethioSocial.getProfile(user2.address);
      expect(profile1.followingCount).to.equal(0);
      expect(profile2.followersCount).to.equal(0);
    });

    it("Should not allow self-following", async function () {
      await expect(
        ethioSocial.connect(user1).followUser(user1.address)
      ).to.be.revertedWith("Cannot follow yourself");
    });
  });

  describe("Comments", function () {
    beforeEach(async function () {
      await ethioSocial.connect(user1).createProfile(
        "testuser",
        "Test User",
        "Bio",
        "avatar",
        "cover"
      );

      await ethioSocial.connect(user1).createPost(
        "Test post",
        "",
        0,
        []
      );
    });

    it("Should add comments", async function () {
      const posts = await ethioSocial.getUserPosts(user1.address);
      const postId = posts[0];

      await ethioSocial.connect(user2).createProfile(
        "commenter",
        "Commenter",
        "Bio",
        "avatar",
        "cover"
      );

      await ethioSocial.connect(user2).addComment(
        postId,
        "Great post!"
      );

      const comments = await ethioSocial.getComments(postId);
      expect(comments.length).to.equal(1);
      expect(comments[0].content).to.equal("Great post!");
      expect(comments[0].author).to.equal(user2.address);

      const post = await ethioSocial.getPost(postId);
      expect(post.commentCount).to.equal(1);
    });
  });
});
