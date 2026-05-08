import { getDb, type Coupon } from "@/lib/db"
import CouponManager from "./CouponManager"

export default async function CouponsPage() {
  const db = await getDb()
  const coupons = await db.collection<Coupon>("coupons").find({}).sort({ createdAt: -1 }).toArray()

  const serialized = coupons.map((c) => ({
    ...c,
    _id: String(c._id),
    startsAt: c.startsAt?.toISOString(),
    expiresAt: c.expiresAt?.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Coupons</h1>
          <p className="admin-page-sub">Create and manage discount codes for checkout</p>
        </div>
      </div>
      <CouponManager initialCoupons={serialized as any} />
    </>
  )
}
