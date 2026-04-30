import { getDb, type Coupon } from "../lib/db"

async function seedCoupons() {
  const db = await getDb()
  const coupons: Omit<Coupon, "_id">[] = [
    {
      code: "WELCOME10",
      isActive: true,
      discountType: "percent",
      discountValue: 10,
      currency: "ANY",
      maxUses: 100,
      perUserLimit: 1,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      usedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      code: "FLAT200",
      isActive: true,
      discountType: "flat",
      discountValue: 200,
      currency: "INR",
      minAmount: 500,
      maxUses: 50,
      perUserLimit: 2,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      usedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      code: "FIRSTUSER",
      isActive: true,
      discountType: "percent",
      discountValue: 15,
      currency: "ANY",
      maxUses: 200,
      perUserLimit: 1,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
      usedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  await db.collection("coupons").deleteMany({})
  await db.collection("coupons").insertMany(coupons)
  console.log("✅ Seeded coupons:", coupons.map((c) => c.code))
  process.exit(0)
}

seedCoupons().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
