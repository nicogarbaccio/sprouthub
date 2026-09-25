import { Trash2, Loader2, Droplets, Clock, Pencil, Leaf, AlertTriangle } from "lucide-react";
import { format, isFuture } from "date-fns";
import { cn } from "@/lib/utils";
import type { WateringRecord } from "@/hooks/useWateringRecords";
import { isPostponementRecord, parseHealthObservation, stripNotesPrefixes } from "@/utils/watering/notesPrefixes";

interface WateringRecordsListProps {
  records: WateringRecord[];
  onDeleteRecord: (recordId: string) => Promise<void>;
  onEditRecord?: (record: WateringRecord) => void;
  deleteLoadingRecords?: Set<string>;
}

const rowButton =
  "w-10 h-10 rounded-xl bg-field text-foreground flex items-center justify-center transition-colors disabled:opacity-50";

const WateringRecordsList = ({
  records,
  onDeleteRecord,
  onEditRecord,
  deleteLoadingRecords = new Set(),
}: WateringRecordsListProps) => {
  if (records.length === 0) {
    return (
      <p data-testid="no-watering-records" className="rounded-3xl bg-card px-5 py-6 text-sm text-muted-foreground text-center">
        No watering records yet
      </p>
    );
  }

  return (
    <ul data-testid="watering-records-list" className="space-y-2">
      {records.map((record) => {
        const isDeleting = deleteLoadingRecords.has(record.id);
        const isPostponement = record.is_postponement ?? isPostponementRecord(record);
        const isFutureDate = isFuture(new Date(record.watered_at));
        const healthObservation = isPostponement ? null : parseHealthObservation(record.notes);
        const displayNotes = stripNotesPrefixes(record.notes);

        return (
          <li
            key={record.id}
            data-testid={`watering-record-${record.id}`}
            className="flex items-start gap-3 p-2.5 rounded-[22px] bg-card"
          >
            <div
              className={cn(
                "w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center",
                !isPostponement
                  ? "bg-sprout-water text-sprout-dark"
                  : isFutureDate
                    ? "bg-sprout-cream text-sprout-dark"
                    : "bg-field text-muted-foreground"
              )}
            >
              {isPostponement ? <Clock className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[15px] font-bold text-foreground">
                {isPostponement ? (isFutureDate ? "Postponed" : "Past postponement") : "Watered"}
              </p>
              <p className="text-[13px] text-muted-foreground">{format(new Date(record.watered_at), "MMM d, yyyy")}</p>
              {(displayNotes || healthObservation) && (
                <p className="text-sm text-foreground mt-1.5 leading-snug flex items-start gap-1.5">
                  {healthObservation === "healthy" && (
                    <Leaf className="w-4 h-4 text-sprout-success shrink-0 mt-0.5" aria-label="Plant looked healthy" />
                  )}
                  {healthObservation === "stressed" && (
                    <AlertTriangle className="w-4 h-4 text-sprout-warning shrink-0 mt-0.5" aria-label="Plant showed stress" />
                  )}
                  {displayNotes || (healthObservation === "healthy" ? "Plant looked healthy" : "Plant showed stress")}
                </p>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0">
              {onEditRecord && (
                <button
                  data-testid={`edit-watering-record-${record.id}`}
                  type="button"
                  onClick={() => onEditRecord(record)}
                  disabled={isDeleting}
                  className={cn(rowButton, "hover:bg-sprout-water hover:text-sprout-dark")}
                  aria-label="Edit record"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button
                data-testid={`delete-watering-record-${record.id}`}
                type="button"
                onClick={() => onDeleteRecord(record.id)}
                disabled={isDeleting}
                className={cn(rowButton, "hover:bg-sprout-warning hover:text-sprout-dark")}
                aria-label="Delete record"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default WateringRecordsList;
