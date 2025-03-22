import { DashboardShell } from "@/components/DashboardShell";
import { DashboardHeader } from "@/components/Header";
import SimpleImageGenerator from "@/components/SimpleImageGenerator";

export const metadata = {
  title: "Product Image Generator",
  description: "Generate professional product images with AI",
};

export default function ProductImageGeneratorPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Product Image Generator"
        text="Create professional product images using AI with Gemini 2.0 technology"
      />
      <div className="grid gap-8">
        <SimpleImageGenerator />
      </div>
    </DashboardShell>
  );
}
