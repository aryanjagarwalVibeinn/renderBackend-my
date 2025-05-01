import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Coupon from "../Models/Coupon.model";
import CouponVendor from "../Models/CouponVendor.model";
import UserCoupon from "../Models/UserCoupon.model";
import { MyRequest } from "../Interfaces/Request.interface";
import { Op } from "sequelize";

const SECRET_KEY = process.env.CLERK_SECRET_KEY as string;

// ✅ Add a new vendor
export const addCouponVendor = async (request: MyRequest, response: Response) => {
  try {
    const { vendorId, name, logoUrl, contactEmail } = request.body;

    const existing = await CouponVendor.findByPk(vendorId);
    if (existing) {
      return response.status(400).json({ message: "Vendor ID already exists" });
    }

    const vendor = await CouponVendor.create({ vendorId, name, logoUrl, contactEmail });

    return response.status(201).json({ message: "Vendor created", vendor });
  } catch (error: any) {
    console.error("❌ Error creating vendor:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Upload vendor coupons in bulk
export const addVendorCoupons = async (request: MyRequest, response: Response) => {
  try {
    const { vendorId, coupons } = request.body;

    const vendor = await CouponVendor.findByPk(vendorId);
    if (!vendor) {
      return response.status(404).json({ message: "Vendor not found" });
    }

    const formattedCoupons = coupons.map((c: any) => ({
      ...c,
      vendorId,
      status: "active",
      used_count: 0,
      created_by: vendorId,
    }));

    await Coupon.bulkCreate(formattedCoupons);

    return response.status(201).json({
      message: "Coupons added successfully",
      count: formattedCoupons.length,
    });
  } catch (error: any) {
    console.error("❌ Error adding coupons:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Get all vendors
export const getAllVendors = async (request: MyRequest, response: Response) => {
  try {
    const vendors = await CouponVendor.findAll();
    return response.status(200).json({ vendors });
  } catch (error: any) {
    console.error("❌ Error fetching vendors:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Get coupons by vendor
export const getVendorCoupons = async (request: MyRequest, response: Response) => {
  try {
    const { vendorId } = request.params;

    const coupons = await Coupon.findAll({
      where: { vendorId },
      order: [["createdAt", "DESC"]],
    });

    return response.status(200).json({ coupons });
  } catch (error: any) {
    console.error("❌ Error fetching vendor coupons:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Get current user's coupons
export const getUserCoupons = async (request: MyRequest, response: Response) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = (decodedToken as any).userId;
    if (!userId) {
      return response.status(401).json({ message: "Unauthorized: No userId in token" });
    }

    const coupons = await UserCoupon.findAll({
      where: { userId },
      include: [{ model: Coupon }],
      order: [["issuedAt", "DESC"]],
    });

    return response.status(200).json({ coupons });
  } catch (error: any) {
    console.error("❌ Error fetching user coupons:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Redeem a coupon
export const redeemCoupon = async (request: MyRequest, response: Response) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return response.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = (decodedToken as any).userId;
    if (!userId) {
      return response.status(401).json({ message: "Unauthorized: No userId in token" });
    }

    const { couponCode } = request.body;
    if (!couponCode) {
      return response.status(400).json({ message: "Coupon code is required" });
    }

    const userCoupon = await UserCoupon.findOne({
      where: {
        userId,
        couponCode,
        isRedeemed: false,
      },
    });

    if (!userCoupon) {
      return response.status(404).json({ message: "Coupon not found or already redeemed" });
    }

    userCoupon.isRedeemed = true;
    userCoupon.redeemedAt = new Date();
    await userCoupon.save();

    return response.status(200).json({ message: "Coupon redeemed successfully" });
  } catch (error: any) {
    console.error("❌ Error redeeming coupon:", error);
    return response.status(500).json({ message: "Internal server error", error: error.message });
  }
};
