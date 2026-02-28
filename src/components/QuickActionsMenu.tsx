import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
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
  const [filteredActions, setFilteredActions] = useState(allActions);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredActions(allActions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allActions.filter(
        (action) =>
          action.name.toLowerCase().includes(query) ||
          action.description.toLowerCase().includes(query) ||
          action.category.toLowerCase().includes(query) ||
          (action.shortcut && action.shortcut.toLowerCase().includes(query))
      );
      setFilteredActions(filtered);
    }
  }, [searchQuery]);

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
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-sprout-primary/10 dark:bg-sprout-primary/20 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-sprout-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Quick Actions</DialogTitle>
              <DialogDescription>
                Keyboard shortcuts and quick commands
              </DialogDescription>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[calc(80vh-180px)]">
          {Object.entries(groupedActions).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No actions found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActions).map(([category, actions]) => {
                const CategoryIcon =
                  categoryIcons[category as keyof typeof categoryIcons] || Zap;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <div
                            key={action.id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg border transition-colors',
                              action.action
                                ? 'cursor-pointer hover:bg-muted'
                                : 'cursor-default'
                            )}
                            onClick={() => handleActionClick(action)}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="mt-0.5">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">
                                  {action.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {action.description}
                                </div>
                              </div>
                            </div>
                            {action.shortcut && (
                              <Badge
                                variant="secondary"
                                className="ml-3 font-mono text-xs shrink-0"
                              >
                                {getDisplayKey(action.shortcut)}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer tip */}
        <div className="px-6 py-3 bg-muted/50 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">Shift</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">?</kbd> to open this menu anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
