// helpers to resize/convert images client-side to WebP using canvas
export async function processImageFile(
  file: File,
  maxWidth = 650,
  maxHeight = 650,
  quality = 0.8
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  if (!file) throw new Error("No file provided")

  // create image element
  const img = await loadImage(URL.createObjectURL(file))

  // calculate target size preserving aspect ratio
  let { width, height } = img
  const ratio = Math.min(1, Math.min(maxWidth / width, maxHeight / height))
  const targetWidth = Math.round(width * ratio)
  const targetHeight = Math.round(height * ratio)

  // draw to canvas
  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  // get webp blob (fallback to image/png if webp not supported)
  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else {
          // fallback
          canvas.toBlob((fallback) => resolve(fallback as Blob), "image/png")
        }
      },
      "image/webp",
      quality
    )
  })

  const dataUrl = canvas.toDataURL("image/webp", quality)

  // cleanup object url
  try {
    URL.revokeObjectURL(img.src)
  } catch {}

  return { blob: blob as Blob, dataUrl, width: targetWidth, height: targetHeight }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}