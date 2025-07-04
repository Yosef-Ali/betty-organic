import puppeteer from 'puppeteer';

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

export async function generateReceiptImage(receiptData: ReceiptData): Promise<Buffer> {
  // Create HTML that exactly matches your sales page invoice with react-barcode CDN
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
      <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <style>
        body {
          margin: 0;
          padding: 40px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: white;
          color: #000;
          width: 600px;
        }
        
        .invoice-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .title {
          font-size: 32px;
          font-weight: bold;
          color: #000;
          margin: 0 0 12px 0;
        }
        
        .subtitle {
          font-size: 16px;
          color: #666;
          margin: 0 0 10px 0;
        }
        
        .thank-you {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        
        .customer-info {
          text-align: center;
          margin: 30px 0;
        }
        
        .customer-name {
          font-size: 16px;
          color: #000;
          margin: 0 0 8px 0;
        }
        
        .customer-email {
          font-size: 14px;
          color: #666;
          margin: 0 0 12px 0;
        }
        
        .order-id {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        
        .items-section {
          margin: 30px 0;
        }
        
        .items-title {
          font-size: 18px;
          font-weight: bold;
          color: #000;
          margin: 0 0 15px 0;
        }
        
        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          font-size: 14px;
        }
        
        .item-name {
          color: #000;
        }
        
        .item-price {
          color: #000;
          font-weight: 500;
        }
        
        .separator {
          border-top: 1px solid #ccc;
          margin: 20px 0;
        }
        
        .total-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 20px;
          font-weight: bold;
          color: #000;
          margin: 15px 0 40px 0;
        }
        
        .barcode-section {
          text-align: center;
          margin: 40px 0;
        }
        
        .barcode-container {
          display: inline-block;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 10px;
        }
        
        .barcode-text {
          font-size: 14px;
          color: #000;
          font-weight: 500;
          margin: 8px 0 0 0;
        }
        
        .order-details {
          text-align: center;
          margin: 30px 0 25px 0;
        }
        
        .details-title {
          font-size: 14px;
          color: #666;
          margin: 0 0 12px 0;
        }
        
        .details-text {
          font-size: 12px;
          color: #666;
          margin: 0 0 8px 0;
        }
        
        .footer {
          text-align: center;
          font-size: 14px;
          color: #4CAF50;
          margin: 25px 0 0 0;
        }
        
        .barcode {
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <h1 class="title">Betty Organic</h1>
          <p class="subtitle">Fresh Organic Fruits & Vegetables</p>
          <p class="thank-you">Thank you for your order!</p>
        </div>
        
        <!-- Customer Info -->
        <div class="customer-info">
          <p class="customer-name">Customer: ${receiptData.customerName}</p>
          ${receiptData.customerEmail ? `<p class="customer-email">(${receiptData.customerEmail})</p>` : ''}
          <p class="order-id">Order ID: ${receiptData.orderId}</p>
        </div>
        
        <!-- Order Items -->
        <div class="items-section">
          <h2 class="items-title">Order Items:</h2>
          ${receiptData.items.map(item => `
            <div class="item-row">
              <span class="item-name">${item.name} (${Math.round(item.quantity * 1000)}g)</span>
              <span class="item-price">ETB ${item.price.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <!-- Separator -->
        <div class="separator"></div>
        
        <!-- Total -->
        <div class="total-section">
          <span>Total Amount:</span>
          <span>ETB ${receiptData.total.toFixed(2)}</span>
        </div>
        
        <!-- Barcode (using JSBarcode like your sales page) -->
        <div class="barcode-section">
          <div class="barcode-container">
            <svg id="barcode" class="barcode"></svg>
          </div>
          <p class="barcode-text">${receiptData.orderId}</p>
        </div>
        
        <!-- Order Details -->
        <div class="order-details">
          <p class="details-title">Order Details</p>
          <p class="details-text">Date: ${receiptData.orderDate}</p>
          <p class="details-text">Time: ${receiptData.orderTime}</p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          🌿 Fresh • Organic • Healthy 🌿
        </div>
      </div>
      
      <script>
        // Generate barcode using JSBarcode (same as your sales page)
        JsBarcode("#barcode", "${receiptData.orderId}", {
          format: "CODE128",
          width: 1.5,
          height: 50,
          displayValue: false,
          background: "#ffffff",
          lineColor: "#000000"
        });
      </script>
    </body>
    </html>
  `;

  // Use puppeteer to render the HTML with the exact same barcode as sales page
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for barcode to be generated
    await page.waitForFunction(() => {
      const svg = document.querySelector('#barcode');
      return svg && svg.children && svg.children.length > 0;
    });

    // Take screenshot of the invoice
    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 680, // Match the content width
        height: 900 // Adjust height as needed
      }
    });

    return screenshot as Buffer;
  } finally {
    await browser.close();
  }
}

function generateBarcodeHTML(text: string): string {
  const cleanText = text.replace(/[^A-Z0-9]/g, '');
  const barcodeWidth = 280;
  const barcodeHeight = 50;
  
  const startPattern = [2, 1, 2, 3, 2, 1];
  const stopPattern = [2, 3, 3, 1, 1, 1, 2];
  const bars = [];
  
  let totalWidth = 0;
  startPattern.forEach(width => totalWidth += width);
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const charCode = char.charCodeAt(0);
    const pattern = [
      (charCode % 3) + 1,
      (charCode % 2) + 1,
      (charCode % 4) + 1,
      (charCode % 3) + 1,
      (charCode % 2) + 2,
      (charCode % 2) + 1
    ];
    pattern.forEach(width => totalWidth += width);
  }
  
  stopPattern.forEach(width => totalWidth += width);
  
  let x = (barcodeWidth - totalWidth) / 2;
  
  // Start pattern
  for (let i = 0; i < startPattern.length; i++) {
    const width = startPattern[i];
    const isBlack = i % 2 === 0;
    if (isBlack) {
      bars.push(`<rect x="${x}" y="5" width="${width}" height="${barcodeHeight - 10}" fill="#000000"></rect>`);
    }
    x += width;
  }
  
  // Data pattern
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const charCode = char.charCodeAt(0);
    const pattern = [
      (charCode % 3) + 1,
      (charCode % 2) + 1,
      (charCode % 4) + 1,
      (charCode % 3) + 1,
      (charCode % 2) + 2,
      (charCode % 2) + 1
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
  
  // Stop pattern
  for (let i = 0; i < stopPattern.length; i++) {
    const width = stopPattern[i];
    const isBlack = i % 2 === 0;
    if (isBlack) {
      bars.push(`<rect x="${x}" y="5" width="${width}" height="${barcodeHeight - 10}" fill="#000000"></rect>`);
    }
    x += width;
  }
  
  return `
    <svg width="${barcodeWidth}" height="${barcodeHeight}" style="background: white;">
      ${bars.join('')}
    </svg>
  `;
}

function generateBarcodePattern(text: string): { width: number; bars: Array<{ x: number; width: number }> } {
  const cleanText = text.replace(/[^A-Z0-9]/g, '');
  const startPattern = [2, 1, 2, 3, 2, 1];
  const stopPattern = [2, 3, 3, 1, 1, 1, 2];
  const bars: Array<{ x: number; width: number }> = [];
  
  let totalWidth = 0;
  startPattern.forEach(width => totalWidth += width);
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const charCode = char.charCodeAt(0);
    const pattern = [
      (charCode % 3) + 1,
      (charCode % 2) + 1,
      (charCode % 4) + 1,
      (charCode % 3) + 1,
      (charCode % 2) + 2,
      (charCode % 2) + 1
    ];
    pattern.forEach(width => totalWidth += width);
  }
  
  stopPattern.forEach(width => totalWidth += width);
  
  let x = 0;
  
  // Start pattern
  for (let i = 0; i < startPattern.length; i++) {
    const width = startPattern[i];
    const isBlack = i % 2 === 0;
    if (isBlack) {
      bars.push({ x, width });
    }
    x += width;
  }
  
  // Data pattern
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const charCode = char.charCodeAt(0);
    const pattern = [
      (charCode % 3) + 1,
      (charCode % 2) + 1,
      (charCode % 4) + 1,
      (charCode % 3) + 1,
      (charCode % 2) + 2,
      (charCode % 2) + 1
    ];
    
    for (let j = 0; j < pattern.length; j++) {
      const width = pattern[j];
      const isBlack = j % 2 === 0;
      if (isBlack) {
        bars.push({ x, width });
      }
      x += width;
    }
  }
  
  // Stop pattern
  for (let i = 0; i < stopPattern.length; i++) {
    const width = stopPattern[i];
    const isBlack = i % 2 === 0;
    if (isBlack) {
      bars.push({ x, width });
    }
    x += width;
  }
  
  return { width: totalWidth, bars };
}