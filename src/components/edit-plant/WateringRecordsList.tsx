
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface WateringRecord {
 id: string;
 watered_at: string;
 notes?: string;
}

interface WateringRecordsListProps {
 records: WateringRecord[];
 onDeleteRecord: (recordId: string) => Promise<void>;
}

const WateringRecordsList = ({ records, onDeleteRecord }: WateringRecordsListProps) => {
 return (
  <div className="space-y-2">
   {records.length > 0 ? (
    records.map((record) => (
     <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
      <div>
       <div className="font-medium">
        {format(new Date(record.watered_at), "PPP")}
       </div>
       {record.notes && (
        <div className="text-sm text-muted-foreground">{record.notes}</div>
       )}
      </div>
      <Button
       variant="ghost"
       size="sm"
       onClick={() => onDeleteRecord(record.id)}
       className="text-red-500 hover:text-red-700"
      >
       <Trash2 className="w-4 h-4" />
      </Button>
     </div>
    ))
   ) : (
    <p className="text-muted-foreground text-center py-4">No watering records yet</p>
   )}
  </div>
 );
};

export default WateringRecordsList;
