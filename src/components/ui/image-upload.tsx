import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { imageToast } from "@/utils/toast-helpers";
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

 const uploadToCloudinary = async (file: File) => {
 const formData = new FormData();
 formData.append("file", file);

 try {
  const { data, error } = await supabase.functions.invoke("upload-image", {
  body: formData,
  });

  if (error) {
  console.error("Supabase function error:", error);
  throw new Error("Upload failed");
  }

  return data.secure_url;
 } catch (error) {
  console.error("Cloudinary upload error:", error);
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
  const imageUrl = await uploadToCloudinary(file);
  onChange(imageUrl);
  imageToast.uploaded();
 } catch (error) {
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
 <div className="w-full space-y-2">
  <Label htmlFor="image">{label}</Label>

  <div className="space-y-3">
  {/* URL Input */}
  <Input
   id="image"
   value={value}
   onChange={(e) => onChange(e.target.value)}
   placeholder={placeholder}
   className="w-full border-sprout-medium/30 focus:border-sprout-primary"
  />

  {/* Upload Button */}
  <div className="flex gap-2 w-full">
   <Button
   type="button"
   variant="outline"
   onClick={handleUploadClick}
   disabled={isUploading}
   className="flex-1 bg-sprout-light hover:bg-sprout-light/90 text-white border-sprout-light"
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
    variant="outline"
    size="icon"
    onClick={handleRemoveImage}
    className="text-red-600 hover:text-red-700"
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
    className="w-20 h-20 object-cover rounded-lg border"
    onError={(e) => {
    e.currentTarget.style.display = "none";
    }}
   />
   </div>
  )}
  </div>
 </div>
 );
};

export default ImageUpload;
