import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface WateringRecord {
  id: string;
  watered_at: string;
  notes?: string;
}

interface WateringRecordsListProps {
  records: WateringRecord[];
  onDeleteRecord: (recordId: string) => Promise<void>;
  deleteLoadingRecords?: Set<string>;
}

const WateringRecordsList = ({
  records,
  onDeleteRecord,
  deleteLoadingRecords = new Set(),
}: WateringRecordsListProps) => {
  return (
    <div className="space-y-4">
      {records.length > 0 ? (
        records.map((record, index) => {
          const isDeleting = deleteLoadingRecords.has(record.id);

          return (
            <div key={record.id}>
              <div className="flex items-center justify-between p-4 sm:p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base sm:text-sm">
                    {format(new Date(record.watered_at), "PPP")}
                  </div>
                  {record.notes && (
                    <div className="text-sm sm:text-xs text-muted-foreground mt-1">
                      {record.notes}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteRecord(record.id)}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </div>
              {index < records.length - 1 && (
                <div className="border-b border-sprout-cream/10 dark:border-sprout-cream/5 mx-4 mt-4" />
              )}
            </div>
          );
        })
      ) : (
        <p className="text-muted-foreground text-center py-8">
          No watering records yet
        </p>
      )}
    </div>
  );
};

export default WateringRecordsList;
