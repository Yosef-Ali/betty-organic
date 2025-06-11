/**
 * Amharic Text Processing Utilities
 * Handles Ge'ez script text normalization and validation
 */

// Ge'ez Unicode ranges
const GEEZ_UNICODE_RANGES = [
  [0x1200, 0x137F], // Ethiopic
  [0x1380, 0x139F], // Ethiopic Supplement
  [0x2D80, 0x2DDF], // Ethiopic Extended
  [0xAB00, 0xAB2F], // Ethiopic Extended-A
];

// Common Amharic punctuation and numbers
const AMHARIC_PUNCTUATION = [
  '፡', '።', '፣', '፤', '፥', '፦', '፧', '፨'
];

const AMHARIC_NUMBERS = [
  '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱', '፲'
];

/**
 * Check if a character is in the Ge'ez script range
 */
export function isGeezCharacter(char: string): boolean {
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;

  return GEEZ_UNICODE_RANGES.some(([start, end]) => 
    codePoint >= start && codePoint <= end
  );
}

/**
 * Check if text contains Amharic characters
 */
export function containsAmharic(text: string): boolean {
  return Array.from(text).some(char => isGeezCharacter(char));
}

/**
 * Calculate the percentage of Amharic characters in text
 */
export function getAmharicPercentage(text: string): number {
  const chars = Array.from(text.replace(/\s/g, ''));
  if (chars.length === 0) return 0;

  const amharicChars = chars.filter(char => isGeezCharacter(char));
  return (amharicChars.length / chars.length) * 100;
}

/**
 * Detect if text is primarily Amharic (>50% Ge'ez characters)
 */
export function isPrimarilyAmharic(text: string): boolean {
  return getAmharicPercentage(text) > 50;
}

/**
 * Normalize Amharic text for better processing
 */
export function normalizeAmharicText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Normalize common punctuation variations
    .replace(/\.\.\./g, '...')
    .replace(/፡፡/g, '፡')
    // Remove extra spaces around punctuation
    .replace(/\s*([፡።፣፤፥፦፧፨])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert Amharic numbers to Arabic numerals
 */
export function convertAmharicNumbers(text: string): string {
  const amharicToArabic: { [key: string]: string } = {
    '፩': '1', '፪': '2', '፫': '3', '፬': '4', '፭': '5',
    '፮': '6', '፯': '7', '፰': '8', '፱': '9', '፲': '10'
  };

  let result = text;
  Object.entries(amharicToArabic).forEach(([amharic, arabic]) => {
    result = result.replace(new RegExp(amharic, 'g'), arabic);
  });

  return result;
}

/**
 * Extract Amharic words from mixed-language text
 */
export function extractAmharicWords(text: string): string[] {
  const words = text.split(/\s+/);
  return words.filter(word => containsAmharic(word));
}

/**
 * Validate if text is properly formatted Amharic
 */
export function validateAmharicText(text: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for mixed scripts in words
  const words = text.split(/\s+/);
  words.forEach((word, index) => {
    const hasAmharic = containsAmharic(word);
    const hasLatin = /[a-zA-Z]/.test(word);
    
    if (hasAmharic && hasLatin) {
      issues.push(`Mixed script in word ${index + 1}: "${word}"`);
      suggestions.push('Separate Amharic and Latin text into different sections');
    }
  });

  // Check for proper sentence structure
  if (containsAmharic(text) && !text.includes('።') && text.length > 50) {
    issues.push('Long Amharic text without proper sentence endings');
    suggestions.push('Add proper Amharic punctuation (።) for sentence endings');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Format text for better Amharic display
 */
export function formatAmharicDisplay(text: string): string {
  return normalizeAmharicText(text)
    // Ensure proper spacing after punctuation
    .replace(/([፡።፣፤፥፦፧፨])([^\s])/g, '$1 $2')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate metadata about Amharic text
 */
export function analyzeAmharicText(text: string) {
  const amharicPercentage = getAmharicPercentage(text);
  const amharicWords = extractAmharicWords(text);
  const validation = validateAmharicText(text);
  
  return {
    isAmharic: isPrimarilyAmharic(text),
    amharicPercentage: Math.round(amharicPercentage * 100) / 100,
    wordCount: text.split(/\s+/).length,
    amharicWordCount: amharicWords.length,
    characterCount: text.length,
    amharicCharacterCount: Array.from(text).filter(char => isGeezCharacter(char)).length,
    validation,
    language: amharicPercentage > 70 ? 'amharic' : 
             amharicPercentage > 30 ? 'mixed' : 'other'
  };
}

/**
 * Common Amharic phrases for testing OCR accuracy
 */
export const AMHARIC_TEST_PHRASES = [
  'ሰላም ነው',
  'እንዴት ነህ',
  'ጤና ይስጥልኝ',
  'በጣም ጥሩ ነው',
  'አመሰግናለሁ',
  'እንኳን ደስ አለ',
  'ትምህርት ቤት',
  'ሆስፒታል',
  'መንግስት',
  'ዩኒቨርሲቲ'
];

/**
 * Font families that support Amharic/Ge'ez script
 */
export const AMHARIC_FONT_FAMILIES = [
  'Noto Sans Ethiopic',
  'Abyssinica SIL',
  'Nyala',
  'PowerGeez',
  'Visual Geez Unicode',
  'serif' // fallback
].join(', ');