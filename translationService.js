/**
 * Translation Service for Enhanced Chat System
 *
 * Handles real-time translation of messages using Google Cloud Translation API
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
// Import DOMParser polyfill for Node
import { JSDOM } from 'jsdom';

dotenv.config();

const { DOMParser, Node } = new JSDOM().window;

// For production, use the actual Google Cloud Translation API
// For development, we'll use a more accessible API (LibreTranslate)
const TRANSLATION_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://translation.googleapis.com/language/translate/v2'
  : 'https://libretranslate.de/translate';

const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

/**
 * Detect the language of a text
 * @param {string} text - The text to detect
 * @returns {Promise<string>} - The detected language code
 */
export const detectLanguage = async (text) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Google Cloud Translation API
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text
          })
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('Language detection error:', data.error);
        throw new Error(data.error.message || 'Failed to detect language');
      }

      return data.data.detections[0][0].language;
    } else {
      // LibreTranslate API
      const response = await fetch('https://libretranslate.de/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to detect language');
      }

      // Return the most confident detection
      return data[0]?.language || 'en';
    }
  } catch (error) {
    console.error('Language detection error:', error);
    // Default to English if detection fails
    return 'en';
  }
};

/**
 * Extract text content from HTML
 * @param {string} html - The HTML content
 * @returns {string} - The extracted text
 */
export const extractTextFromHtml = (html) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch (error) {
    console.error('HTML parsing error:', error);
    // Fallback: crude HTML tag removal
    return html.replace(/<[^>]*>/g, '');
  }
};

/**
 * Translate HTML content while preserving structure
 * @param {string} html - The HTML content to translate
 * @param {string} targetLanguage - The target language code
 * @param {string} sourceLanguage - Optional source language code
 * @returns {Promise<Object>} - The translation result
 */
export const translateHtml = async (html, targetLanguage, sourceLanguage = null) => {
  try {
    // If empty or not HTML, just use regular translation
    if (!html || !html.trim() || !html.includes('<')) {
      return translateText(html, targetLanguage, sourceLanguage);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Process each text node separately to maintain HTML structure
    const textNodes = [];
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim()) {
        textNodes.push(node);
      }
    }

    // Extract text for translation
    const textsToTranslate = textNodes.map(node => node.textContent.trim()).filter(text => text);

    // Skip if no text to translate
    if (textsToTranslate.length === 0) {
      return {
        translatedText: html,
        detectedSourceLanguage: sourceLanguage || 'en',
        originalText: html
      };
    }

    // Detect source language from the combined text if not provided
    const detectedSource = sourceLanguage ||
      await detectLanguage(textsToTranslate.join(' '));

    // Don't translate if source and target are the same
    if (detectedSource === targetLanguage) {
      return {
        translatedText: html,
        detectedSourceLanguage: detectedSource,
        originalText: html
      };
    }

    // Translate all text parts
    const translations = await Promise.all(
      textsToTranslate.map(text =>
        translateText(text, targetLanguage, detectedSource)
      )
    );

    // Replace text nodes with translations
    for (let i = 0; i < textNodes.length; i++) {
      if (translations[i] && translations[i].translatedText) {
        textNodes[i].textContent = translations[i].translatedText;
      }
    }

    // Return translated HTML
    return {
      translatedText: doc.body.innerHTML,
      detectedSourceLanguage: detectedSource,
      originalText: html
    };
  } catch (error) {
    console.error('HTML translation error:', error);
    return {
      translatedText: html,
      detectedSourceLanguage: sourceLanguage || 'en',
      originalText: html,
      error: error.message
    };
  }
};

/**
 * Translate text to a target language
 * @param {string} text - The text to translate
 * @param {string} targetLanguage - The target language code (e.g., 'es', 'fr')
 * @param {string} sourceLanguage - Optional source language code
 * @returns {Promise<Object>} - The translation result
 */
export const translateText = async (text, targetLanguage, sourceLanguage = null) => {
  try {
    // Don't translate empty text
    if (!text || !text.trim()) {
      return {
        translatedText: text,
        detectedSourceLanguage: sourceLanguage || 'en',
        originalText: text
      };
    }

    // Detect source language if not provided
    const source = sourceLanguage || await detectLanguage(text);

    // Don't translate if source and target are the same
    if (source === targetLanguage) {
      return {
        translatedText: text,
        detectedSourceLanguage: source,
        originalText: text
      };
    }

    if (process.env.NODE_ENV === 'production') {
      // Google Cloud Translation API
      const response = await fetch(
        `${TRANSLATION_API_URL}?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            target: targetLanguage,
            source: sourceLanguage || undefined,
            format: 'text'
          })
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('Translation error:', data.error);
        throw new Error(data.error.message || 'Failed to translate text');
      }

      return {
        translatedText: data.data.translations[0].translatedText,
        detectedSourceLanguage: data.data.translations[0].detectedSourceLanguage || source,
        originalText: text
      };
    } else {
      // LibreTranslate API
      const response = await fetch(TRANSLATION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage || source,
          target: targetLanguage,
          format: 'text'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to translate text');
      }

      return {
        translatedText: data.translatedText,
        detectedSourceLanguage: source,
        originalText: text
      };
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return {
      translatedText: text,
      detectedSourceLanguage: sourceLanguage || 'en',
      originalText: text,
      error: error.message
    };
  }
};

/**
 * Translate a message, handling both plain text and HTML content
 * @param {Object} message - The message object to translate
 * @param {string} targetLanguage - The target language code
 * @returns {Promise<Object>} - The message with translation
 */
export const translateMessage = async (message, targetLanguage) => {
  try {
    if (!message || !targetLanguage) {
      return message;
    }

    // Determine if we need to translate HTML or plain text
    if (message.richContent) {
      // Translate the rich content (HTML)
      const richTranslation = await translateHtml(message.richContent, targetLanguage);
      // Also translate the plain text version
      const plainTranslation = await translateText(message.content, targetLanguage,
        richTranslation.detectedSourceLanguage);

      return {
        ...message,
        translation: {
          plainText: plainTranslation.translatedText,
          richText: richTranslation.translatedText,
          detectedSourceLanguage: richTranslation.detectedSourceLanguage
        }
      };
    } else {
      // Just translate the plain text
      const translation = await translateText(message.content, targetLanguage);

      return {
        ...message,
        translation: {
          plainText: translation.translatedText,
          detectedSourceLanguage: translation.detectedSourceLanguage
        }
      };
    }
  } catch (error) {
    console.error('Message translation error:', error);
    return message;
  }
};

/**
 * Get a list of supported languages
 * @returns {Promise<Array>} - List of supported languages
 */
export const getSupportedLanguages = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Google Cloud Translation API
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/languages?key=${GOOGLE_API_KEY}&target=en`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('Language list error:', data.error);
        throw new Error(data.error.message || 'Failed to get supported languages');
      }

      return data.data.languages;
    } else {
      // LibreTranslate API
      const response = await fetch('https://libretranslate.de/languages', {
        method: 'GET'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to get supported languages');
      }

      return data;
    }
  } catch (error) {
    console.error('Language list error:', error);
    // Return a minimal set of common languages if API fails
    return [
      { language: 'en', name: 'English' },
      { language: 'es', name: 'Spanish' },
      { language: 'fr', name: 'French' },
      { language: 'de', name: 'German' },
      { language: 'it', name: 'Italian' },
      { language: 'pt', name: 'Portuguese' },
      { language: 'ru', name: 'Russian' },
      { language: 'zh', name: 'Chinese' },
      { language: 'ja', name: 'Japanese' },
      { language: 'ko', name: 'Korean' },
      { language: 'ar', name: 'Arabic' }
    ];
  }
};

export default {
  detectLanguage,
  translateText,
  translateHtml,
  translateMessage,
  getSupportedLanguages
};
