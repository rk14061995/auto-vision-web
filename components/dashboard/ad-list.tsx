'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MousePointer, Calendar, AlertCircle, CheckCircle, RefreshCw, TrendingUp, Pencil } from "lucide-react"
import { getAdTypeById, formatPrice } from "@/lib/products"
import { EditAdDialog } from "./edit-ad-dialog"

interface Advertisement {
  _id: string
  email: string
  shopName: string
  shopDescription: string
  contactInfo: string
  images: string[]
  adType: string
  status: "active" | "expired" | "pending"
  views: number
  clicks: number
  startDate: Date
  endDate: Date
  paymentAmount: number
  paymentCurrency: string
  paymentId: string | null
  createdAt: Date
  updatedAt: Date
}

interface AdListProps {
  advertisements: Advertisement[]
  onRenew?: (adType: string) => void
}

export function AdList({ advertisements, onRenew }: AdListProps) {
  const [ads, setAds] = useState<Advertisement[]>(advertisements)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)

  useEffect(() => {
    setAds(advertisements)
  }, [advertisements])

  const now = new Date()
  const activeAds = ads.filter(ad => ad.status === 'active' && new Date(ad.endDate) > now)
  const expiredAds = ads.filter(ad => ad.status === 'expired' || new Date(ad.endDate) <= now)

  function handleSaved(updated: Advertisement) {
    setAds(prev => prev.map(a => a._id === updated._id ? { ...a, ...updated } : a))
  }

  const getStatusBadge = (status: string, endDate: Date) => {
    if (status === 'pending') return <Badge variant="secondary">Pending Payment</Badge>
    if (new Date(endDate) <= new Date()) return <Badge variant="destructive">Expired</Badge>
    return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white font-semibold">Active</Badge>
  }

  const AdCard = ({ ad }: { ad: Advertisement }) => {
    const adType = getAdTypeById(ad.adType)
    const isActive = ad.status === 'active' && new Date(ad.endDate) > new Date()
    const isExpired = !isActive && ad.status !== 'pending'
    const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(1) : "0.0"
    const daysLeft = isActive
      ? Math.max(0, Math.ceil((new Date(ad.endDate).getTime() - Date.now()) / 86400000))
      : 0

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{ad.shopName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{ad.shopDescription}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(ad.status, ad.endDate)}
              {/* Edit available on active and pending ads */}
              {!isExpired && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingAd(ad)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit ad</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{ad.views.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{ad.clicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Clicks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{ctr}%</p>
                <p className="text-xs text-muted-foreground">CTR</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {new Date(ad.startDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">Start Date</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-4 w-4 ${isActive && daysLeft <= 3 ? "text-amber-500" : "text-muted-foreground"}`} />
              <div>
                <p className={`text-sm font-medium ${isActive && daysLeft <= 3 ? "text-amber-600" : ""}`}>
                  {isActive ? `${daysLeft}d left` : new Date(ad.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">End Date</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium">{adType?.name || ad.adType}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(ad.paymentAmount, ad.paymentCurrency as "INR" | "USD")}
                </p>
              </div>
              {ad.images.length > 0 && (
                <div className="flex gap-2">
                  {ad.images.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${ad.shopName} ${index + 1}`}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  ))}
                  {ad.images.length > 3 && (
                    <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-xs">
                      +{ad.images.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">{ad.contactInfo}</p>
              {isExpired && onRenew && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => onRenew(ad.adType)}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Renew
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Active Ads */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Active Advertisements ({activeAds.length})</h3>
          </div>
          {activeAds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active advertisements</p>
              </CardContent>
            </Card>
          ) : (
            activeAds.map((ad) => <AdCard key={ad._id} ad={ad} />)
          )}
        </div>

        {/* Expired Ads */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">Expired Advertisements ({expiredAds.length})</h3>
          </div>
          {expiredAds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No expired advertisements</p>
              </CardContent>
            </Card>
          ) : (
            expiredAds.map((ad) => <AdCard key={ad._id} ad={ad} />)
          )}
        </div>
      </div>

      {/* Edit dialog — rendered outside the card loop to avoid nesting issues */}
      {editingAd && (
        <EditAdDialog
          ad={editingAd}
          open={true}
          onClose={() => setEditingAd(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
