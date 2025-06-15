// Utility for uploading PDFs to temporary accessible URLs for Twilio WhatsApp
export async function uploadPDFToTempURL(pdfBlob: Blob, filename: string): Promise<string> {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', pdfBlob, filename);
    
    // Upload to a temporary file service (you can use your own backend endpoint)
    // For now, we'll create a data URL which works for smaller files
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        
        // Note: For production, you should upload to a proper file hosting service
        // like AWS S3, Cloudinary, or your own server endpoint
        // Data URLs have size limitations and may not work for all use cases
        
        // For demonstration, we'll return the data URL
        // In production, replace this with actual file upload logic
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw new Error('Failed to upload PDF for WhatsApp sending');
  }
}

// Alternative: Upload to your backend endpoint
export async function uploadPDFToBackend(pdfBlob: Blob, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', pdfBlob, filename);
    formData.append('type', 'pdf');
    formData.append('purpose', 'whatsapp-receipt');
    
    const response = await fetch('/api/upload-temp-file', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload PDF to backend');
    }
    
    const result = await response.json();
    return result.url; // Should return a publicly accessible URL
  } catch (error) {
    console.error('Error uploading PDF to backend:', error);
    throw new Error('Failed to upload PDF to backend');
  }
}

// Create a temporary URL endpoint for the PDF (if you have a backend route)
export async function createTempPDFEndpoint(pdfBase64: string, filename: string): Promise<string> {
  try {
    const response = await fetch('/api/temp-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfData: pdfBase64,
        filename,
        expiresIn: 3600, // 1 hour
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create temporary PDF endpoint');
    }
    
    const result = await response.json();
    return result.url; // Temporary URL that Twilio can access
  } catch (error) {
    console.error('Error creating temp PDF endpoint:', error);
    throw new Error('Failed to create temporary PDF endpoint');
  }
}