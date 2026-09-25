import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { imageToast } from "@/utils/notifications/toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  showPreview?: boolean;
}

const ImageUpload = ({
  value,
  onChange,
  label = "Image",
  placeholder = "Enter image URL or upload",
  showPreview = true,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToSupabase = async (file: File) => {
    try {
      // 1. Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. Upload directly to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('plant-images')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // 3. Get the public URL
      const { data } = supabase.storage
        .from('plant-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      imageToast.invalidType();
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      imageToast.tooLarge();
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadToSupabase(file);
      onChange(imageUrl);
      imageToast.uploaded();
    } catch (error) {
      console.error(error);
      imageToast.uploadError();
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    onChange("");
  };

  return (
    <div className="w-full">
      <Label
        htmlFor="image"
        className="block text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1 mb-1.5"
      >
        {label}
      </Label>

      <div className="space-y-2">
        {/* URL Input */}
        <Input
          id="image"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 rounded-2xl border-0 bg-field text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-0"
          data-testid="image-url-input"
        />

        {/* Upload Button */}
        <div className="flex gap-2 w-full">
          <Button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex-1 h-12 rounded-2xl bg-sprout-dark hover:bg-sprout-dark/90 text-sprout-cream font-bold"
            data-testid="upload-image-button"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>

          {value && (
            <Button
              type="button"
              size="icon"
              onClick={handleRemoveImage}
              className="w-12 h-12 rounded-2xl bg-field text-foreground hover:bg-field/70"
              aria-label="Remove image"
              data-testid="remove-image-button"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Image Preview */}
        {value && showPreview && (
          <div className="mt-2">
            <img
              src={value}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-2xl"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              data-testid="image-preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
