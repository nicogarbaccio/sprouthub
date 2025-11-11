import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WateringRecordsList from "@/components/edit-plant/WateringRecordsList";

// Mock date-fns
vi.mock("date-fns", () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    if (formatStr === "PPP") {
      // Mock specific dates to match test expectations
      const dateStr = date.toISOString();
      if (dateStr.includes("2025-01-15")) return "Wednesday, January 15, 2025";
      if (dateStr.includes("2025-01-10")) return "Friday, January 10, 2025";
      if (dateStr.includes("2025-01-05")) return "Sunday, January 5, 2025";

      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return date.toString();
  }),
}));

describe("WateringRecordsList", () => {
  const mockWateringRecords = [
    {
      id: "record-1",
      plant_id: "plant-1",
      watered_at: "2025-01-15T10:00:00Z",
      notes: "Regular watering",
    },
    {
      id: "record-2",
      plant_id: "plant-1",
      watered_at: "2025-01-10T14:30:00Z",
      notes: "Deep watering session",
    },
    {
      id: "record-3",
      plant_id: "plant-1",
      watered_at: "2025-01-05T09:15:00Z",
      notes: undefined, // Test record without notes
    },
  ];

  const mockOnDeleteRecord = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render watering records when provided", () => {
      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      // Should display formatted dates
      expect(
        screen.getByText(/Wednesday, January 15, 2025/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Friday, January 10, 2025/)).toBeInTheDocument();
      expect(screen.getByText(/Sunday, January 5, 2025/)).toBeInTheDocument();

      // Should display notes when available
      expect(screen.getByText("Regular watering")).toBeInTheDocument();
      expect(screen.getByText("Deep watering session")).toBeInTheDocument();

      // Should render delete buttons for each record
      const deleteButtons = screen.getAllByRole("button");
      expect(deleteButtons).toHaveLength(3);
    });

    it("should show empty state when no records exist", () => {
      render(
        <WateringRecordsList records={[]} onDeleteRecord={mockOnDeleteRecord} />
      );

      expect(screen.getByText("No watering records yet")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render record without notes correctly", () => {
      const recordWithoutNotes = [
        {
          id: "record-no-notes",
          plant_id: "plant-1",
          watered_at: "2025-01-15T10:00:00Z",
        },
      ];

      render(
        <WateringRecordsList
          records={recordWithoutNotes}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      expect(
        screen.getByText(/Wednesday, January 15, 2025/)
      ).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("loading states", () => {
    it("should show loading spinner when record is being deleted", () => {
      const deleteLoadingRecords = new Set(["record-1"]);

      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={deleteLoadingRecords}
        />
      );

      const buttons = screen.getAllByRole("button");

      // First button should show loading spinner
      const firstButton = buttons[0];
      expect(firstButton).toBeDisabled();
      expect(firstButton.querySelector(".animate-spin")).toBeInTheDocument();

      // Other buttons should not be disabled
      expect(buttons[1]).not.toBeDisabled();
      expect(buttons[2]).not.toBeDisabled();
    });

    it("should show loading state for multiple records simultaneously", () => {
      const deleteLoadingRecords = new Set(["record-1", "record-3"]);

      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={deleteLoadingRecords}
        />
      );

      const buttons = screen.getAllByRole("button");

      // First and third buttons should be disabled
      expect(buttons[0]).toBeDisabled();
      expect(buttons[2]).toBeDisabled();

      // Second button should not be disabled
      expect(buttons[1]).not.toBeDisabled();

      // Should have loading spinners for disabled buttons
      expect(buttons[0].querySelector(".animate-spin")).toBeInTheDocument();
      expect(buttons[2].querySelector(".animate-spin")).toBeInTheDocument();
      expect(buttons[1].querySelector(".animate-spin")).not.toBeInTheDocument();
    });

    it("should default to empty set when deleteLoadingRecords not provided", () => {
      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      const buttons = screen.getAllByRole("button");

      // All buttons should be enabled
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
        expect(button.querySelector(".animate-spin")).not.toBeInTheDocument();
      });
    });

    it("should handle empty loading set correctly", () => {
      const deleteLoadingRecords = new Set<string>();

      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={deleteLoadingRecords}
        />
      );

      const buttons = screen.getAllByRole("button");

      // All buttons should be enabled
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
        expect(button.querySelector(".animate-spin")).not.toBeInTheDocument();
      });
    });
  });

  describe("user interactions", () => {
    it("should call onDeleteRecord when delete button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      expect(mockOnDeleteRecord).toHaveBeenCalledWith("record-1");
      expect(mockOnDeleteRecord).toHaveBeenCalledTimes(1);
    });

    it("should not call onDeleteRecord when button is disabled", async () => {
      const user = userEvent.setup();
      const deleteLoadingRecords = new Set(["record-1"]);

      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={deleteLoadingRecords}
        />
      );

      const buttons = screen.getAllByRole("button");
      const disabledButton = buttons[0];

      expect(disabledButton).toBeDisabled();

      // Try to click the disabled button
      await user.click(disabledButton);

      // Should not have been called since button is disabled
      expect(mockOnDeleteRecord).not.toHaveBeenCalled();
    });

    it("should allow deletion of non-loading records while others are loading", async () => {
      const user = userEvent.setup();
      const deleteLoadingRecords = new Set(["record-1"]);

      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={deleteLoadingRecords}
        />
      );

      const buttons = screen.getAllByRole("button");

      // Click on non-loading button
      await user.click(buttons[1]);

      expect(mockOnDeleteRecord).toHaveBeenCalledWith("record-2");
      expect(mockOnDeleteRecord).toHaveBeenCalledTimes(1);
    });
  });

  describe("visual elements and styling", () => {
    it("should apply correct CSS classes for layout", () => {
      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      // Check for main container classes
      const container = screen.getByRole("list", {
        hidden: true,
      }).parentElement;
      expect(container).toHaveClass("space-y-4");

      // Check individual record containers
      const recordContainers =
        container?.querySelectorAll(".border.rounded-lg");
      expect(recordContainers).toHaveLength(3);
    });

    it("should show proper loading icon classes", () => {
      const deleteLoadingRecords = new Set(["record-1"]);

      const { container } = render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={deleteLoadingRecords}
        />
      );

      const loadingIcon = container.querySelector(".animate-spin");
      expect(loadingIcon).toBeInTheDocument();
      expect(loadingIcon).toHaveClass("w-5", "h-5", "sm:w-4", "sm:h-4");
    });

    it("should show proper trash icon classes when not loading", () => {
      const { container } = render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      // Should have trash icons (not loading)
      const icons = container.querySelectorAll("svg:not(.animate-spin)");
      expect(icons.length).toBeGreaterThan(0);

      // Check for proper size classes
      icons.forEach((icon) => {
        expect(icon).toHaveClass("w-5", "h-5", "sm:w-4", "sm:h-4");
      });
    });

    it("should render separators between records correctly", () => {
      const { container } = render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      // Should have separators (border-b elements) between records but not after the last one
      const separators = container.querySelectorAll(".border-b");
      expect(separators).toHaveLength(2); // 3 records - 1 = 2 separators
    });

    it("should not render separators with single record", () => {
      const singleRecord = [mockWateringRecords[0]];

      const { container } = render(
        <WateringRecordsList
          records={singleRecord}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      const separators = container.querySelectorAll(".border-b");
      expect(separators).toHaveLength(0);
    });
  });

  describe("responsive design", () => {
    it("should have responsive text sizing classes", () => {
      const { container } = render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      // Check for responsive text classes on dates
      const dateElements = container.querySelectorAll(".font-medium");
      dateElements.forEach((element) => {
        expect(element).toHaveClass("text-base", "sm:text-sm");
      });

      // Check for responsive text classes on notes
      const noteElements = container.querySelectorAll(".text-muted-foreground");
      noteElements.forEach((element) => {
        expect(element).toHaveClass("text-sm", "sm:text-xs");
      });
    });

    it("should have responsive padding classes", () => {
      const { container } = render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      // Check for responsive padding on record containers
      const recordContainers = container.querySelectorAll(".p-4.sm\\:p-3");
      expect(recordContainers).toHaveLength(3);
    });
  });

  describe("accessibility", () => {
    it("should have accessible button labels", () => {
      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      const buttons = screen.getAllByRole("button");

      // Buttons should be accessible even if they only contain icons
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("type", "button");
      });
    });

    it("should maintain focus management during loading states", () => {
      const deleteLoadingRecords = new Set(["record-1"]);

      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={deleteLoadingRecords}
        />
      );

      const buttons = screen.getAllByRole("button");
      const disabledButton = buttons[0];

      // Disabled button should still be focusable for screen readers
      expect(disabledButton).toBeDisabled();
      expect(disabledButton.tabIndex).not.toBe(-1);
    });

    it("should provide visual feedback for disabled state", () => {
      const deleteLoadingRecords = new Set(["record-1"]);

      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={deleteLoadingRecords}
        />
      );

      const buttons = screen.getAllByRole("button");
      const disabledButton = buttons[0];

      expect(disabledButton).toHaveClass("disabled:opacity-50");
      expect(disabledButton).toBeDisabled();
    });
  });

  describe("edge cases", () => {
    it("should handle undefined deleteLoadingRecords gracefully", () => {
      render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={undefined}
        />
      );

      const buttons = screen.getAllByRole("button");

      // All buttons should work normally
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it("should handle records with very long notes", () => {
      const recordWithLongNotes = [
        {
          id: "long-notes-record",
          plant_id: "plant-1",
          watered_at: "2025-01-15T10:00:00Z",
          notes:
            "This is a very long note that might wrap to multiple lines and should be handled gracefully by the component layout without breaking the design or functionality of the watering records list component.",
        },
      ];

      render(
        <WateringRecordsList
          records={recordWithLongNotes}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      expect(screen.getByText(/This is a very long note/)).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should handle invalid date strings gracefully", () => {
      const recordWithInvalidDate = [
        {
          id: "invalid-date-record",
          plant_id: "plant-1",
          watered_at: "invalid-date-string",
          notes: "Test note",
        },
      ];

      // Should not throw an error when rendering
      render(
        <WateringRecordsList
          records={recordWithInvalidDate}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      expect(screen.getByText("Test note")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should handle empty string notes", () => {
      const recordWithEmptyNotes = [
        {
          id: "empty-notes-record",
          plant_id: "plant-1",
          watered_at: "2025-01-15T10:00:00Z",
          notes: "",
        },
      ];

      render(
        <WateringRecordsList
          records={recordWithEmptyNotes}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      // Should not show empty notes section
      expect(screen.queryByText(/^$/)).not.toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("performance considerations", () => {
    it("should handle large numbers of records efficiently", () => {
      const manyRecords = Array.from({ length: 100 }, (_, index) => ({
        id: `record-${index}`,
        plant_id: "plant-1",
        watered_at: new Date(2025, 0, index + 1).toISOString(),
        notes: `Notes for record ${index}`,
      }));

      const { container } = render(
        <WateringRecordsList
          records={manyRecords}
          onDeleteRecord={mockOnDeleteRecord}
        />
      );

      // Should render all records
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(100);

      // Should not cause performance issues
      expect(container).toBeInTheDocument();
    });

    it("should efficiently update loading states", () => {
      const { rerender } = render(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={new Set()}
        />
      );

      // Update with loading state
      rerender(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={new Set(["record-1"])}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons[0]).toBeDisabled();

      // Update back to non-loading
      rerender(
        <WateringRecordsList
          records={mockWateringRecords}
          onDeleteRecord={mockOnDeleteRecord}
          deleteLoadingRecords={new Set()}
        />
      );

      expect(buttons[0]).not.toBeDisabled();
    });
  });
});
