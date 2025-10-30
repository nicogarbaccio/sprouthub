import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Info } from "lucide-react";

interface ManualLocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onGeocode: () => void;
  isGeocoding: boolean;
  error: string | null;
  onErrorClear: () => void;
}

export function ManualLocationInput({
  value,
  onChange,
  onGeocode,
  isGeocoding,
  error,
  onErrorClear,
}: ManualLocationInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onGeocode();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (error) {
      onErrorClear();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="manual-location" className="text-sm">
        Manual Location (Optional)
      </Label>
      <div className="flex gap-2">
        <Input
          id="manual-location"
          placeholder="Enter ZIP code or city name"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isGeocoding}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onGeocode}
          disabled={isGeocoding || !value.trim()}
        >
          {isGeocoding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      <p className="text-xs text-muted-foreground flex items-start gap-1">
        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>
          Enter a US ZIP code (e.g., "10001") or city name (e.g., "New York, NY"). Press Enter or click the search button to find the location.
        </span>
      </p>
    </div>
  );
}
