import toastLib, { toast as hotToast } from "react-hot-toast";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

function toast({ title, description, variant }: ToastOptions) {
  const message = title && description ? `${title}\n${description}` : title || description || "";
  
  if (variant === "destructive") {
    return hotToast.error(message);
  }
  
  return hotToast.success(message);
}

function useToast() {
  return {
    toast,
  };
}

export { useToast, toast };
