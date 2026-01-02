import { toast } from "sonner";

// Toast helper functions with consistent styling
export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showInfo = (message: string) => {
  toast.info(message);
};

// Handle API errors with appropriate messages
export const handleApiError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error) {
    showError(error.message || fallbackMessage);
  } else {
    showError(fallbackMessage);
  }
};
