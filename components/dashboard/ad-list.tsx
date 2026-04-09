'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MousePointer, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { getAdTypeById, formatPrice } from "@/lib/products"

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
}

export function AdList({ advertisements }: AdListProps) {
  const [activeAds, setActiveAds] = useState<Advertisement[]>([])
  const [expiredAds, setExpiredAds] = useState<Advertisement[]>([])

  useEffect(() => {
    const now = new Date()
    const active = advertisements.filter(ad => ad.status === 'active' && new Date(ad.endDate) > now)
    const expired = advertisements.filter(ad => ad.status === 'expired' || new Date(ad.endDate) <= now)

    setActiveAds(active)
    setExpiredAds(expired)
  }, [advertisements])

  const getStatusBadge = (status: string, endDate: Date) => {
    const now = new Date()
    const isExpired = new Date(endDate) <= now

    if (status === 'pending') {
      return <Badge variant="secondary">Pending Payment</Badge>
    } else if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    } else {
      return <Badge variant="default" className="bg-green-500">Active</Badge>
    }
  }

  const AdCard = ({ ad }: { ad: Advertisement }) => {
    const adType = getAdTypeById(ad.adType)

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{ad.shopName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{ad.shopDescription}</p>
            </div>
            {getStatusBadge(ad.status, ad.endDate)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {new Date(ad.startDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">Start Date</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {new Date(ad.endDate).toLocaleDateString()}
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
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{ad.contactInfo}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Ads */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-500" />
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
  )
}