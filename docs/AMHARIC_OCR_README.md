# 🔤 Amharic Multimodal OCR Chatbot

A Next.js implementation of the Mistral OCR + Gemma 3 architecture, specifically optimized for Amharic (አማርኛ) document processing and analysis.

## ✨ Features

### 🧠 AI-Powered OCR
- **Mistral OCR Integration**: Advanced optical character recognition
- **Ge'ez Script Support**: Optimized for Ethiopian script (U+1200-U+137F)
- **High Accuracy**: Specialized for Amharic fonts (PowerGeez, Abyssinica SIL)
- **Multi-format Support**: PDF, JPEG, PNG files

### 💬 Intelligent Chat
- **Google Gemini Integration**: State-of-the-art language model
- **Bilingual Support**: Chat in Amharic or English
- **Context Awareness**: Understands document content
- **Real-time Responses**: Fast, accurate answers

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Progress Tracking**: Real-time OCR processing updates
- **Text Analysis**: Automatic language detection and validation
- **Font Optimization**: Proper Amharic font rendering

## 🚀 Quick Start

### 1. Access the Feature
```bash
# Start the development server
npm run dev

# Navigate to the Amharic OCR page
http://localhost:3000/amharic-ocr
```

### 2. Configure API Keys
```env
# Add to your .env.local file
MISTRAL_API_KEY=your_mistral_api_key_here
GOOGLE_API_KEY=your_google_gemini_key_here
```

### 3. Upload and Process
1. Upload an Amharic document (PDF/Image)
2. Process with Mistral OCR
3. View extracted text and analysis
4. Chat with your document using AI

## 📋 Requirements

### API Keys Needed
- **Mistral AI**: Get from [console.mistral.ai](https://console.mistral.ai)
- **Google Gemini**: Get from [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Supported Files
- **PDF**: Multi-page documents (max 10MB)
- **JPEG/PNG**: High-resolution images (max 10MB)
- **Languages**: Amharic, English, mixed content

## 🛠 Technical Implementation

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Upload   │───▶│   Mistral OCR   │───▶│ Text Processing │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌───────▼─────────┐
│ Chat Interface  │◀───│  Google Gemini  │◀───│ Structured Data │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components
- `AmharicFileUpload`: Drag-and-drop file upload with validation
- `AmharicTextDisplay`: Renders Ge'ez script with proper fonts
- `text-processor`: Utilities for Amharic text analysis
- API routes: `/api/amharic-ocr/process` and `/api/amharic-ocr/chat`

## 🔍 Text Processing Features

### Language Detection
```typescript
const analysis = analyzeAmharicText(text);
// Returns: percentage, language, validation, etc.
```

### Character Recognition
- Ge'ez Unicode range detection (ሀ-፼)
- Font compatibility checking
- Mixed script handling
- Punctuation normalization

### Validation
- Text structure analysis
- Common error detection
- Formatting suggestions
- Quality metrics

## 🎯 Usage Examples

### Sample Amharic Questions
```
ይህ ሰነድ ስለ ምን ነው?
(What is this document about?)

ዋና ዋና ነጥቦቹ ምንድን ናቸው?
(What are the main points?)

በዚህ ሰነድ ውስጥ ምን አይነት መረጃ አለ?
(What information is in this document?)
```

### Sample English Questions
```
What is the main topic of this document?
Summarize the key points
What are the important details mentioned?
```

## 🚨 Troubleshooting

### Common Issues

**Poor OCR Results**
- Use high-resolution images (300+ DPI)
- Ensure good lighting and contrast
- Use standard Amharic fonts
- Avoid rotated or skewed text

**API Errors**
- Verify API keys are correct
- Check internet connection
- Monitor API usage limits
- Validate file formats

**Font Display Issues**
- Ensure Amharic fonts are loaded
- Check browser font support
- Clear browser cache
- Update browser if needed

## 🔧 Development

### Running Tests
```bash
# Run the Amharic OCR test suite
npx tsx scripts/test-amharic-ocr.ts
```

### Adding Features
1. Extend `text-processor.ts` for new text analysis features
2. Modify API routes for additional OCR providers
3. Update UI components for new functionality
4. Add tests for new features

## 📊 Performance

### Optimization Features
- Progressive file upload
- Lazy component loading
- Efficient font loading
- Memory management for large files

### Benchmarks
- OCR Processing: ~2-5 seconds per page
- Chat Response: ~1-3 seconds
- File Upload: Instant for files <5MB
- Text Analysis: <1 second

## 🌍 Localization

### Supported Languages
- **Amharic (አማርኛ)**: Primary focus
- **English**: Secondary support
- **Mixed Content**: Automatic detection

### Cultural Considerations
- Ethiopian document formats
- Religious and cultural text recognition
- Government document processing
- Educational material support

## 🔒 Security & Privacy

### Data Protection
- Temporary file cleanup
- No persistent storage
- API key encryption
- Secure file handling

### Privacy Features
- Local processing where possible
- No document retention
- Encrypted API communications
- User data anonymization

## 📈 Future Enhancements

### Planned Features
- [ ] Batch document processing
- [ ] Advanced table extraction
- [ ] Handwritten text recognition
- [ ] Document template recognition
- [ ] Export to multiple formats

### Technical Roadmap
- [ ] Offline OCR capabilities
- [ ] Mobile app development
- [ ] API optimization
- [ ] Advanced analytics
- [ ] Multi-user collaboration

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Component-based architecture

## 📚 Resources

### Documentation
- [Quick Start Guide](docs/QUICK_START_GUIDE.md)
- [Implementation Details](docs/AMHARIC_OCR_IMPLEMENTATION.md)
- [API Documentation](docs/API.md)

### External Resources
- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Google Gemini API](https://ai.google.dev/)
- [Unicode Ethiopic](https://unicode.org/charts/PDF/U1200.pdf)
- [Ge'ez Script Reference](https://en.wikipedia.org/wiki/Ge%CA%BDez_script)

---

**Built with ❤️ for the Ethiopian developer community**

This implementation brings advanced AI-powered document processing to Amharic text, making it easier to digitize and interact with Ethiopian documents using cutting-edge technology.