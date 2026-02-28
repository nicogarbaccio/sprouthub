import { Button } from "@/components/ui/button";

interface FormActionsProps {
  isSubmitting: boolean;
  isValid: boolean;
  onCancel: () => void;
}

export const FormActions = ({
  isSubmitting,
  isValid,
  onCancel,
}: FormActionsProps) => {
  return (
    <div className="flex gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1 border-plant-secondary/30 hover:bg-plant-secondary/10"
        disabled={isSubmitting}
        data-testid="add-plant-cancel-button"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium"
        data-testid="add-plant-submit-button"
      >
        {isSubmitting ? "Adding..." : "Add Plant"}
      </Button>
    </div>
  );
};
