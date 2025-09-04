import { useToast } from "@/hooks/use-toast";
import {
 Toast,
 ToastClose,
 ToastDescription,
 ToastProvider,
 ToastTitle,
 ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
 const { toasts } = useToast();

 return (
  <ToastProvider>
   {toasts.map(function ({ id, title, description, action, ...props }) {
    return (
     <Toast key={id} {...props}>
      <div className="grid gap-1">
       {title && (
        <ToastTitle
         {...(title.toLowerCase().includes("sign in failed")
          ? { "data-testid": "sign-in-error-toast" }
          : {})}
        >
         {title}
        </ToastTitle>
       )}
       {description && (
        <ToastDescription>{description}</ToastDescription>
       )}
      </div>
      {action}
      <ToastClose />
     </Toast>
    );
   })}
   <ToastViewport />
  </ToastProvider>
 );
}
