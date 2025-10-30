# SproutHub - Project Instructions

## Supabase Configuration

**Primary Supabase Project**:
- **Project ID**: `ufhjudswppdqupjbqbwm`
- **Project Name**: sprouthub
- **Region**: us-east-2
- **Database**: PostgreSQL 17.6.1

When using Supabase MCP tools in this project, always use project ID: `ufhjudswppdqupjbqbwm`

## Project Details

This is a plant care tracking application built with:
- React + TypeScript
- Supabase (PostgreSQL database, Auth, Storage)
- Vite
- Playwright for E2E testing

## Important Notes

- Environment variables are stored in `.env` and `.env.local` (both gitignored)
- Supabase configuration is in `supabase/config.toml`
- Test credentials are available in `.env` for Playwright tests

## UI Components & Patterns

### Toast Notifications

**IMPORTANT**: This project uses **Sonner** for all toast notifications.

When implementing toast notifications:

```typescript
// ✅ CORRECT - Use Sonner
import { toast } from "sonner";

// Success toast
toast.success("Title", {
  description: "Optional description text",
});

// Error toast
toast.error("Error occurred", {
  description: "Error details here",
});

// Info toast
toast.info("Information", {
  description: "Info details",
});

// Warning toast
toast.warning("Warning", {
  description: "Warning details",
});
```

**DO NOT use**:
- ❌ `import { useToast } from "@/hooks/use-toast"` - This is a different toast system that is not configured in the app
- ❌ `const { toast } = useToast()` - This will not display toasts

The Sonner `<Toaster />` component is already configured in [App.tsx](../src/App.tsx) with custom styling and positioned at `top-right`.
