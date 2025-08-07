import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("UserReputation", function () {
  async function deployUserReputationFixture() {
    const [owner, user1, user2, user3, authorizedContract] = await ethers.getSigners();

    const UserReputation = await ethers.getContractFactory("UserReputation");
    const userReputation = await upgrades.deployProxy(
      UserReputation,
      [owner.address],
      { initializer: "initialize" }
    );

    await userReputation.waitForDeployment();

    // Authorize a contract for testing
    await userReputation.connect(owner).setContractAuthorization(authorizedContract.address, true);

    return { userReputation, owner, user1, user2, user3, authorizedContract };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { userReputation, owner } = await loadFixture(deployUserReputationFixture);
      expect(await userReputation.owner()).to.equal(owner.address);
    });

    it("Should authorize contracts correctly", async function () {
      const { userReputation, authorizedContract } = await loadFixture(deployUserReputationFixture);
      expect(await userReputation.authorizedContracts(authorizedContract.address)).to.be.true;
    });
  });

  describe("User Registration", function () {
    it("Should register a new user", async function () {
      const { userReputation, user1 } = await loadFixture(deployUserReputationFixture);

      await expect(userReputation.connect(user1).registerUser())
        .to.emit(userReputation, "UserRegistered")
        .withArgs(user1.address, anyValue);

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.trustScore).to.equal(100); // Starting trust score
      expect(profile.isVerified).to.be.false;
      expect(profile.totalBookings).to.equal(0);
      expect(profile.isActive).to.be.true;
    });

    it("Should not allow double registration", async function () {
      const { userReputation, user1 } = await loadFixture(deployUserReputationFixture);

      await userReputation.connect(user1).registerUser();
      
      await expect(
        userReputation.connect(user1).registerUser()
      ).to.be.revertedWith("User already registered");
    });
  });

  describe("Review System", function () {
    beforeEach(async function () {
      const { userReputation, user1, user2 } = await loadFixture(deployUserReputationFixture);
      
      // Register users
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();
    });

    it("Should submit a review successfully", async function () {
      const { userReputation, user1, user2 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();

      await expect(
        userReputation.connect(user1).submitReview(
          user2.address,
          1, // booking ID
          5, // rating
          "Excellent service!"
        )
      ).to.emit(userReputation, "ReviewSubmitted")
        .withArgs(1, user1.address, user2.address, 1, 5, "Excellent service!");

      const review = await userReputation.getReview(1);
      expect(review.reviewer).to.equal(user1.address);
      expect(review.reviewee).to.equal(user2.address);
      expect(review.rating).to.equal(5);
      expect(review.comment).to.equal("Excellent service!");
      expect(review.isVerified).to.be.false;

      const user2Profile = await userReputation.getUserProfile(user2.address);
      expect(user2Profile.totalReviewsReceived).to.equal(1);
      expect(user2Profile.totalRatingPoints).to.equal(5);
    });

    it("Should auto-register user when submitting review", async function () {
      const { userReputation, user1, user2 } = await loadFixture(deployUserReputationFixture);
      
      // Only register user2
      await userReputation.connect(user2).registerUser();

      // user1 submits review without being registered
      await userReputation.connect(user1).submitReview(
        user2.address,
        1,
        4,
        "Good service"
      );

      const user1Profile = await userReputation.getUserProfile(user1.address);
      expect(user1Profile.isActive).to.be.true;
      expect(user1Profile.trustScore).to.equal(100);
    });

    it("Should reject invalid ratings", async function () {
      const { userReputation, user1, user2 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();

      await expect(
        userReputation.connect(user1).submitReview(user2.address, 1, 0, "Bad rating")
      ).to.be.revertedWith("Invalid rating");

      await expect(
        userReputation.connect(user1).submitReview(user2.address, 1, 6, "Bad rating")
      ).to.be.revertedWith("Invalid rating");
    });

    it("Should not allow self-reviews", async function () {
      const { userReputation, user1 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();

      await expect(
        userReputation.connect(user1).submitReview(user1.address, 1, 5, "Self review")
      ).to.be.revertedWith("Cannot review yourself");
    });

    it("Should prevent duplicate reviews for same booking", async function () {
      const { userReputation, user1, user2 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();

      await userReputation.connect(user1).submitReview(user2.address, 1, 5, "First review");
      
      await expect(
        userReputation.connect(user1).submitReview(user2.address, 1, 4, "Second review")
      ).to.be.revertedWith("Review already submitted for this booking");
    });

    it("Should verify reviews correctly", async function () {
      const { userReputation, user1, user2, authorizedContract } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();

      await userReputation.connect(user1).submitReview(user2.address, 1, 5, "Great service!");
      
      await userReputation.connect(authorizedContract).verifyReview(1);
      
      const review = await userReputation.getReview(1);
      expect(review.isVerified).to.be.true;
    });
  });

  describe("Booking Statistics", function () {
    it("Should update booking stats correctly", async function () {
      const { userReputation, user1, authorizedContract } = await loadFixture(deployUserReputationFixture);

      // Update stats for completed booking
      await userReputation.connect(authorizedContract).updateBookingStats(user1.address, true, false);

      let profile = await userReputation.getUserProfile(user1.address);
      expect(profile.totalBookings).to.equal(1);
      expect(profile.completedBookings).to.equal(1);
      expect(profile.cancelledBookings).to.equal(0);
      expect(profile.isActive).to.be.true;

      // Update stats for cancelled booking
      await userReputation.connect(authorizedContract).updateBookingStats(user1.address, false, true);

      profile = await userReputation.getUserProfile(user1.address);
      expect(profile.totalBookings).to.equal(2);
      expect(profile.completedBookings).to.equal(1);
      expect(profile.cancelledBookings).to.equal(1);
    });

    it("Should auto-register user when updating booking stats", async function () {
      const { userReputation, user1, authorizedContract } = await loadFixture(deployUserReputationFixture);

      await userReputation.connect(authorizedContract).updateBookingStats(user1.address, true, false);

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.isActive).to.be.true;
      expect(profile.trustScore).to.equal(100);
    });
  });

  describe("Trust Score Calculation", function () {
    it("Should increase trust score for completed bookings", async function () {
      const { userReputation, user1, authorizedContract } = await loadFixture(deployUserReputationFixture);

      // Complete multiple bookings
      for (let i = 0; i < 5; i++) {
        await userReputation.connect(authorizedContract).updateBookingStats(user1.address, true, false);
      }

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.trustScore).to.be.gt(100); // Should be higher than starting score
    });

    it("Should decrease trust score for cancelled bookings", async function () {
      const { userReputation, user1, authorizedContract } = await loadFixture(deployUserReputationFixture);

      // Cancel multiple bookings
      for (let i = 0; i < 10; i++) {
        await userReputation.connect(authorizedContract).updateBookingStats(user1.address, false, true);
      }

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.trustScore).to.be.lt(100); // Should be lower than starting score
    });

    it("Should increase trust score for positive reviews", async function () {
      const { userReputation, user1, user2, user3 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();
      await userReputation.connect(user3).registerUser();

      // Submit multiple positive reviews
      await userReputation.connect(user2).submitReview(user1.address, 1, 5, "Excellent!");
      await userReputation.connect(user3).submitReview(user1.address, 2, 5, "Amazing!");

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.trustScore).to.be.gt(100);
    });

    it("Should decrease trust score for negative reviews", async function () {
      const { userReputation, user1, user2, user3 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();
      await userReputation.connect(user3).registerUser();

      // Submit multiple negative reviews
      await userReputation.connect(user2).submitReview(user1.address, 1, 1, "Terrible!");
      await userReputation.connect(user3).submitReview(user1.address, 2, 2, "Poor service!");

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.trustScore).to.be.lt(100);
    });

    it("Should maintain minimum trust score of 1", async function () {
      const { userReputation, user1, user2, authorizedContract } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();

      // Create extremely negative scenario
      for (let i = 0; i < 50; i++) {
        await userReputation.connect(authorizedContract).updateBookingStats(user1.address, false, true);
        await userReputation.connect(user2).submitReview(user1.address, i + 1, 1, "Bad");
      }

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.trustScore).to.be.gte(1);
    });

    it("Should cap trust score at 1000", async function () {
      const { userReputation, user1, user2, authorizedContract } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();

      // Create extremely positive scenario
      for (let i = 0; i < 100; i++) {
        await userReputation.connect(authorizedContract).updateBookingStats(user1.address, true, false);
        await userReputation.connect(user2).submitReview(user1.address, i + 1, 5, "Perfect");
      }

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.trustScore).to.be.lte(1000);
    });
  });

  describe("User Verification", function () {
    it("Should verify user and boost trust score", async function () {
      const { userReputation, user1, owner } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      const initialProfile = await userReputation.getUserProfile(user1.address);
      const initialTrustScore = initialProfile.trustScore;

      await expect(userReputation.connect(owner).verifyUser(user1.address))
        .to.emit(userReputation, "UserVerified")
        .withArgs(user1.address);

      const profile = await userReputation.getUserProfile(user1.address);
      expect(profile.isVerified).to.be.true;
      expect(profile.trustScore).to.equal(initialTrustScore + BigInt(50));
    });

    it("Should not allow non-owner to verify users", async function () {
      const { userReputation, user1, user2 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();

      await expect(
        userReputation.connect(user2).verifyUser(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    it("Should calculate average rating correctly", async function () {
      const { userReputation, user1, user2, user3 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();
      await userReputation.connect(user3).registerUser();

      await userReputation.connect(user2).submitReview(user1.address, 1, 4, "Good");
      await userReputation.connect(user3).submitReview(user1.address, 2, 5, "Great");

      const averageRating = await userReputation.getUserAverageRating(user1.address);
      expect(averageRating).to.equal(450); // (4 + 5) / 2 * 100 = 450
    });

    it("Should return zero average for users with no reviews", async function () {
      const { userReputation, user1 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();

      const averageRating = await userReputation.getUserAverageRating(user1.address);
      expect(averageRating).to.equal(0);
    });

    it("Should check user standing correctly", async function () {
      const { userReputation, user1 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();

      expect(await userReputation.isUserInGoodStanding(user1.address, 50)).to.be.true;
      expect(await userReputation.isUserInGoodStanding(user1.address, 150)).to.be.false;
    });

    it("Should return user reviews correctly", async function () {
      const { userReputation, user1, user2, user3 } = await loadFixture(deployUserReputationFixture);
      
      await userReputation.connect(user1).registerUser();
      await userReputation.connect(user2).registerUser();
      await userReputation.connect(user3).registerUser();

      await userReputation.connect(user2).submitReview(user1.address, 1, 4, "Good");
      await userReputation.connect(user3).submitReview(user1.address, 2, 5, "Great");

      const receivedReviews = await userReputation.getUserReviews(user1.address);
      const givenReviews = await userReputation.getUserGivenReviews(user2.address);

      expect(receivedReviews.length).to.equal(2);
      expect(givenReviews.length).to.equal(1);
      expect(receivedReviews[0]).to.equal(1);
      expect(receivedReviews[1]).to.equal(2);
      expect(givenReviews[0]).to.equal(1);
    });
  });

  describe("Authorization", function () {
    it("Should allow owner to authorize/unauthorize contracts", async function () {
      const { userReputation, owner, user1 } = await loadFixture(deployUserReputationFixture);

      await expect(userReputation.connect(owner).setContractAuthorization(user1.address, true))
        .to.emit(userReputation, "ContractAuthorized")
        .withArgs(user1.address, true);

      expect(await userReputation.authorizedContracts(user1.address)).to.be.true;

      await userReputation.connect(owner).setContractAuthorization(user1.address, false);
      expect(await userReputation.authorizedContracts(user1.address)).to.be.false;
    });

    it("Should not allow unauthorized contracts to update booking stats", async function () {
      const { userReputation, user1, user2 } = await loadFixture(deployUserReputationFixture);

      await expect(
        userReputation.connect(user2).updateBookingStats(user1.address, true, false)
      ).to.be.revertedWith("Not authorized");
    });
  });
});
