import { Metadata } from "next";
import { DashboardShell } from "@/components/DashboardShell";
import ImageToImageApp from "@/components/Image-gegeraer";

export const metadata: Metadata = {
  title: "Product Image Generator | Betty Organic",
  description: "Generate professional product images using AI",
};

export default function ProductImageGeneratorPage() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Image Generator</h1>
          <p className="text-muted-foreground">
            Upload your product photos and transform them into professional quality images
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Our AI will style your product photos to match our brand&apos;s consistent, professional aesthetic.
          Simply upload your image and click the generate button.
        </p>

        <ImageToImageApp />
      </div>
    </DashboardShell>
  );
}
