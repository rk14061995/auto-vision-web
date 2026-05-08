import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb, makeCarSlug, type CarCatalog, type AccessoryCatalog } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

const SAMPLE_ACCESSORIES: Omit<AccessoryCatalog, "_id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Carbon Fiber Rear Spoiler",
    category: "Spoilers",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, 0.8, -1.2],
    isActive: true,
  },
  {
    name: "Ducktail Spoiler",
    category: "Spoilers",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, 0.75, -1.1],
    isActive: true,
  },
  {
    name: "Front Splitter",
    category: "Front Lips",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, -0.4, 1.3],
    isActive: true,
  },
  {
    name: "Aggressive Front Lip",
    category: "Front Lips",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, -0.45, 1.35],
    isActive: true,
  },
  {
    name: "Side Skirt Extensions",
    category: "Side Skirts",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0.9, -0.3, 0],
    isActive: true,
  },
  {
    name: "Rocker Panel Covers",
    category: "Side Skirts",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0.85, -0.35, 0],
    isActive: true,
  },
  {
    name: "Shark Fin Antenna",
    category: "Antennas",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, 0.85, 0.2],
    isActive: true,
  },
  {
    name: "Stubby Antenna",
    category: "Antennas",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0.3, 0.82, 0.4],
    isActive: true,
  },
  {
    name: "Crossbar Roof Rack",
    category: "Roof Racks",
    accessoryType: "3d",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, 0.92, 0],
    isActive: true,
  },
  {
    name: "Cargo Roof Basket",
    category: "Roof Racks",
    accessoryType: "3d",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, 0.95, 0.1],
    isActive: true,
  },
  {
    name: "Tow Hitch Receiver",
    category: "Other",
    accessoryType: "3d",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, -0.3, -1.5],
    isActive: true,
  },
  {
    name: "Hood Scoop",
    category: "Other",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, 0.6, 0.6],
    isActive: true,
  },
  {
    name: "Window Visors",
    category: "Other",
    accessoryType: "2d",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, 0.5, 0],
    isActive: true,
  },
  {
    name: "Racing Stripes Vinyl",
    category: "Other",
    accessoryType: "2d",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, 0, 0],
    isActive: true,
  },
  {
    name: "Rear Diffuser",
    category: "Other",
    accessoryType: "both",
    model3dUrl: "",
    image2dUrl: "",
    thumbnailUrl: "",
    defaultPosition3d: [0, -0.38, -1.1],
    isActive: true,
  },
]

const SAMPLE_CARS: Omit<CarCatalog, "_id" | "createdAt" | "updatedAt">[] = [
  {
    make: "Ford",
    model: "Mustang GT",
    year: "2018-2023",
    slug: makeCarSlug("Ford", "Mustang GT"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "fm-front", label: "Front View", url: "", angle: "front" },
      { id: "fm-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "fm-side-r", label: "Side Right", url: "", angle: "side-right" },
      { id: "fm-rear", label: "Rear View", url: "", angle: "rear" },
      { id: "fm-3q", label: "3/4 Front", url: "", angle: "3q-front" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "Chevrolet",
    model: "Camaro SS",
    year: "2019-2024",
    slug: makeCarSlug("Chevrolet", "Camaro SS"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "cc-front", label: "Front View", url: "", angle: "front" },
      { id: "cc-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "cc-side-r", label: "Side Right", url: "", angle: "side-right" },
      { id: "cc-rear", label: "Rear View", url: "", angle: "rear" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "Dodge",
    model: "Challenger R/T",
    year: "2015-2023",
    slug: makeCarSlug("Dodge", "Challenger R/T"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "dc-front", label: "Front View", url: "", angle: "front" },
      { id: "dc-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "dc-rear", label: "Rear View", url: "", angle: "rear" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "Tesla",
    model: "Model S",
    year: "2021-2024",
    slug: makeCarSlug("Tesla", "Model S"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "ts-front", label: "Front View", url: "", angle: "front" },
      { id: "ts-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "ts-rear", label: "Rear View", url: "", angle: "rear" },
      { id: "ts-3q", label: "3/4 Front", url: "", angle: "3q-front" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "Toyota",
    model: "GR Supra",
    year: "2020-2024",
    slug: makeCarSlug("Toyota", "GR Supra"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "tg-front", label: "Front View", url: "", angle: "front" },
      { id: "tg-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "tg-rear", label: "Rear View", url: "", angle: "rear" },
      { id: "tg-3q", label: "3/4 Front", url: "", angle: "3q-front" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "Ford",
    model: "F-150 Raptor",
    year: "2021-2024",
    slug: makeCarSlug("Ford", "F-150 Raptor"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "fr-front", label: "Front View", url: "", angle: "front" },
      { id: "fr-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "fr-rear", label: "Rear View", url: "", angle: "rear" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "Chevrolet",
    model: "Corvette C8",
    year: "2020-2024",
    slug: makeCarSlug("Chevrolet", "Corvette C8"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "cv-front", label: "Front View", url: "", angle: "front" },
      { id: "cv-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "cv-rear", label: "Rear View", url: "", angle: "rear" },
      { id: "cv-top", label: "Top View", url: "", angle: "top" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "BMW",
    model: "M3 Competition",
    year: "2021-2024",
    slug: makeCarSlug("BMW", "M3 Competition"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "bm-front", label: "Front View", url: "", angle: "front" },
      { id: "bm-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "bm-rear", label: "Rear View", url: "", angle: "rear" },
      { id: "bm-3q", label: "3/4 Front", url: "", angle: "3q-front" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "Mercedes-Benz",
    model: "AMG C63",
    year: "2020-2023",
    slug: makeCarSlug("Mercedes-Benz", "AMG C63"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "mb-front", label: "Front View", url: "", angle: "front" },
      { id: "mb-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "mb-rear", label: "Rear View", url: "", angle: "rear" },
    ],
    accessoryIds: [],
    isActive: true,
  },
  {
    make: "Jeep",
    model: "Wrangler Rubicon",
    year: "2018-2024",
    slug: makeCarSlug("Jeep", "Wrangler Rubicon"),
    thumbnailUrl: "",
    model3dUrl: "",
    images2d: [
      { id: "jw-front", label: "Front View", url: "", angle: "front" },
      { id: "jw-side-l", label: "Side Left", url: "", angle: "side-left" },
      { id: "jw-rear", label: "Rear View", url: "", angle: "rear" },
    ],
    accessoryIds: [],
    isActive: true,
  },
]

export async function POST() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const db = await getDb()
  const now = new Date()

  // Insert accessories
  const accDocs = SAMPLE_ACCESSORIES.map((a) => ({ ...a, createdAt: now, updatedAt: now }))
  const existingAcc = await db.collection("accessories_catalog").countDocuments()
  let insertedAcc = 0
  if (existingAcc === 0) {
    const result = await db.collection("accessories_catalog").insertMany(accDocs as any[])
    insertedAcc = result.insertedCount
  }

  // Insert cars
  const carDocs = SAMPLE_CARS.map((c) => ({ ...c, createdAt: now, updatedAt: now }))
  const existingCars = await db.collection("car_catalog").countDocuments()
  let insertedCars = 0
  if (existingCars === 0) {
    const result = await db.collection("car_catalog").insertMany(carDocs as any[])
    insertedCars = result.insertedCount
  }

  return NextResponse.json({
    message: "Seed complete",
    insertedCars,
    insertedAccessories: insertedAcc,
    skippedCars: existingCars > 0,
    skippedAccessories: existingAcc > 0,
  })
}
