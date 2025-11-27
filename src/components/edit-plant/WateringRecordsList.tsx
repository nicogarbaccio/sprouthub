import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Droplets, Clock, Pencil } from "lucide-react";
import { format, isFuture } from "date-fns";
import type { WateringRecord } from "@/hooks/useWateringRecords";

interface WateringRecordsListProps {
  records: WateringRecord[];
  onDeleteRecord: (recordId: string) => Promise<void>;
  onEditRecord?: (record: WateringRecord) => void;
  deleteLoadingRecords?: Set<string>;
}

const WateringRecordsList = ({
  records,
  onDeleteRecord,
  onEditRecord,
  deleteLoadingRecords = new Set(),
}: WateringRecordsListProps) => {
  return (
    <div data-testid="watering-records-list" className="space-y-4">
      {records.length > 0 ? (
        records.map((record, index) => {
          const isDeleting = deleteLoadingRecords.has(record.id);
          const isPostponement = record.is_postponement || record.notes?.includes('POSTPONEMENT:');
          const isFutureDate = isFuture(new Date(record.watered_at));

          return (
            <div key={record.id}>
              <div
                data-testid={`watering-record-${record.id}`}
                className={`flex items-center justify-between p-4 sm:p-3 border rounded-lg hover:shadow-sm transition-shadow
                ${isPostponement
                  ? isFutureDate
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30"
                    : "bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/30"
                  : "bg-card"}`
                }
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-medium text-base sm:text-sm">
                    {isPostponement ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>
                          {isFutureDate ? "Postponed: " : "Past postponement: "}
                        </span>
                      </>
                    ) : (
                      <>
                        <Droplets className="w-4 h-4 text-sprout-water" />
                        <span>Watered: </span>
                      </>
                    )}
                    {format(new Date(record.watered_at), "PPP")}
                  </div>
                  {record.notes && (
                    <div className="text-sm sm:text-xs text-muted-foreground mt-1 pl-6">
                      {isPostponement 
                        ? record.notes.replace('POSTPONEMENT: ', '') 
                        : record.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  {onEditRecord && (
                    <Button
                      data-testid={`edit-watering-record-${record.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRecord(record)}
                      disabled={isDeleting}
                      className="text-foreground hover:text-sprout-cream disabled:opacity-50"
                      title="Edit record"
                    >
                      <Pencil className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                  <Button
                    data-testid={`delete-watering-record-${record.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteRecord(record.id)}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    title="Delete record"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {index < records.length - 1 && (
                <div className="border-b border-sprout-cream/10 dark:border-sprout-cream/5 mx-4 mt-4" />
              )}
            </div>
          );
        })
      ) : (
        <p data-testid="no-watering-records" className="text-muted-foreground text-center py-8">
          No watering records yet
        </p>
      )}
    </div>
  );
};

export default WateringRecordsList;
