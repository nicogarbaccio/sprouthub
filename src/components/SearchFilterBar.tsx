import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Droplets,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoomLabel } from '@/utils/rooms';

export type PlantStatus =
  | 'all'
  | 'thirsty'
  | 'overdue'
  | 'due-today'
  | 'on-schedule'
  | 'needs-attention'
  | 'unscheduled'
  | 'ready-to-feed';
export type SortOption = 'name-asc' | 'name-desc' | 'last-watered' | 'next-watering' | 'days-owned';

export interface SearchFilterState {
  searchQuery: string;
  status: PlantStatus;
  room: string;
  sortBy: SortOption;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  status: PlantStatus;
  onStatusChange: (status: PlantStatus) => void;
  room: string;
  onRoomChange: (room: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableRooms: string[];
  onClearAll: () => void;
  /** Show the search field (toggled from the page header) */
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  totalCount: number;
  thirstyCount: number;
  className?: string;
}

export const statusOptions = [
  { value: 'all', label: 'All Plants' },
  { value: 'thirsty', label: 'Thirsty' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-today', label: 'Due Today' },
  { value: 'needs-attention', label: 'Needs Attention' },
  { value: 'on-schedule', label: 'On Schedule' },
  { value: 'unscheduled', label: 'No Schedule' },
  { value: 'ready-to-feed', label: 'Ready to Feed' },
] as const;

export const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'last-watered', label: 'Recently Watered' },
  { value: 'next-watering', label: 'Next Watering' },
  { value: 'days-owned', label: 'Newest First' },
] as const;

const chipBase =
  'flex-none h-11 px-4 rounded-full flex items-center gap-1.5 font-bold text-sm transition-colors whitespace-nowrap';

/**
 * My Plants filter row: a scrolling line of chips (All, Thirsty, one per room) followed by Sort
 * and Filters, with the search field shown above when opened from the page header.
 */
export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  status,
  onStatusChange,
  room,
  onRoomChange,
  sortBy,
  onSortChange,
  availableRooms,
  onClearAll,
  searchOpen,
  onSearchOpenChange,
  totalCount,
  thirstyCount,
  className,
}) => {
  const showSearch = searchOpen || searchQuery !== '';
  const isAll = status === 'all' && room === 'all';
  // Status filters other than All/Thirsty only live in the Filters popover
  const hasPanelFilter = status !== 'all' && status !== 'thirsty';

  return (
    <div className={cn('space-y-3', className)}>
      {showSearch && (
        <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
          <Input
            type="search"
            placeholder="Search plants"
            aria-label="Search plants"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus={searchOpen && searchQuery === ''}
            className="h-[52px] rounded-[18px] border-0 bg-card pl-12 pr-12 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-0"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground"
            onClick={() => {
              onSearchChange('');
              onSearchOpenChange(false);
            }}
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div
        className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap"
        role="toolbar"
        aria-label="Filter plants"
      >
        <button
          type="button"
          onClick={() => {
            onStatusChange('all');
            onRoomChange('all');
          }}
          aria-pressed={isAll}
          className={cn(chipBase, isAll ? 'bg-foreground text-background' : 'bg-card text-foreground')}
        >
          All <span className="opacity-70">{totalCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusChange(status === 'thirsty' ? 'all' : 'thirsty')}
          aria-pressed={status === 'thirsty'}
          className={cn(
            chipBase,
            status === 'thirsty' ? 'bg-sprout-water text-sprout-dark' : 'bg-card text-foreground'
          )}
        >
          <Droplets className="h-4 w-4" strokeWidth={2.2} />
          Thirsty <span className="opacity-70">{thirstyCount}</span>
        </button>

        {availableRooms.map((roomName) => {
          const active = room === roomName;
          return (
            <button
              key={roomName}
              type="button"
              onClick={() => onRoomChange(active ? 'all' : roomName)}
              aria-pressed={active}
              className={cn(chipBase, active ? 'bg-foreground text-background' : 'bg-card text-foreground')}
            >
              {getRoomLabel(roomName)}
            </button>
          );
        })}

        {/* Sort */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={cn(chipBase, 'bg-card text-foreground')}>
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 rounded-2xl" align="end">
            <div className="space-y-1">
              <h4 className="font-bold text-sm mb-2 px-2">Sort by</h4>
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'w-full h-10 px-3 rounded-xl flex items-center justify-between text-sm font-semibold',
                    sortBy === option.value ? 'bg-sprout-cream text-sprout-dark' : 'hover:bg-field'
                  )}
                  onClick={() => onSortChange(option.value)}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && <Check className="h-4 w-4 ml-2" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filters: the full status list and a room picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                chipBase,
                hasPanelFilter ? 'bg-foreground text-background' : 'bg-card text-foreground'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 rounded-2xl space-y-3" align="end">
            <div className="space-y-2">
              <label className="text-sm font-bold">Status</label>
              <Select value={status} onValueChange={(value) => onStatusChange(value as PlantStatus)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Room</label>
              <Select value={room} onValueChange={onRoomChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {availableRooms.map((roomName) => (
                    <SelectItem key={roomName} value={roomName}>
                      {getRoomLabel(roomName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(status !== 'all' || room !== 'all' || searchQuery !== '') && (
              <button
                type="button"
                onClick={onClearAll}
                className="w-full h-10 rounded-xl bg-field text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                Clear all
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
