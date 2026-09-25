import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

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
    <div>
      <label
        htmlFor="manual-location"
        className="block text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1 mb-1.5"
      >
        Manual Location (Optional)
      </label>
      <div className="flex gap-2">
        <Input
          id="manual-location"
          placeholder="ZIP code or city"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isGeocoding}
          data-testid="manual-location-input"
          className="h-12 rounded-2xl border-0 bg-field text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-0"
        />
        <button
          type="button"
          onClick={onGeocode}
          disabled={isGeocoding || !value.trim()}
          data-testid="manual-location-search-button"
          aria-label="Find location"
          className="w-12 h-12 shrink-0 rounded-2xl bg-sprout-dark text-sprout-cream flex items-center justify-center disabled:opacity-50"
        >
          {isGeocoding ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-[13px] font-semibold text-sprout-warning px-1 mt-1.5" data-testid="manual-location-error">{error}</p>
      )}
      <p className="text-[13px] text-muted-foreground px-1 mt-1.5">
        A US ZIP code (e.g. 10001) or a city (e.g. New York, NY). Press Enter to search.
      </p>
    </div>
  );
}
