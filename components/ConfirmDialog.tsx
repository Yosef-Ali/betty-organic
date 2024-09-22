import { FC } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  isConfirmDialogOpen: boolean;
  setIsConfirmDialogOpen: (open: boolean) => void;
  confirmAction: "save" | "cancel" | null;
  handleConfirmAction: () => void;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isConfirmDialogOpen,
  setIsConfirmDialogOpen,
  confirmAction,
  handleConfirmAction,
}) => (
  <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {confirmAction === "save"
            ? "Confirm Save Order"
            : "Confirm Cancel Order"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {confirmAction === "save"
            ? "Are you sure you want to save this order? This action cannot be undone."
            : "Are you sure you want to cancel this order? All changes will be lost."}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>No</AlertDialogCancel>
        <AlertDialogAction onClick={handleConfirmAction}>Yes</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDialog;
