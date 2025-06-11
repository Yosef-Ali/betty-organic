# Quick Start Guide: Amharic OCR Chatbot

## 🚀 Getting Started

### 1. Access the Application
Navigate to: `http://localhost:3000/amharic-ocr`

### 2. Configure API Keys
1. Click on the **Settings** tab
2. Add your **Mistral AI API Key** (for OCR processing)
3. Add your **Google Gemini API Key** (for chat functionality)

### 3. Upload a Document
1. Go to the **Upload** tab
2. Drag and drop or click to select an Amharic document (PDF/Image)
3. Click **"Process with Mistral OCR"**

### 4. View Results
1. Check the **Results** tab to see extracted text
2. Review the text analysis and language detection
3. Examine the structured markdown output

### 5. Chat with Your Document
1. Switch to the **Chat** tab
2. Ask questions in Amharic or English
3. Get AI-powered responses based on your document

## 📋 API Key Setup

### Mistral AI API Key
1. Visit [console.mistral.ai](https://console.mistral.ai)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into the Settings tab

### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Paste into the Settings tab

## 🧪 Test Examples

### Sample Questions (Amharic)
- `ይህ ሰነድ ስለ ምን ነው?` (What is this document about?)
- `ዋና ዋና ነጥቦቹ ምንድን ናቸው?` (What are the main points?)
- `በዚህ ሰነድ ውስጥ ምን አይነት መረጃ አለ?` (What information is in this document?)

### Sample Questions (English)
- "What is the main topic of this document?"
- "Summarize the key points"
- "What are the important details mentioned?"

## 📁 Supported File Types

### Documents
- **PDF**: Multi-page documents ✅
- **JPEG**: High-resolution images ✅
- **PNG**: Clear text images ✅

### Optimal Conditions
- Clear, high-contrast text
- Proper lighting in photos
- Standard Amharic fonts (PowerGeez, Abyssinica SIL)
- Single-column layout preferred

## 🔧 Troubleshooting

### Common Issues

#### "Invalid API Key" Error
- Verify your API keys are correct
- Check for extra spaces or characters
- Ensure you have proper API permissions

#### "File Upload Failed"
- Check file size (max 10MB)
- Ensure file format is supported
- Try refreshing the page

#### "Poor OCR Results"
- Use higher resolution images
- Ensure good lighting and contrast
- Avoid skewed or rotated text
- Use standard Amharic fonts

#### "Chat Not Working"
- Make sure OCR processing completed successfully
- Verify Gemini API key is configured
- Check your internet connection

### Performance Tips
1. **File Size**: Keep files under 5MB for faster processing
2. **Image Quality**: Use 300+ DPI for best OCR results
3. **Font Clarity**: PowerGeez and Abyssinica fonts work best
4. **Layout**: Single-column text processes more accurately

## 🎯 Best Practices

### For OCR Accuracy
1. Use clear, well-lit document photos
2. Ensure text is straight (not rotated)
3. Use standard Amharic fonts when possible
4. Avoid decorative or stylized fonts
5. Process one page at a time for complex documents

### For Chat Effectiveness
1. Ask specific questions about document content
2. Use proper Amharic or English grammar
3. Reference specific sections when needed
4. Build on previous questions in conversation

### For Performance
1. Process smaller files first
2. Use Wi-Fi for large file uploads
3. Keep only necessary browser tabs open
4. Clear browser cache if experiencing issues

## 📞 Support

### Getting Help
1. Check the console for error messages (F12)
2. Verify all API keys are properly configured
3. Try with a different document
4. Refresh the browser and try again

### Feature Requests
This implementation is designed to be extensible. Common enhancement requests include:
- Additional language support
- Batch file processing
- Export to different formats
- Advanced text analysis features

---

**Ready to get started?** Open your browser and navigate to `/amharic-ocr` to begin processing your Amharic documents!