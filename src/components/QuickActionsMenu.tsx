import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  X,
  Command,
  Zap,
  Home,
  Flower2,
  Droplets,
  Plus,
  Search,
  Settings,
  BarChart3,
  BookOpen,
  Bell,
  Moon,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayKey } from '@/hooks/useKeyboardShortcuts';
import {
  SheetGrabber,
  dialogSheetClasses,
  sheetHeaderClasses,
  sheetIconButtonClasses,
  sheetTitleClasses,
} from '@/components/ui/bento-sheet';

interface QuickAction {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category: 'navigation' | 'plant-actions' | 'ui' | 'general';
  icon: React.ComponentType<{ className?: string }>;
  action?: () => void;
}

interface QuickActionsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage?: string;
}

const allActions: QuickAction[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    name: 'Go to Dashboard',
    description: 'Navigate to your plant dashboard',
    shortcut: 'G then D',
    category: 'navigation',
    icon: Home,
  },
  {
    id: 'nav-my-plants',
    name: 'Go to My Plants',
    description: 'View your plant collection',
    shortcut: 'G then P',
    category: 'navigation',
    icon: Flower2,
  },
  {
    id: 'nav-catalog',
    name: 'Go to Plant Catalog',
    description: 'Browse available plants',
    shortcut: 'G then C',
    category: 'navigation',
    icon: BookOpen,
  },
  {
    id: 'nav-analytics',
    name: 'Go to Analytics',
    description: 'View plant care analytics',
    shortcut: 'G then A',
    category: 'navigation',
    icon: BarChart3,
  },
  {
    id: 'nav-settings',
    name: 'Go to Settings',
    description: 'Manage your settings',
    shortcut: 'G then S',
    category: 'navigation',
    icon: Settings,
  },
  // Plant Actions
  {
    id: 'add-plant',
    name: 'Add New Plant',
    description: 'Add a plant to your collection',
    shortcut: 'A',
    category: 'plant-actions',
    icon: Plus,
  },
  {
    id: 'water-all',
    name: 'Water All Due Plants',
    description: 'Water all plants that are due',
    shortcut: 'Shift+W',
    category: 'plant-actions',
    icon: Droplets,
  },
  {
    id: 'search',
    name: 'Search Plants',
    description: 'Search your plant collection',
    shortcut: '/',
    category: 'general',
    icon: Search,
  },
  // UI Actions
  {
    id: 'toggle-theme',
    name: 'Toggle Theme',
    description: 'Switch between light and dark mode',
    shortcut: 'T',
    category: 'ui',
    icon: Moon,
  },
  {
    id: 'notifications',
    name: 'Open Notifications',
    description: 'View your notifications',
    shortcut: 'N',
    category: 'ui',
    icon: Bell,
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions Menu',
    description: 'Open this menu',
    shortcut: 'Shift+?',
    category: 'general',
    icon: Keyboard,
  },
];

const categoryLabels = {
  navigation: 'Navigation',
  'plant-actions': 'Plant Actions',
  ui: 'Interface',
  general: 'General',
};

const categoryIcons = {
  navigation: Command,
  'plant-actions': Flower2,
  ui: Moon,
  general: Zap,
};

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  open,
  onOpenChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const query = searchQuery.trim().toLowerCase();
  const filteredActions = query
    ? allActions.filter(
        (action) =>
          action.name.toLowerCase().includes(query) ||
          action.description.toLowerCase().includes(query) ||
          action.category.toLowerCase().includes(query) ||
          (action.shortcut && action.shortcut.toLowerCase().includes(query))
      )
    : allActions;

  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  const handleActionClick = (action: QuickAction) => {
    if (action.action) {
      action.action();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogSheetClasses, 'sm:max-w-2xl')}>
        <SheetGrabber />
        <DialogHeader className={sheetHeaderClasses}>
          <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] bg-sprout-primary text-sprout-cream flex items-center justify-center">
            <Keyboard className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className={sheetTitleClasses}>Keyboard shortcuts</DialogTitle>
            <DialogDescription className="text-sm font-medium">Quick ways around sprouthub</DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(sheetIconButtonClasses, 'self-start')}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex h-12 items-center gap-2.5 rounded-2xl bg-card px-4 text-muted-foreground">
            <Search className="h-5 w-5 shrink-0" />
            <input
              placeholder="Search shortcuts"
              aria-label="Search shortcuts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-medium text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {Object.entries(groupedActions).length === 0 ? (
            <p className="rounded-3xl bg-card p-5 text-sm text-muted-foreground text-center">
              No shortcuts matching "{searchQuery}"
            </p>
          ) : (
            Object.entries(groupedActions).map(([category, actions]) => {
              const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Zap;
              return (
                <section key={category}>
                  <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1.5 mb-2">
                    <CategoryIcon className="h-4 w-4" />
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                  <ul className="rounded-3xl bg-card p-1.5">
                    {actions.map((action) => {
                      const Icon = action.icon;
                      const row = (
                        <>
                          <span className="w-9 h-9 shrink-0 rounded-xl bg-field text-foreground flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 min-w-0 text-left">
                            <span className="block text-[15px] font-bold text-foreground">{action.name}</span>
                            <span className="block text-[13px] text-muted-foreground">{action.description}</span>
                          </span>
                          {action.shortcut && (
                            <kbd className="shrink-0 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-field text-foreground">
                              {getDisplayKey(action.shortcut)}
                            </kbd>
                          )}
                        </>
                      );
                      return (
                        <li key={action.id}>
                          {action.action ? (
                            <button
                              type="button"
                              onClick={() => handleActionClick(action)}
                              className="w-full flex items-center gap-3 rounded-[18px] px-2.5 py-2 hover:bg-field"
                            >
                              {row}
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 rounded-[18px] px-2.5 py-2">{row}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}

          <p className="text-[13px] text-muted-foreground text-center">
            Press <kbd className="font-mono font-bold px-1.5 py-0.5 rounded-md bg-card text-foreground">Shift</kbd> +{' '}
            <kbd className="font-mono font-bold px-1.5 py-0.5 rounded-md bg-card text-foreground">?</kbd> to open this anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
