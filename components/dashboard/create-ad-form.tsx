'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, CreditCard, ArrowLeft } from "lucide-react"
import { AD_TYPES, getAdTypeById, formatPrice } from "@/lib/products"
import { AdPayment } from "./ad-payment"

interface CreateAdFormProps {
  userEmail: string
  userName: string
  onAdCreated: () => void
}

export function CreateAdForm({ userEmail, userName, onAdCreated }: CreateAdFormProps) {
  const [shopName, setShopName] = useState('')
  const [shopDescription, setShopDescription] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [adType, setAdType] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [step, setStep] = useState<'form' | 'payment'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedAdType = getAdTypeById(adType)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxImages = selectedAdType?.maxImages || 1
    const currentCount = images.length
    const availableSlots = maxImages - currentCount

    if (availableSlots > 0) {
      const newFiles = files.slice(0, availableSlots)
      setImages(prev => [...prev, ...newFiles])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdType || images.length === 0) return
    setStep('payment')
  }

  const handlePaymentSuccess = async (paymentId: string) => {
    setIsSubmitting(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('shopName', shopName)
      formData.append('shopDescription', shopDescription)
      formData.append('contactInfo', contactInfo)
      formData.append('adType', adType)
      formData.append('paymentId', paymentId || '')
      
      // Add all image files
      images.forEach((image) => {
        formData.append('images', image)
      })

      const response = await fetch('/api/ads', {
        method: 'POST',
        body: formData, // No Content-Type header for FormData
      })

      if (response.ok) {
        // Reset form
        setShopName('')
        setShopDescription('')
        setContactInfo('')
        setAdType('')
        setImages([])
        setStep('form')

        // Notify parent component
        onAdCreated()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
        setStep('form')
      }
    } catch (error) {
      console.error('Error creating ad:', error)
      alert('Failed to create advertisement. Please try again.')
      setStep('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentCancel = () => {
    setStep('form')
  }

  if (step === 'payment' && selectedAdType) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('form')}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
            <CardTitle>Payment for {selectedAdType.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <AdPayment
            adType={selectedAdType}
            userEmail={userEmail}
            userName={userName}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentCancel={handlePaymentCancel}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Advertisement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter your shop name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopDescription">Shop Description</Label>
            <Textarea
              id="shopDescription"
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Describe your shop and services"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Phone, email, or address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adType">Ad Type</Label>
            <Select value={adType} onValueChange={setAdType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select advertisement type" />
              </SelectTrigger>
              <SelectContent>
                {AD_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {formatPrice(type.pricing.IN.amount, "INR")}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAdType && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Ad Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-medium">{selectedAdType.duration} days</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="ml-2 font-medium">{selectedAdType.dimensions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <span className="ml-2 font-medium">
                    {formatPrice(selectedAdType.pricing.IN.amount, "INR")} ({formatPrice(selectedAdType.pricing.US.amount, "USD")})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Images:</span>
                  <span className="ml-2 font-medium">{selectedAdType.maxImages}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="images">Ad Images ({images.length}/{selectedAdType?.maxImages || 1})</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:underline">
                      Click to upload images
                    </span>
                    <Input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={!selectedAdType || images.length >= (selectedAdType?.maxImages || 1)}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting || !selectedAdType || images.length === 0}
          >
            <CreditCard className="h-4 w-4" />
            Continue to Payment
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}