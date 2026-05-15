import { useRef, useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera as CapacitorCamera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { ImagePreviewModal } from './ImagePreviewModal';
import { apiRequest } from '@/lib/queryClient';

// `dataUrl` is kept as the field name for compatibility with existing callers,
// but it now holds an https:// URL to Supabase Storage (or a temporary
// blob/data URL while the upload is in flight). Submit handlers serialize
// this string verbatim into `tasks.images`.
export type PhotoPreview = {
  id: string;
  dataUrl: string;
  uploading?: boolean;
};

interface PhotoUploadProps {
  photos: PhotoPreview[];
  // Accepts either a replacement array or a functional updater (so the
  // async upload callbacks can swap a placeholder for the final URL without
  // racing on a stale `photos` prop). React's `useState` setter satisfies
  // both shapes.
  onPhotosChange: (photos: PhotoPreview[] | ((prev: PhotoPreview[]) => PhotoPreview[])) => void;
  maxSizeMB?: number;
  label?: string;
}

// Client-side image compression. Resizes oversized images down to
// MAX_DIMENSION on the longest edge and re-encodes as JPEG. Images already
// smaller than the cap are still re-encoded if they save meaningful bytes,
// otherwise the original data URL is kept. Returns a JPEG data URL.
//
// Why: the existing flow stores raw Base64 in a Postgres text[] column.
// A 5MB phone photo balloons to ~6.7MB per row, so a single task with 3
// photos can hit ~20MB. Compressing here keeps each photo around 200–400KB
// without visible quality loss for the kind of damage/issue documentation
// receptionists upload.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = src;
  });
}

async function compressDataUrl(originalDataUrl: string): Promise<{ dataUrl: string; originalSize: number; compressedSize: number }> {
  const originalSize = originalDataUrl.length;
  try {
    const img = await loadImage(originalDataUrl);
    const longest = Math.max(img.width, img.height);
    const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl: originalDataUrl, originalSize, compressedSize: originalSize };
    ctx.drawImage(img, 0, 0, w, h);

    const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    // Only swap if we actually saved bytes (a small PNG icon might inflate
    // when re-encoded as JPEG).
    if (compressed.length < originalSize) {
      return { dataUrl: compressed, originalSize, compressedSize: compressed.length };
    }
    return { dataUrl: originalDataUrl, originalSize, compressedSize: originalSize };
  } catch {
    // HEIC or other formats some browsers can't decode — fall back to original
    // so the user is never blocked from uploading.
    return { dataUrl: originalDataUrl, originalSize, compressedSize: originalSize };
  }
}

// Upload a compressed image data URL to the server, which then forwards it
// to Supabase Storage and returns a public URL. We send Base64 over a
// single HTTPS hop — it never reaches the database in that form.
async function uploadToStorage(dataUrl: string, filename: string): Promise<string> {
  const response = await apiRequest('POST', '/api/uploads/image', { dataUrl, filename });
  const result = await response.json();
  if (!result?.url) throw new Error(result?.error || 'Upload failed: no URL returned');
  return result.url as string;
}

export function PhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxSizeMB = 5,
  label = "Upload fotografije (max 5MB po slici)"
}: PhotoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // Process a single image: compress, upload to Storage, replace placeholder
  // entry with the resulting public URL. Failures don't block other photos.
  const processAndUpload = async (
    sourceDataUrl: string,
    filename: string,
    placeholderId: string,
    isCameraSource: boolean,
  ) => {
    try {
      const { dataUrl: compressedDataUrl, originalSize, compressedSize } = await compressDataUrl(sourceDataUrl);
      console.log(
        `[PhotoUpload] ${filename}: ${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB ` +
        `(${Math.round((1 - compressedSize / originalSize) * 100)}% smaller)`
      );
      const publicUrl = await uploadToStorage(compressedDataUrl, filename);
      onPhotosChange((currentPhotos) =>
        currentPhotos.map((p) =>
          p.id === placeholderId ? { ...p, dataUrl: publicUrl, uploading: false } : p
        )
      );
      if (isCameraSource) {
        toast({ title: 'Fotografija snimljena', description: 'Uspešno uploadovana.' });
      }
    } catch (err: any) {
      console.error('[PhotoUpload] Upload failed', filename, err);
      onPhotosChange((currentPhotos) => currentPhotos.filter((p) => p.id !== placeholderId));
      toast({
        title: 'Greška pri uploadu',
        description: err?.message || `Nije moguće poslati ${filename}`,
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const placeholders: PhotoPreview[] = [];
    const queue: Array<{ sourceDataUrl: string; filename: string; placeholderId: string }> = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Nevažeći fajl',
          description: 'Molimo izaberite sliku (JPG, PNG, itd.)',
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: 'Fajl previše velik',
          description: `Moguće je uploadovati sliku samo do ${maxSizeMB}MB`,
          variant: 'destructive',
        });
        continue;
      }

      try {
        const sourceDataUrl = await readFileAsDataUrl(file);
        const placeholderId = `photo-${Date.now()}-${i}`;
        placeholders.push({ id: placeholderId, dataUrl: sourceDataUrl, uploading: true });
        queue.push({ sourceDataUrl, filename: file.name, placeholderId });
      } catch (err) {
        console.error('[PhotoUpload] Failed to read file', file.name, err);
      }
    }

    if (placeholders.length > 0) {
      onPhotosChange([...photos, ...placeholders]);
      // Kick off compression + upload in parallel after the placeholders render.
      queue.forEach((q) => {
        processAndUpload(q.sourceDataUrl, q.filename, q.placeholderId, false);
      });
    }
    event.target.value = '';
  };

  const handleTakePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        const placeholderId = `photo-${Date.now()}`;
        onPhotosChange([
          ...photos,
          { id: placeholderId, dataUrl: image.dataUrl, uploading: true },
        ]);
        await processAndUpload(image.dataUrl, `camera-${placeholderId}.jpg`, placeholderId, true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: 'Greška sa kamerom',
        description: 'Nije moguće pristupiti kameri',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    onPhotosChange(photos.filter(p => p.id !== photoId));
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="border-2 border-dashed rounded-md p-2 text-center">
        <Camera className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
        <p className="text-xs text-muted-foreground mb-2">
          {label}
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePhotoUpload}
            type="button"
            data-testid="button-upload-photo"
          >
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTakePhoto}
            type="button"
            data-testid="button-take-photo"
          >
            <Camera className="w-3 h-3 mr-1" />
            Snimi
          </Button>
        </div>
      </div>
      
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square bg-muted rounded-md overflow-hidden min-w-[96px] min-h-[96px] cursor-pointer hover-elevate"
              onClick={() => !photo.uploading && setPreviewImage(photo.dataUrl)}
              data-testid={`photo-preview-${photo.id}`}
            >
              <img
                src={photo.dataUrl}
                alt="Preview"
                className={`w-full h-full object-cover transition-opacity ${photo.uploading ? 'opacity-50' : ''}`}
              />
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Loader2 className="w-6 h-6 text-white animate-spin drop-shadow" />
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-14 w-14 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto(photo.id);
                }}
                type="button"
                data-testid={`button-remove-photo-${photo.id}`}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ImagePreviewModal 
        imageUrl={previewImage} 
        onClose={() => setPreviewImage(null)} 
      />
    </>
  );
}
