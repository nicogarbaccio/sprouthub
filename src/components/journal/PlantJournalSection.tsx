import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { JournalEntryForm } from './JournalEntryForm';
import { JournalEntryList } from './JournalEntryList';
import { JournalEntryFormData } from '@/types/journalTypes';

interface PlantJournalSectionProps {
  plantId: string;
  plantNickname: string;
}

export function PlantJournalSection({
  plantId,
  plantNickname,
}: PlantJournalSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    entries,
    isLoading,
    deleteLoadingEntries,
    loadJournalEntries,
    addJournalEntry,
    deleteJournalEntry,
    getJournalStats,
  } = useJournalEntries();

  useEffect(() => {
    loadJournalEntries(plantId);
  }, [plantId, loadJournalEntries]);

  const stats = getJournalStats(plantId);

  const handleSubmitEntry = async (formData: JournalEntryFormData) => {
    const success = await addJournalEntry(
      plantId,
      formData.title,
      formData.content,
      formData.mood,
      formData.images,
      formData.entryDate
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
                onSubmit={handleSubmitEntry}
                isLoading={isLoading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                className="mt-2 w-full border-green-700/30 text-green-700 hover:bg-green-700/10 dark:border-green-600/30 dark:text-green-400 dark:hover:bg-green-600/10"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Entry List */}
          {(isExpanded || entries.length === 0) && !showForm && (
            <JournalEntryList
              entries={entries}
              isLoading={isLoading}
              onDeleteEntry={handleDeleteEntry}
              deleteLoadingEntries={deleteLoadingEntries}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
