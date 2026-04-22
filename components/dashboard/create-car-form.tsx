'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, ArrowRight } from "lucide-react"

const CAR_MAKES = [
  "Tesla", "BMW", "Mercedes-Benz", "Audi", "Porsche",
  "Toyota", "Honda", "Nissan", "Mazda", "Subaru",
  "Ford", "Chevrolet", "Dodge", "Jeep", "GMC",
  "Lamborghini", "Ferrari", "Bugatti", "Pagani", "Koenigsegg"
]

const CAR_MODELS = {
  "Tesla": ["Model S", "Model 3", "Model X", "Model Y", "Roadster"],
  "BMW": ["M4", "M5", "M8", "X5", "X7", "3 Series", "5 Series"],
  "Mercedes-Benz": ["C63 AMG", "E63 AMG", "S63 AMG", "G63", "SLS AMG"],
  "Audi": ["RS7", "RS6", "R8", "S4", "S5", "S8"],
  "Porsche": ["911", "Cayman", "Boxster", "Panamera", "Cayenne"],
  "Toyota": ["Supra", "GR86", "Corolla", "Camry"],
  "Honda": ["Civic Type R", "Accord", "S2000"],
  "Nissan": ["GT-R", "370Z", "Altima", "Maxima"],
  "Ford": ["Mustang", "F-150 Raptor", "Focus RS"],
  "Chevrolet": ["Corvette", "Camaro", "Silverado"],
}

const COLORS = [
  "Black", "White", "Red", "Blue", "Silver", "Gray", "Yellow", 
  "Green", "Orange", "Purple", "Gold", "Bronze"
]

interface CreateCarProjectFormProps {
  userEmail: string
  userName: string
  onProjectCreated: (projectId: string) => void
}

export function CreateCarProjectForm({ userEmail, userName, onProjectCreated }: CreateCarProjectFormProps) {
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [carMake, setCarMake] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState(new Date().getFullYear().toString())
  const [carColor, setCarColor] = useState('')
  const [baseImage, setBaseImage] = useState<File | null>(null)
  const [baseImagePreview, setBaseImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const availableModels = carMake ? (CAR_MODELS[carMake as keyof typeof CAR_MODELS] || []) : []
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBaseImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setBaseImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setBaseImage(null)
    setBaseImagePreview('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!projectName || !carMake || !carModel || !carYear || !carColor || !baseImage) {
      setError('Please fill in all fields and upload a car image')
      return
    }

    setIsSubmitting(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('projectName', projectName)
      formData.append('description', description)
      formData.append('carDetails', JSON.stringify({
        make: carMake,
        model: carModel,
        year: parseInt(carYear),
        color: carColor,
      }))
      if (baseImage) {
        formData.append('baseImage', baseImage)
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData, // No Content-Type header for FormData
      })

      if (response.ok) {
        const data = await response.json()
        setProjectName('')
        setDescription('')
        setCarMake('')
        setCarModel('')
        setCarYear(currentYear.toString())
        setCarColor('')
        setBaseImage(null)
        setBaseImagePreview('')
        
        // Redirect to dashboard with project ID
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
        const projectId = data.projectId
        const redirectUrl = `${dashboardUrl}?projectId=${projectId}&email=${userEmail}`
        window.location.href = redirectUrl
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create project')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Failed to create car project. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Car Customization Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., My Dream Build"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your customization goals..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carMake">Car Make</Label>
              <Select value={carMake} onValueChange={setCarMake} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {CAR_MAKES.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carModel">Car Model</Label>
              <Select value={carModel} onValueChange={setCarModel} required disabled={!carMake}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carYear">Year</Label>
              <Select value={carYear} onValueChange={setCarYear} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carColor">Color</Label>
              <Select value={carColor} onValueChange={setCarColor} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseImage">Car Image</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              {baseImagePreview ? (
                <div className="relative group">
                  <img
                    src={baseImagePreview}
                    alt="Car preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">
                        Click to upload car image
                      </span>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting}
          >
            <ArrowRight className="h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Start Customizing'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
