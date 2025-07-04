import PizZip from 'pizzip';

export class DocumentProcessor {
  async detectPlaceholders(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const zip = new PizZip(arrayBuffer);
          
          const placeholders = new Set<string>();
          
          // Get all XML files that might contain placeholders
          const xmlFiles = this.getRelevantXmlFiles(zip);
          console.log('🔍 Checking XML files:', xmlFiles);
          
          xmlFiles.forEach(fileName => {
            const file = zip.file(fileName);
            if (file) {
              const content = file.asText();
              console.log(`\n=== 📄 Analyzing ${fileName} ===`);
              
              // Method 1: Clean text extraction (remove all XML tags first)
              const cleanText = this.extractCleanText(content);
              console.log('🧹 Clean text sample:', cleanText.substring(0, 500));
              
              // Method 2: Find placeholders in clean text
              const cleanMatches = cleanText.match(/\[([^\]]+)\]/g);
              if (cleanMatches) {
                console.log('✅ Clean text matches:', cleanMatches);
                cleanMatches.forEach(match => {
                  const placeholder = match.slice(1, -1).trim();
                  if (this.isValidPlaceholder(placeholder)) {
                    const normalized = this.normalizePlaceholder(placeholder);
                    placeholders.add(normalized);
                    console.log(`✅ Added from clean text: "${normalized}"`);
                  }
                });
              }
              
              // Method 3: Find fragmented placeholders in raw XML
              const fragmentedPlaceholders = this.findFragmentedPlaceholders(content);
              fragmentedPlaceholders.forEach(placeholder => {
                const normalized = this.normalizePlaceholder(placeholder);
                placeholders.add(normalized);
                console.log(`🔧 Added fragmented: "${normalized}"`);
              });
              
              // Method 4: Search for common bracket patterns even if split
              const bracketPatterns = this.findBracketPatterns(content);
              bracketPatterns.forEach(pattern => {
                if (this.isValidPlaceholder(pattern)) {
                  const normalized = this.normalizePlaceholder(pattern);
                  placeholders.add(normalized);
                  console.log(`🎯 Added pattern: "${normalized}"`);
                }
              });
              
              // Debug: Show raw content sample
              console.log('📋 Raw XML sample:', content.substring(0, 1000));
            }
          });
          
          const result = Array.from(placeholders).sort();
          console.log('\n🎉 === FINAL DETECTION RESULT ===');
          console.log('📋 All detected placeholders:', result);
          console.log(`📊 Total found: ${result.length}`);
          resolve(result);
        } catch (error) {
          console.error('❌ Error detecting placeholders:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private extractCleanText(xmlContent: string): string {
    // Remove all XML tags and get just the text content
    return xmlContent
      .replace(/<[^>]*>/g, '') // Remove all XML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private findFragmentedPlaceholders(xmlContent: string): string[] {
    const placeholders: string[] = [];
    
    // Look for opening bracket followed by text that might be split across XML tags
    const openBracketRegex = /\[([^<>\[\]]*(?:<[^>]*>[^<>\[\]]*)*)\]/g;
    let match;
    
    while ((match = openBracketRegex.exec(xmlContent)) !== null) {
      const rawContent = match[1];
      // Clean the content by removing XML tags
      const cleanContent = rawContent.replace(/<[^>]*>/g, '').trim();
      
      if (this.isValidPlaceholder(cleanContent)) {
        placeholders.push(cleanContent);
        console.log(`🔧 Found fragmented placeholder: "${cleanContent}" from raw: "${rawContent}"`);
      }
    }
    
    return placeholders;
  }

  private findBracketPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    // Find all potential bracket content, even if interrupted by XML
    const regex = /\[([^\]]*(?:<[^>]*>[^\]]*)*)\]/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const rawMatch = match[1];
      const cleaned = rawMatch.replace(/<[^>]*>/g, '').trim();
      
      if (cleaned && cleaned.length > 0) {
        patterns.push(cleaned);
      }
    }
    
    return patterns;
  }

  private isValidPlaceholder(text: string): boolean {
    // Must contain at least one letter and only valid characters
    return /^[A-ZÆØÅa-zæøå0-9_\s\-\.]+$/.test(text) && 
           /[A-ZÆØÅa-zæøå]/.test(text) && 
           text.length > 0 &&
           text.length < 100; // Reasonable length limit
  }

  private normalizePlaceholder(placeholder: string): string {
    return placeholder
      .replace(/\s+/g, '_')
      .replace(/[^\w\-\.]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase();
  }

  async processDocument(file: File, placeholders: Record<string, string>): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const zip = new PizZip(arrayBuffer);
          
          console.log('\n🚀 === STARTING DOCUMENT PROCESSING ===');
          console.log('📝 Placeholders to replace:', placeholders);
          
          const xmlFiles = this.getRelevantXmlFiles(zip);
          let totalReplacements = 0;
          
          xmlFiles.forEach(fileName => {
            const file = zip.file(fileName);
            if (file) {
              let content = file.asText();
              const originalContent = content;
              
              console.log(`\n--- 🔄 Processing ${fileName} ---`);
              
              // Strategy 1: Replace in clean text approach
              Object.entries(placeholders).forEach(([placeholder, value]) => {
                const escapedValue = this.escapeXml(value);
                
                // Try multiple variations of the placeholder
                const variations = [
                  `[${placeholder}]`,
                  `[${placeholder.toLowerCase()}]`,
                  `[${placeholder.replace(/_/g, ' ')}]`,
                  `[${placeholder.replace(/_/g, ' ').toLowerCase()}]`,
                  `[${placeholder.replace(/_/g, '-')}]`,
                  `[${placeholder.replace(/_/g, '.')}]`
                ];
                
                variations.forEach(variation => {
                  const beforeCount = this.countOccurrences(content, variation);
                  if (beforeCount > 0) {
                    content = this.replaceAll(content, variation, escapedValue);
                    totalReplacements += beforeCount;
                    console.log(`✅ Replaced ${beforeCount}x "${variation}" → "${value}"`);
                  }
                });
                
                // Strategy 2: Handle fragmented placeholders
                content = this.replaceFragmentedPlaceholders(content, placeholder, escapedValue);
              });
              
              // Update file if changed
              if (content !== originalContent) {
                zip.file(fileName, content);
                console.log(`💾 Updated ${fileName}`);
              } else {
                console.log(`⚪ No changes in ${fileName}`);
              }
            }
          });
          
          console.log(`\n🎯 === PROCESSING SUMMARY ===`);
          console.log(`📊 Total replacements: ${totalReplacements}`);
          
          if (totalReplacements === 0) {
            console.warn('⚠️ WARNING: No replacements made! Placeholders might be fragmented in XML.');
            
            // Debug: Show what we're looking for vs what's in the document
            console.log('🔍 Debug info:');
            Object.keys(placeholders).forEach(placeholder => {
              console.log(`Looking for: [${placeholder}]`);
            });
          }
          
          const output = zip.generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
          
          console.log('✅ Document generation completed');
          resolve(output);
          
        } catch (error) {
          console.error('❌ Processing error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private replaceFragmentedPlaceholders(content: string, placeholder: string, value: string): string {
    // Handle cases where [PLACEHOLDER] might be split across XML tags
    // This is a complex regex that tries to match fragmented placeholders
    
    const placeholderChars = placeholder.split('');
    let pattern = '\\[';
    
    placeholderChars.forEach(char => {
      // Allow XML tags between each character
      pattern += `(?:<[^>]*>)*${this.escapeRegex(char)}(?:<[^>]*>)*`;
    });
    
    pattern += '\\]';
    
    const regex = new RegExp(pattern, 'gi');
    const matches = content.match(regex);
    
    if (matches) {
      console.log(`🔧 Found fragmented matches for ${placeholder}:`, matches);
      matches.forEach(match => {
        content = content.replace(match, value);
      });
    }
    
    return content;
  }

  private getRelevantXmlFiles(zip: PizZip): string[] {
    const files: string[] = [];
    
    // Check all possible XML files
    const possibleFiles = [
      'word/document.xml',
      'word/header.xml',
      'word/footer.xml',
      'word/header1.xml',
      'word/footer1.xml',
      'word/header2.xml',
      'word/footer2.xml',
      'word/header3.xml',
      'word/footer3.xml',
      'word/comments.xml',
      'word/endnotes.xml',
      'word/footnotes.xml'
    ];
    
    possibleFiles.forEach(fileName => {
      if (zip.file(fileName)) {
        files.push(fileName);
      }
    });
    
    // Also check for numbered headers/footers
    for (let i = 1; i <= 20; i++) {
      [`word/header${i}.xml`, `word/footer${i}.xml`].forEach(fileName => {
        if (zip.file(fileName) && !files.includes(fileName)) {
          files.push(fileName);
        }
      });
    }
    
    console.log('📁 XML files to process:', files);
    return files;
  }

  private countOccurrences(text: string, searchString: string): number {
    return text.split(searchString).length - 1;
  }

  private replaceAll(text: string, searchString: string, replaceString: string): string {
    return text.split(searchString).join(replaceString);
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}