// // components/cart/OtpDialog.tsx
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";

// interface OtpDialogProps {
//   isOpen: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSubmit: () => void;
//   otp: string[];
//   onOtpChange: (index: number, value: string) => void;
// }

// export const OtpDialog: React.FC<OtpDialogProps> = ({
//   isOpen,
//   onOpenChange,
//   onSubmit,
//   otp,
//   onOtpChange,
// }) => {
//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Enter OTP to Verify</DialogTitle>
//         </DialogHeader>
//         <div className="flex justify-center space-x-2 my-4">
//           {[0, 1, 2, 3].map((index) => (
//             <Input
//               key={index}
//               id={`otp-${index}`}
//               type="text"
//               maxLength={1}
//               className="w-12 text-center"
//               value={otp[index]}
//               onChange={(e) => onOtpChange(index, e.target.value)}
//             />
//           ))}
//         </div>
//         <DialogFooter>
//           <Button onClick={onSubmit}>Verify</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };


import { FC } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OtpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  otp: string[];
  handleOtpChange: (index: number, value: string) => void;
  handleOtpSubmit: () => void;
}

export const OtpDialog: FC<OtpDialogProps> = ({ isOpen, onOpenChange, otp, handleOtpChange, handleOtpSubmit }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter OTP to Verify</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center space-x-2 my-4">
          {[0, 1, 2, 3].map((index) => (
            <Input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              className="w-12 text-center"
              value={otp[index]}
              onChange={(e) => handleOtpChange(index, e.target.value)}
            />
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleOtpSubmit}>Verify</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
