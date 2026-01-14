import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Filter,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlantStatus = 'all' | 'overdue' | 'due-today' | 'on-schedule' | 'needs-attention';
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
  className?: string;
}

const statusOptions = [
  { value: 'all', label: 'All Plants' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-today', label: 'Due Today' },
  { value: 'needs-attention', label: 'Needs Attention' },
  { value: 'on-schedule', label: 'On Schedule' },
] as const;

const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'last-watered', label: 'Recently Watered' },
  { value: 'next-watering', label: 'Next Watering' },
  { value: 'days-owned', label: 'Newest First' },
] as const;

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
  className,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = status !== 'all' || room !== 'all' || searchQuery !== '';
  const filterCount = [
    status !== 'all',
    room !== 'all',
    searchQuery !== '',
  ].filter(Boolean).length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search plants..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant={hasActiveFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {filterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-5 px-1.5 bg-white dark:bg-gray-800"
            >
              {filterCount}
            </Badge>
          )}
        </Button>

        {/* Sort Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm mb-3">Sort by</h4>
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                  onClick={() => onSortChange(option.value)}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearAll}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg border">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value) => onStatusChange(value as PlantStatus)}>
              <SelectTrigger>
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

          {/* Room Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Room</label>
            <Select value={room} onValueChange={onRoomChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {availableRooms.map((roomName) => (
                  <SelectItem key={roomName} value={roomName}>
                    {roomName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchQuery}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchChange('')}
              />
            </Badge>
          )}
          {status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {statusOptions.find((s) => s.value === status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onStatusChange('all')}
              />
            </Badge>
          )}
          {room !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Room: {room}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onRoomChange('all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
