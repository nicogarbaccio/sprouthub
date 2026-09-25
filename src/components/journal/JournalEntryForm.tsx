import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
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
import { CalendarIcon, Plus, X, Image as ImageIcon, Camera, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  PlantMood,
  MOOD_OPTIONS,
  JOURNAL_IMAGE_CONSTANTS,
  JournalEntryFormData,
} from '@/types/journalTypes';
import { WateringRecord } from '@/hooks/useWateringRecords';
import { Skeleton } from '@/components/ui/skeleton';
import { FieldLabel, settingsInputClasses } from '@/components/settings/SettingsUI';
import { sheetPrimaryButtonClasses } from '@/components/ui/bento-sheet';

const fieldButtonClasses =
  'h-12 rounded-2xl bg-field text-foreground text-[15px] font-semibold inline-flex items-center justify-center gap-2 px-4 hover:bg-field/70';

interface JournalEntryFormProps {
  onSubmit: (formData: JournalEntryFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<JournalEntryFormData>;
  submitButtonText?: string;
  plantId?: string;
  wateringRecords?: WateringRecord[];
  isLoadingWateringRecords?: boolean;
  /** Heading above the fields; pass null when the surrounding dialog's title already says it */
  heading?: string | null;
}

export function JournalEntryForm({
  onSubmit,
  isLoading = false,
  initialData,
  submitButtonText = 'Add Entry',
  plantId,
  wateringRecords = [],
  isLoadingWateringRecords = false,
  heading = 'Add Journal Entry',
}: JournalEntryFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [mood, setMood] = useState<PlantMood | null>(initialData?.mood || null);
  const [entryDate, setEntryDate] = useState<Date>(initialData?.entryDate || new Date());
  const [selectedImages, setSelectedImages] = useState<File[]>(initialData?.images || []);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedWateringRecordId, setSelectedWateringRecordId] = useState<string | undefined>(
    initialData?.relatedWateringRecordId
  );

  // Filter for recent records (e.g., last 30 days) to keep list manageable
  const recentWateringRecords = wateringRecords.slice(0, 10);

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
      relatedWateringRecordId: selectedWateringRecordId,
    };

    await onSubmit(formData);

    // Reset form after successful submission
    setTitle('');
    setContent('');
    setMood(null);
    setEntryDate(new Date());
    setSelectedImages([]);
    setSelectedWateringRecordId(undefined);

    // Clean up preview URLs
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setImagePreviewUrls([]);
  };

  const isFormValid = title.trim().length > 0 && (content.trim().length > 0 || selectedImages.length > 0);

  return (
    <div className="space-y-2">
      {heading && (
        <h4 className="font-display text-lg font-bold tracking-[-0.02em] text-foreground px-1.5 pb-1">{heading}</h4>
      )}

      {/* Title and notes */}
      <div className="rounded-3xl bg-card p-4 space-y-3">
        <div>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New leaf growth!"
            maxLength={100}
            required
            className={settingsInputClasses}
          />
        </div>
        <div>
          <FieldLabel htmlFor="content">Notes</FieldLabel>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe what you observed about your plant..."
            rows={4}
            className="resize-none rounded-2xl border-0 bg-field px-4 py-3 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {/* Mood: tap a chip to pick it, tap it again to clear */}
      <div className="rounded-3xl bg-card p-4">
        <FieldLabel>Plant Mood (optional)</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_OPTIONS.map((option) => {
            const selected = mood === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setMood(selected ? null : option.value)}
                className={cn(
                  'h-10 px-3.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 transition-colors',
                  selected ? 'bg-sprout-cream text-sprout-dark' : 'bg-field text-foreground hover:bg-field/70'
                )}
              >
                <span aria-hidden="true">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
        {mood && (
          <p className="text-[13px] font-medium text-muted-foreground mt-2 px-1">
            {MOOD_OPTIONS.find(o => o.value === mood)?.description}
          </p>
        )}
      </div>

      {/* Date and related watering */}
      <div className="rounded-3xl bg-card p-4 space-y-3">
        <div>
          <FieldLabel>Entry Date</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={cn(fieldButtonClasses, 'w-full justify-start')}>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {entryDate ? format(entryDate, 'PPP') : 'Pick a date'}
              </button>
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

        {plantId && (
          <div>
            <FieldLabel>Related Watering (optional)</FieldLabel>
            {isLoadingWateringRecords ? (
              <Skeleton className="h-12 w-full rounded-2xl" />
            ) : recentWateringRecords.length > 0 ? (
              <Select
                value={selectedWateringRecordId || "none"}
                onValueChange={(val) => setSelectedWateringRecordId(val === "none" ? undefined : val)}
              >
                <SelectTrigger className={settingsInputClasses}>
                  <SelectValue placeholder="Link to a recent watering..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {recentWateringRecords.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-sprout-water" />
                        <span>{format(new Date(record.watered_at), 'PPP')}</span>
                        {record.notes && (
                          <span className="text-muted-foreground truncate max-w-[150px]">
                            - {record.notes}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium text-muted-foreground px-1">
                No recent watering records available.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="rounded-3xl bg-card p-4">
        <FieldLabel>
          Photos ({selectedImages.length}/{JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY})
        </FieldLabel>

        {imagePreviewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-[18px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-sprout-dark text-sprout-cream flex items-center justify-center"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedImages.length < JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={fieldButtonClasses}
            >
              <ImageIcon className="w-4 h-4" />
              Choose Photos
            </button>

            {/* Camera button for mobile */}
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute('capture', 'environment');
                  fileInputRef.current.click();
                }
              }}
              className={fieldButtonClasses}
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
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

        <p className="text-xs font-medium text-muted-foreground mt-2 px-1">
          Max {JOURNAL_IMAGE_CONSTANTS.MAX_FILE_SIZE_MB}MB per image. Formats: JPEG, PNG, WebP
        </p>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        className={cn(sheetPrimaryButtonClasses, 'mt-1')}
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
        {isLoading ? 'Adding...' : submitButtonText}
      </button>
    </div>
  );
}
