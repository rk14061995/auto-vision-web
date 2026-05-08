import { listAllAssets } from "@/lib/marketplace"
import { MarketplaceModeration } from "./moderation-client"

export const metadata = { title: "Marketplace Moderation — Admin" }

export default async function AdminMarketplacePage() {
  const assets = await listAllAssets()
  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Marketplace assets</h1>
      <p className="admin-page-subtitle">
        Approve or reject creator submissions. Approved assets appear publicly at
        <code> /marketplace</code>.
      </p>
      <MarketplaceModeration initialAssets={JSON.parse(JSON.stringify(assets))} />
    </div>
  )
}
