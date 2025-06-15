import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  customerName: string;
  customerEmail?: string;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  orderDate: string;
  orderTime: string;
  storeName?: string;
  storeContact?: string;
}

export async function generateReceiptPDF(receiptData: ReceiptData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150] // Thermal receipt size for elegant compact format
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 5;
  let y = margin + 5;

  // Elegant Header with Green Accent
  pdf.setFillColor(76, 175, 80); // Green background
  pdf.rect(0, 0, pageWidth, 15, 'F');

  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BETTY ORGANIC', pageWidth / 2, 8, { align: 'center' });

  y = 20;

  // Store info section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Fresh Organic Fruits & Vegetables', pageWidth / 2, y, { align: 'center' });
  y += 4;
  pdf.text('📞 +251944113998', pageWidth / 2, y, { align: 'center' });
  y += 4;
  pdf.text('🌐 Betty\'s Organic Store', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Elegant separator line
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(76, 175, 80);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Receipt title and order info
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE RECEIPT', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Order details in elegant box
  pdf.setFillColor(248, 249, 250); // Light gray background
  pdf.rect(margin, y - 2, pageWidth - (margin * 2), 20, 'F');

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');

  // Customer name
  pdf.text('Customer:', margin + 2, y + 2);
  pdf.setFont('helvetica', 'bold');
  pdf.text(receiptData.customerName, margin + 2, y + 6);

  // Order ID
  pdf.setFont('helvetica', 'normal');
  pdf.text('Order ID:', margin + 2, y + 10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(receiptData.orderId, margin + 2, y + 14);

  // Date and time on right
  pdf.setFont('helvetica', 'normal');
  pdf.text('Date:', pageWidth - margin - 25, y + 2);
  pdf.text(receiptData.orderDate.split(',')[0], pageWidth - margin - 25, y + 6);
  pdf.text('Time:', pageWidth - margin - 25, y + 10);
  pdf.text(receiptData.orderTime, pageWidth - margin - 25, y + 14);

  y += 25;

  // Items header
  pdf.setFillColor(76, 175, 80);
  pdf.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ITEM', margin + 2, y + 5);
  pdf.text('QTY', pageWidth - margin - 20, y + 5);
  pdf.text('PRICE', pageWidth - margin - 8, y + 5);
  y += 10;

  // Items list with alternating background
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(7);
  receiptData.items.forEach((item, index) => {
    // Alternating row colors for elegance
    if (index % 2 === 0) {
      pdf.setFillColor(252, 252, 252);
      pdf.rect(margin, y - 1, pageWidth - (margin * 2), 6, 'F');
    }

    // Item name (truncate if too long)
    pdf.setFont('helvetica', 'normal');
    const itemName = item.name.length > 18 ? item.name.substring(0, 15) + '...' : item.name;
    pdf.text(itemName, margin + 2, y + 3);

    // Quantity
    pdf.text(`${(item.quantity * 1000).toFixed(0)}g`, pageWidth - margin - 20, y + 3);

    // Price
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${item.price.toFixed(2)}`, pageWidth - margin - 8, y + 3, { align: 'right' });

    y += 6;
  });

  // Elegant total section
  y += 5;
  pdf.setFillColor(76, 175, 80);
  pdf.rect(margin, y, pageWidth - (margin * 2), 12, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL:', margin + 2, y + 8);
  pdf.text(`ETB ${receiptData.total.toFixed(2)}`, pageWidth - margin - 2, y + 8, { align: 'right' });

  y += 20;

  // Payment info and barcode section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Payment Method: Cash/Mobile Payment', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Simple barcode representation
  pdf.setFontSize(6);
  pdf.text('|||||| ||| |||| | ||| |||||| ||| ||||', pageWidth / 2, y, { align: 'center' });
  y += 3;
  pdf.text(receiptData.orderId.replace(/-/g, ''), pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Footer with thank you message
  pdf.setFillColor(248, 249, 250);
  pdf.rect(margin, y, pageWidth - (margin * 2), 15, 'F');

  pdf.setTextColor(76, 175, 80);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🌿 THANK YOU FOR CHOOSING 🌿', pageWidth / 2, y + 5, { align: 'center' });
  pdf.text('BETTY ORGANIC!', pageWidth / 2, y + 9, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Fresh • Organic • Healthy', pageWidth / 2, y + 12, { align: 'center' });
  const totalText = `Total Amount:`;
  const totalAmount = `ETB ${receiptData.total.toFixed(2)}`;

  pdf.text(totalText, margin, y);
  const totalAmountWidth = pdf.getTextWidth(totalAmount);
  pdf.text(totalAmount, pageWidth - margin - totalAmountWidth, y);
  y += 25;

  // Barcode section (using order ID)
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');

  // Simple barcode representation using text
  const barcodeText = receiptData.orderId.replace(/-/g, '');
  const barcodeDisplay = '||||| |||| | ||| |||| | |||| |||||'; // Simple barcode pattern
  pdf.text(barcodeDisplay, pageWidth / 2, y, { align: 'center' });
  y += 5;
  pdf.text(barcodeText, pageWidth / 2, y, { align: 'center' });
  y += 20;

  // Order Details section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(128, 128, 128);
  pdf.text('Order Details', pageWidth / 2, y, { align: 'center' });
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date: ${receiptData.orderDate}`, pageWidth / 2, y, { align: 'center' });
  y += 6;
  pdf.text(`Time: ${receiptData.orderTime}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Footer
  pdf.setTextColor(76, 175, 80); // Green color
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🌿 Fresh • Organic • Healthy 🌿', pageWidth / 2, y, { align: 'center' });

  return pdf.output('blob');
}

export async function generateReceiptFromHTML(elementId: string): Promise<Blob> {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    throw new Error('generateReceiptFromHTML can only be called in browser environment');
  }
  
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Receipt element not found');
  }

  // Create canvas from HTML element
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');

  // Calculate PDF dimensions
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('portrait', 'mm', 'a4');

  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add additional pages if needed
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output('blob');
}

// NEW: Generate receipt as PNG image (for WhatsApp sending)
export async function generateReceiptImage(receiptData: ReceiptData): Promise<Blob> {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    throw new Error('generateReceiptImage can only be called in browser environment');
  }
  
  // Additional environment checks
  if (typeof html2canvas === 'undefined') {
    throw new Error('html2canvas is not available');
  }
  
  // Validate receipt data
  if (!receiptData || typeof receiptData !== 'object') {
    throw new Error('Invalid receipt data provided');
  }
  
  if (!receiptData.customerName || !receiptData.orderId || !receiptData.items || !Array.isArray(receiptData.items)) {
    throw new Error('Missing required receipt data fields');
  }
  
  console.log('Receipt data validation passed:', receiptData);
  
  // Create a temporary HTML element for the elegant shadcn/ui style receipt
  const receiptElement = document.createElement('div');
  receiptElement.style.width = '600px';
  receiptElement.style.backgroundColor = '#ffffff';
  receiptElement.style.padding = '32px';
  receiptElement.style.fontFamily = '"Inter", system-ui, -apple-system, sans-serif';
  receiptElement.style.fontSize = '14px';
  receiptElement.style.position = 'absolute';
  receiptElement.style.left = '-9999px';
  receiptElement.style.top = '-9999px';
  receiptElement.style.border = '1px solid #e2e8f0';
  receiptElement.style.borderRadius = '8px';
  receiptElement.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';  // Generate a professional-looking barcode pattern
  const generateBarcode = (text: string) => {
    const barcodeWidth = 280;
    const barcodeHeight = 50;
    const bars = [];

    // Create a more realistic barcode pattern based on Code 128 style
    const cleanText = text.replace(/[^A-Z0-9]/g, '');

    // Start pattern (similar to Code 128 start)
    const startPattern = [2, 1, 2, 3, 2, 1];
    const stopPattern = [2, 3, 3, 1, 1, 1, 2];

    // Calculate total width first to center the barcode
    let totalWidth = 0;

    // Add start pattern width
    startPattern.forEach(width => totalWidth += width);

    // Add data pattern width
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const charCode = char.charCodeAt(0);

      const pattern = [
        (charCode % 3) + 1,  // bar
        (charCode % 2) + 1,  // space
        (charCode % 4) + 1,  // bar
        (charCode % 3) + 1,  // space
        (charCode % 2) + 2,  // bar
        (charCode % 2) + 1   // space
      ];

      pattern.forEach(width => totalWidth += width);
    }

    // Add stop pattern width
    stopPattern.forEach(width => totalWidth += width);

    // Center the barcode in the SVG
    let x = (barcodeWidth - totalWidth) / 2;

    // Add start pattern
    for (let i = 0; i < startPattern.length; i++) {
      const width = startPattern[i];
      const isBlack = i % 2 === 0;
      if (isBlack) {
        bars.push(`<rect x="${x}" y="5" width="${width}" height="${barcodeHeight - 10}" fill="#000000"></rect>`);
      }
      x += width;
    }

    // Add data pattern - encode each character
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const charCode = char.charCodeAt(0);

      // Generate pattern based on character (simplified encoding)
      const pattern = [
        (charCode % 3) + 1,  // bar
        (charCode % 2) + 1,  // space
        (charCode % 4) + 1,  // bar
        (charCode % 3) + 1,  // space
        (charCode % 2) + 2,  // bar
        (charCode % 2) + 1   // space
      ];

      for (let j = 0; j < pattern.length; j++) {
        const width = pattern[j];
        const isBlack = j % 2 === 0;
        if (isBlack) {
          bars.push(`<rect x="${x}" y="5" width="${width}" height="${barcodeHeight - 10}" fill="#000000"></rect>`);
        }
        x += width;
      }
    }

    // Add stop pattern
    for (let i = 0; i < stopPattern.length; i++) {
      const width = stopPattern[i];
      const isBlack = i % 2 === 0;
      if (isBlack) {
        bars.push(`<rect x="${x}" y="5" width="${width}" height="${barcodeHeight - 10}" fill="#000000"></rect>`);
      }
      x += width;
    }

    return `
      <svg width="${barcodeWidth}" height="${barcodeHeight}" style="background: white; border: 1px solid #d1d5db; border-radius: 4px;">
        ${bars.join('')}
      </svg>
    `;
  };

  // Create elegant shadcn/ui style receipt HTML
  receiptElement.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; color: #0f172a;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 8px 0; color: #1e293b;">Betty Organic</h1>
        <p style="font-size: 16px; color: #64748b; margin: 0;">Fresh Organic Fruits & Vegetables</p>
        <p style="font-size: 14px; color: #64748b; margin: 8px 0 0 0;">Thank you for your order!</p>
      </div>

      <!-- Customer Info Section -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <p style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #374151;">Customer: ${receiptData.customerName}</p>
            ${receiptData.customerEmail ? `<p style="font-size: 14px; color: #6b7280; margin: 0;">(${receiptData.customerEmail})</p>` : ''}
          </div>
          <div style="text-align: right;">
            <p style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #374151;">Order ID: ${receiptData.orderId}</p>
          </div>
        </div>
      </div>

      <!-- Order Items Header -->
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 18px; font-weight: 600; margin: 0; color: #374151;">Order Items:</h2>
      </div>

      <!-- Items List -->
      <div style="margin-bottom: 24px;">
        ${receiptData.items.map((item, index) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; ${index !== receiptData.items.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
            <div style="flex: 1;">
              <span style="font-size: 14px; color: #374151;">${item.name} (${(item.quantity * 1000).toFixed(0)}g)</span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 14px; font-weight: 600; color: #374151;">ETB ${item.price.toFixed(2)}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Total Amount -->
      <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 20px; font-weight: 700; color: #1e293b;">Total Amount:</span>
          <span style="font-size: 20px; font-weight: 700; color: #1e293b;">ETB ${receiptData.total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Barcode Section -->
      <div style="text-align: center; margin-bottom: 32px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="margin-bottom: 8px;">
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Order Barcode</p>
        </div>
        <div style="display: flex; justify-content: center; margin-bottom: 12px;">
          ${generateBarcode(receiptData.orderId)}
        </div>
        <p style="font-size: 14px; font-weight: 600; margin: 0; font-family: 'Courier New', monospace; color: #374151; letter-spacing: 1px;">
          ${receiptData.orderId}
        </p>
        <p style="font-size: 10px; color: #9ca3af; margin: 4px 0 0 0;">
          Scan for order verification
        </p>
      </div>

      <!-- Order Details -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #374151;">Order Details</h3>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Date: ${receiptData.orderDate}</p>
        <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Time: ${receiptData.orderTime}</p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">
        <p style="font-size: 14px; font-weight: 600; margin: 0 0 4px 0; color: #6b7280;">Fresh • Organic • Healthy</p>
      </div>
    </div>
  `;

  // Add to DOM temporarily
  document.body.appendChild(receiptElement);

  try {
    console.log('Starting html2canvas conversion...');
    
    // Convert to canvas with high quality
    const canvas = await html2canvas(receiptElement, {
      scale: 3, // High resolution for crisp text and barcode
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 600,
      height: receiptElement.scrollHeight,
      logging: true // Enable console logs for debugging
    });

    console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Blob created successfully:', blob.size, 'bytes');
            resolve(blob);
          } else {
            console.error('Failed to create blob from canvas');
            reject(new Error('Failed to generate image blob'));
          }
        }, 'image/png', 0.95); // High quality PNG
      } catch (error) {
        console.error('Error in toBlob:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error in html2canvas conversion:', error);
    throw error;
  } finally {
    // Clean up
    try {
      document.body.removeChild(receiptElement);
      console.log('DOM element cleaned up');
    } catch (cleanupError) {
      console.warn('Error during cleanup:', cleanupError);
    }
  }
}

export function downloadPDF(blob: Blob, filename: string) {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    throw new Error('downloadPDF can only be called in browser environment');
  }
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}