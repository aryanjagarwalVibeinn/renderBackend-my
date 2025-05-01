import { Router, json } from "express";
import {
  addCouponVendor,
  addVendorCoupons,
  getAllVendors,
  getVendorCoupons,
  getUserCoupons,
  redeemCoupon,
} from "../Controller/Coupon.controller";
import { authenticate } from "../Config/clerksetup";
import { MyRequest } from "../Interfaces/Request.interface";

const router = Router();

// ✅ Add a new vendor (admin only)
router.post("/api/coupon/admin/vendor", json(), authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling POST /api/coupon/admin/vendor");
  addCouponVendor(request, response);
});

// ✅ Add bulk coupons for a vendor (admin only)
router.post("/api/coupon/admin/vendor-coupons", json(), authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling POST /api/coupon/admin/vendor-coupons");
  addVendorCoupons(request, response);
});

// ✅ Get all vendors
router.get("/api/coupon/vendors", authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling GET /api/coupon/vendors");
  getAllVendors(request, response);
});

// ✅ Get all coupons for a specific vendor
router.get("/api/coupon/vendor/:vendorId", authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling GET /api/coupon/vendor/:vendorId");
  getVendorCoupons(request, response);
});

// ✅ Get coupons assigned to the logged-in user
router.get("/api/coupon/user/my-coupons", authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling GET /api/coupon/user/my-coupons");
  getUserCoupons(request, response);
});

// ✅ Redeem a coupon
router.post("/api/coupon/user/redeem", json(), authenticate, (request: MyRequest, response) => {
  console.log("🟢 Handling POST /api/coupon/user/redeem");
  redeemCoupon(request, response);
});

export default router;
