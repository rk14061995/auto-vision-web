import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export interface UploadResult {
  public_id: string
  secure_url: string
  format: string
  bytes: number
  width: number
  height: number
  resource_type: string
  created_at: string
}

export async function uploadImage(
  fileBuffer: Buffer,
  options?: {
    folder?: string
    public_id?: string
    transformation?: any
    resource_type?: 'image' | 'auto'
  }
): Promise<UploadResult> {
  try {
    const uploadOptions: any = {
      folder: options?.folder || 'auto-vision/projects',
      public_id: options?.public_id,
      resource_type: options?.resource_type || 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
    }

    // Use upload_stream for buffer data
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
      uploadStream.end(fileBuffer)
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      resource_type: result.resource_type,
      created_at: result.created_at,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return false
  }
}

export function getCloudinaryConfig() {
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  }
}
