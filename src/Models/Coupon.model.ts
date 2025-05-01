import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    BelongsTo,
  } from "sequelize-typescript";
  import CouponVendor from "./CouponVendor.model";
  
  @Table({
    tableName: "coupons",
    timestamps: true,
  })
  export default class Coupon extends Model {
    @PrimaryKey
    @Column(DataType.STRING)
    code!: string; // Must be unique, e.g., "ZOM25"
  
    @ForeignKey(() => CouponVendor)
    @Column(DataType.STRING)
    vendorId!: string;
  
    @BelongsTo(() => CouponVendor)
    vendor!: CouponVendor;
  
    @Column(DataType.STRING)
    description!: string;
  
    @Column(DataType.STRING)
    discount_type!: "percentage" | "flat";
  
    @Column(DataType.FLOAT)
    discount_value!: number;
  
    @Column(DataType.FLOAT)
    discount_max_limit!: number;
  
    @Column(DataType.DATE)
    expiry_date!: Date;
  
    @Column(DataType.INTEGER)
    minimum_order_value!: number;
  
    @Column(DataType.ARRAY(DataType.STRING))
    applicable_categories!: string[];
  
    @Column(DataType.STRING)
    status!: "active" | "expired" | "inactive";
  
    @Column(DataType.INTEGER)
    usage_limit_per_user!: number;
  
    @Column(DataType.INTEGER)
    usage_limit_global!: number;
  
    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    used_count!: number;
  
    @Column(DataType.STRING)
    created_by!: string;
  
    @CreatedAt
    createdAt!: Date;
  
    @UpdatedAt
    updatedAt!: Date;
  }
  