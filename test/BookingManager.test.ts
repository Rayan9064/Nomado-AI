import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("BookingManager", function () {
  // Booking types enum
  const BookingType = {
    FLIGHT: 0,
    HOTEL: 1,
    COWORKING: 2,
    OTHER: 3,
  };

  // Booking status enum
  const BookingStatus = {
    PENDING: 0,
    CONFIRMED: 1,
    CANCELLED: 2,
    COMPLETED: 3,
    REFUNDED: 4,
  };

  async function deployBookingManagerFixture() {
    const [owner, customer, feeRecipient, otherAccount] = await ethers.getSigners();

    const BookingManager = await ethers.getContractFactory("BookingManager");
    const bookingManager = await upgrades.deployProxy(
      BookingManager,
      [owner.address, feeRecipient.address, 250], // 2.5% platform fee
      { initializer: "initialize" }
    );

    await bookingManager.waitForDeployment();

    return { bookingManager, owner, customer, feeRecipient, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { bookingManager, owner } = await loadFixture(deployBookingManagerFixture);
      expect(await bookingManager.owner()).to.equal(owner.address);
    });

    it("Should set the right fee recipient", async function () {
      const { bookingManager, feeRecipient } = await loadFixture(deployBookingManagerFixture);
      expect(await bookingManager.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set the right platform fee", async function () {
      const { bookingManager } = await loadFixture(deployBookingManagerFixture);
      expect(await bookingManager.platformFeePercent()).to.equal(250);
    });
  });

  describe("Booking Creation", function () {
    it("Should create a booking successfully", async function () {
      const { bookingManager, customer } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400; // 1 day from now
      const refundDeadline = serviceDate - 3600; // 1 hour before service
      const bookingAmount = ethers.parseEther("1.0");

      await expect(
        bookingManager.connect(customer).createBooking(
          BookingType.HOTEL,
          serviceDate,
          "QmTestHash123",
          true,
          refundDeadline,
          { value: bookingAmount }
        )
      ).to.emit(bookingManager, "BookingCreated")
        .withArgs(
          1,
          customer.address,
          BookingType.HOTEL,
          bookingAmount,
          serviceDate,
          "QmTestHash123"
        );

      const booking = await bookingManager.getBooking(1);
      expect(booking.customer).to.equal(customer.address);
      expect(booking.bookingType).to.equal(BookingType.HOTEL);
      expect(booking.amount).to.equal(bookingAmount);
      expect(booking.status).to.equal(BookingStatus.PENDING);
    });

    it("Should reject booking with zero amount", async function () {
      const { bookingManager, customer } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      
      await expect(
        bookingManager.connect(customer).createBooking(
          BookingType.FLIGHT,
          serviceDate,
          "QmTestHash123",
          false,
          0,
          { value: 0 }
        )
      ).to.be.revertedWith("Booking amount must be greater than 0");
    });

    it("Should reject booking with past service date", async function () {
      const { bookingManager, customer } = await loadFixture(deployBookingManagerFixture);
      
      const pastDate = (await time.latest()) - 86400; // 1 day ago
      
      await expect(
        bookingManager.connect(customer).createBooking(
          BookingType.FLIGHT,
          pastDate,
          "QmTestHash123",
          false,
          0,
          { value: ethers.parseEther("1.0") }
        )
      ).to.be.revertedWith("Service date must be in the future");
    });

    it("Should update booking counts correctly", async function () {
      const { bookingManager, customer } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      
      await bookingManager.connect(customer).createBooking(
        BookingType.HOTEL,
        serviceDate,
        "QmTestHash123",
        false,
        0,
        { value: ethers.parseEther("1.0") }
      );

      expect(await bookingManager.getTotalBookings()).to.equal(1);
      expect(await bookingManager.typeBookingCounts(BookingType.HOTEL)).to.equal(1);
      
      const userBookings = await bookingManager.getUserBookings(customer.address);
      expect(userBookings.length).to.equal(1);
      expect(userBookings[0]).to.equal(1);
    });
  });

  describe("Booking Confirmation", function () {
    it("Should allow owner to confirm booking", async function () {
      const { bookingManager, owner, customer } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      
      await bookingManager.connect(customer).createBooking(
        BookingType.FLIGHT,
        serviceDate,
        "QmTestHash123",
        false,
        0,
        { value: ethers.parseEther("1.0") }
      );

      await expect(bookingManager.connect(owner).confirmBooking(1))
        .to.emit(bookingManager, "BookingConfirmed")
        .withArgs(1, customer.address, anyValue);

      const booking = await bookingManager.getBooking(1);
      expect(booking.status).to.equal(BookingStatus.CONFIRMED);
      expect(booking.confirmedAt).to.be.gt(0);
    });

    it("Should not allow non-owner to confirm booking", async function () {
      const { bookingManager, customer, otherAccount } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      
      await bookingManager.connect(customer).createBooking(
        BookingType.FLIGHT,
        serviceDate,
        "QmTestHash123",
        false,
        0,
        { value: ethers.parseEther("1.0") }
      );

      await expect(
        bookingManager.connect(otherAccount).confirmBooking(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Booking Cancellation", function () {
    it("Should allow customer to cancel their own booking", async function () {
      const { bookingManager, customer } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      
      await bookingManager.connect(customer).createBooking(
        BookingType.HOTEL,
        serviceDate,
        "QmTestHash123",
        false,
        0,
        { value: ethers.parseEther("1.0") }
      );

      await expect(bookingManager.connect(customer).cancelBooking(1))
        .to.emit(bookingManager, "BookingCancelled")
        .withArgs(1, customer.address, anyValue, false);

      const booking = await bookingManager.getBooking(1);
      expect(booking.status).to.equal(BookingStatus.CANCELLED);
    });

    it("Should process refund for refundable booking within deadline", async function () {
      const { bookingManager, customer, feeRecipient } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      const refundDeadline = serviceDate - 3600;
      const bookingAmount = ethers.parseEther("1.0");
      
      await bookingManager.connect(customer).createBooking(
        BookingType.HOTEL,
        serviceDate,
        "QmTestHash123",
        true,
        refundDeadline,
        { value: bookingAmount }
      );

      const initialCustomerBalance = await ethers.provider.getBalance(customer.address);
      const initialFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);

      const tx = await bookingManager.connect(customer).cancelBooking(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(tx)
        .to.emit(bookingManager, "RefundIssued");

      const booking = await bookingManager.getBooking(1);
      expect(booking.status).to.equal(BookingStatus.REFUNDED);

      // Check balances
      const finalCustomerBalance = await ethers.provider.getBalance(customer.address);
      const finalFeeRecipientBalance = await ethers.provider.getBalance(feeRecipient.address);
      
      const platformFee = bookingAmount * BigInt(250) / BigInt(10000); // 2.5%
      const refundAmount = bookingAmount - platformFee;
      
      expect(finalCustomerBalance).to.be.closeTo(
        initialCustomerBalance + refundAmount - BigInt(gasUsed.toString()),
        ethers.parseEther("0.001") // Allow for small discrepancies
      );
      
      expect(finalFeeRecipientBalance).to.equal(
        initialFeeRecipientBalance + platformFee
      );
    });

    it("Should not allow non-customer to cancel booking", async function () {
      const { bookingManager, customer, otherAccount } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      
      await bookingManager.connect(customer).createBooking(
        BookingType.FLIGHT,
        serviceDate,
        "QmTestHash123",
        false,
        0,
        { value: ethers.parseEther("1.0") }
      );

      await expect(
        bookingManager.connect(otherAccount).cancelBooking(1)
      ).to.be.revertedWith("Not the booking customer");
    });
  });

  describe("Booking Completion", function () {
    it("Should allow owner to complete confirmed booking after service date", async function () {
      const { bookingManager, owner, customer } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      
      await bookingManager.connect(customer).createBooking(
        BookingType.COWORKING,
        serviceDate,
        "QmTestHash123",
        false,
        0,
        { value: ethers.parseEther("1.0") }
      );

      await bookingManager.connect(owner).confirmBooking(1);
      
      // Move time to after service date
      await time.increaseTo(serviceDate + 1);

      await expect(bookingManager.connect(owner).completeBooking(1))
        .to.emit(bookingManager, "BookingCompleted")
        .withArgs(1, customer.address, anyValue);

      const booking = await bookingManager.getBooking(1);
      expect(booking.status).to.equal(BookingStatus.COMPLETED);
    });

    it("Should not complete booking before service date", async function () {
      const { bookingManager, owner, customer } = await loadFixture(deployBookingManagerFixture);
      
      const serviceDate = (await time.latest()) + 86400;
      
      await bookingManager.connect(customer).createBooking(
        BookingType.COWORKING,
        serviceDate,
        "QmTestHash123",
        false,
        0,
        { value: ethers.parseEther("1.0") }
      );

      await bookingManager.connect(owner).confirmBooking(1);

      await expect(
        bookingManager.connect(owner).completeBooking(1)
      ).to.be.revertedWith("Service date not reached");
    });
  });

  describe("Platform Configuration", function () {
    it("Should allow owner to update platform fee", async function () {
      const { bookingManager, owner } = await loadFixture(deployBookingManagerFixture);
      
      const newFee = 300; // 3%
      await expect(bookingManager.connect(owner).updatePlatformFee(newFee))
        .to.emit(bookingManager, "PlatformFeeUpdated")
        .withArgs(newFee);

      expect(await bookingManager.platformFeePercent()).to.equal(newFee);
    });

    it("Should reject platform fee over 10%", async function () {
      const { bookingManager, owner } = await loadFixture(deployBookingManagerFixture);
      
      await expect(
        bookingManager.connect(owner).updatePlatformFee(1001) // 10.01%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow owner to pause and unpause", async function () {
      const { bookingManager, owner, customer } = await loadFixture(deployBookingManagerFixture);
      
      await bookingManager.connect(owner).pause();
      
      const serviceDate = (await time.latest()) + 86400;
      
      await expect(
        bookingManager.connect(customer).createBooking(
          BookingType.FLIGHT,
          serviceDate,
          "QmTestHash123",
          false,
          0,
          { value: ethers.parseEther("1.0") }
        )
      ).to.be.revertedWith("Pausable: paused");

      await bookingManager.connect(owner).unpause();
      
      await expect(
        bookingManager.connect(customer).createBooking(
          BookingType.FLIGHT,
          serviceDate,
          "QmTestHash123",
          false,
          0,
          { value: ethers.parseEther("1.0") }
        )
      ).to.emit(bookingManager, "BookingCreated");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle non-existent booking queries properly", async function () {
      const { bookingManager } = await loadFixture(deployBookingManagerFixture);
      
      await expect(
        bookingManager.getBooking(999)
      ).to.be.revertedWith("Booking does not exist");
    });

    it("Should handle empty user booking list", async function () {
      const { bookingManager, customer } = await loadFixture(deployBookingManagerFixture);
      
      const userBookings = await bookingManager.getUserBookings(customer.address);
      expect(userBookings.length).to.equal(0);
    });
  });
});
