import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Plus, X, Image as ImageIcon, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  PlantMood,
  MOOD_OPTIONS,
  JOURNAL_IMAGE_CONSTANTS,
  JournalEntryFormData,
} from '@/types/journalTypes';

interface JournalEntryFormProps {
  onSubmit: (formData: JournalEntryFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<JournalEntryFormData>;
  submitButtonText?: string;
}

export function JournalEntryForm({
  onSubmit,
  isLoading = false,
  initialData,
  submitButtonText = 'Add Entry',
}: JournalEntryFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [mood, setMood] = useState<PlantMood | null>(initialData?.mood || null);
  const [entryDate, setEntryDate] = useState<Date>(initialData?.entryDate || new Date());
  const [selectedImages, setSelectedImages] = useState<File[]>(initialData?.images || []);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    if (selectedImages.length + files.length > JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY) {
      alert(`Maximum ${JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY} images allowed`);
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of files) {
      if (!JOURNAL_IMAGE_CONSTANTS.ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert(`${file.name} is not a supported image type`);
        continue;
      }
      if (file.size > JOURNAL_IMAGE_CONSTANTS.MAX_FILE_SIZE_BYTES) {
        alert(`${file.name} exceeds ${JOURNAL_IMAGE_CONSTANTS.MAX_FILE_SIZE_MB}MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);

      // Create preview URLs
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const formData: JournalEntryFormData = {
      title,
      content,
      mood,
      images: selectedImages,
      entryDate,
    };

    await onSubmit(formData);

    // Reset form after successful submission
    setTitle('');
    setContent('');
    setMood(null);
    setEntryDate(new Date());
    setSelectedImages([]);

    // Clean up preview URLs
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setImagePreviewUrls([]);
  };

  const isFormValid = title.trim().length > 0 && (content.trim().length > 0 || selectedImages.length > 0);

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-background">
      <h4 className="font-medium text-lg text-foreground">Add Journal Entry</h4>

      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., New leaf growth!"
          maxLength={100}
          required
        />
      </div>

      {/* Content Textarea */}
      <div className="space-y-2">
        <Label htmlFor="content">Notes</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe what you observed about your plant..."
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Mood Selector */}
      <div className="space-y-2">
        <Label>Plant Mood (optional)</Label>
        <Select
          value={mood || undefined}
          onValueChange={(value) => setMood(value as PlantMood)}
        >
          <SelectTrigger>
            <SelectValue placeholder="How is your plant doing?" />
          </SelectTrigger>
          <SelectContent>
            {MOOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mood && (
          <p className="text-sm text-muted-foreground">
            {MOOD_OPTIONS.find(o => o.value === mood)?.description}
          </p>
        )}
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label>Entry Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !entryDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {entryDate ? format(entryDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={entryDate}
              onSelect={(date) => date && setEntryDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>
          Photos ({selectedImages.length}/{JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY})
        </Label>

        {/* Image Preview Grid */}
        {imagePreviewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Buttons */}
        {selectedImages.length < JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose Photos
            </Button>

            {/* Camera button for mobile */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute('capture', 'environment');
                  fileInputRef.current.click();
                }
              }}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={JOURNAL_IMAGE_CONSTANTS.ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground">
          Max {JOURNAL_IMAGE_CONSTANTS.MAX_FILE_SIZE_MB}MB per image. Formats: JPEG, PNG, WebP
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4 mr-2" />
        {isLoading ? 'Adding...' : submitButtonText}
      </Button>
    </div>
  );
}
