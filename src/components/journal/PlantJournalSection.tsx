import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, ChevronDown, ChevronUp, Droplets, FlaskConical, StickyNote } from 'lucide-react';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { useWateringRecords } from '@/hooks/useWateringRecords';
import { JournalEntryForm } from './JournalEntryForm';
import { JournalEntryList } from './JournalEntryList';
import { JournalEntryFormData } from '@/types/journalTypes';
import { cn } from '@/lib/utils';

type JournalFilter = 'all' | 'watering' | 'fertilization' | 'other';

interface PlantJournalSectionProps {
  plantId: string;
  plantNickname: string;
}

export function PlantJournalSection({
  plantId,
}: PlantJournalSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const [filter, setFilter] = useState<JournalFilter>('all');

  const {
    entries,
    isLoading,
    deleteLoadingEntries,
    loadJournalEntries,
    addJournalEntry,
    deleteJournalEntry,
    getJournalStats,
  } = useJournalEntries();

  const {
    records: wateringRecords,
    loadWateringRecords,
    isLoading: isLoadingWateringRecords
  } = useWateringRecords();

  useEffect(() => {
    if (plantId && !hasLoadedInitially) {
      Promise.all([
        loadJournalEntries(plantId),
        loadWateringRecords(plantId)
      ]).then(() => {
        setHasLoadedInitially(true);
      });
    }
  }, [plantId, loadJournalEntries, loadWateringRecords, hasLoadedInitially]);

  const stats = getJournalStats(plantId);

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'watering') return entry.title === 'Watered';
    if (filter === 'fertilization') return entry.title === 'Fertilized' || entry.title === 'Fertilization note';
    // 'other' — everything that isn't a watering or fertilization
    return entry.title !== 'Watered' && entry.title !== 'Fertilized' && entry.title !== 'Fertilization note';
  });

  const handleSubmitEntry = async (formData: JournalEntryFormData) => {
    const success = await addJournalEntry(
      plantId,
      formData.title,
      formData.content,
      formData.mood,
      formData.images,
      formData.entryDate,
      formData.relatedWateringRecordId
    );

    if (success) {
      setShowForm(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    await deleteJournalEntry(entryId);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-plant-primary" />
            <CardTitle className="text-lg">
              Plant Journal
              {stats.totalEntries > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({stats.totalEntries} {stats.totalEntries === 1 ? 'entry' : 'entries'})
                </span>
              )}
            </CardTitle>
          </div>

          <div className="flex gap-2">
            {!showForm && (
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Entry
              </Button>
            )}

            {entries.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {stats.totalEntries > 0 && !isExpanded && (
          <div className="flex gap-4 text-sm text-muted-foreground pt-2">
            {stats.entriesThisMonth > 0 && (
              <span>{stats.entriesThisMonth} this month</span>
            )}
            {stats.mostCommonMood && (
              <span>Most common: {stats.mostCommonMood}</span>
            )}
          </div>
        )}
      </CardHeader>

      {(showForm || isExpanded || entries.length === 0) && (
        <CardContent className="space-y-4">
          {/* Form */}
          {showForm && (
            <div>
              <JournalEntryForm
                plantId={plantId}
                wateringRecords={wateringRecords}
                isLoadingWateringRecords={isLoadingWateringRecords}
                onSubmit={handleSubmitEntry}
                isLoading={isLoading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                className="mt-2 w-full"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Filter Tabs */}
          {(isExpanded || entries.length === 0) && !showForm && entries.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {([
                { key: 'all', label: 'All', icon: BookOpen },
                { key: 'watering', label: 'Waterings', icon: Droplets },
                { key: 'fertilization', label: 'Fertilizations', icon: FlaskConical },
                { key: 'other', label: 'Other', icon: StickyNote },
              ] as const).map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={filter === key ? 'default' : 'outline'}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'text-xs h-7 px-2.5',
                    filter === key && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          )}

          {/* Entry List */}
          {(isExpanded || entries.length === 0) && !showForm && (
            <JournalEntryList
              entries={filteredEntries}
              isLoading={!hasLoadedInitially}
              onDeleteEntry={handleDeleteEntry}
              deleteLoadingEntries={deleteLoadingEntries}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
