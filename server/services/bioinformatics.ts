export type BioFileType = 'fasta' | 'genbank' | 'pdb' | 'csv' | 'vcf' | 'gtf' | 'gff' | 'fastq' | 'txt' | 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'ppt' | 'rtf' | 'html' | 'htm' | 'md' | 'json' | 'xml' | 'yml' | 'yaml' | 'tsv' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'bmp' | 'svg' | 'mp3' | 'wav' | 'mp4' | 'avi' | 'zip' | 'rar' | 'exe' | 'bin';

export interface BioFileAnalysis {
  sequenceType: 'dna' | 'rna' | 'protein' | 'document' | 'data' | 'unknown';
  sequence: string;
  gcContent?: number;
  features?: string[];
  documentContent?: string;
  fileType: BioFileType;
  stats?: {
    length: number;
    composition: Record<string, number>;
    wordCount?: number;
    lineCount?: number;
  };
  metadata?: {
    fileSize: number;
    lastModified?: Date;
    encoding?: string;
    dimensions?: { width: number; height: number };
    duration?: number;
  };
}

// Universal file reader function
export async function readFileAsBase64(file: File): Promise<{ content: string; fileType: BioFileType }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.split(',')[1];
      const extension = file.name.split('.').pop()?.toLowerCase() as BioFileType;

      resolve({
        content: base64Content,
        fileType: extension
      });
    };

    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

// Enhanced file analysis with format detection and metadata extraction
export async function analyzeBioFile(content: string, fileType: BioFileType, originalFile?: File): Promise<BioFileAnalysis> {
  try {
    // Validate input
    if (!content) throw new Error('Empty file content');

    const binaryFormats: BioFileType[] = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'mp3', 'wav', 'mp4', 'avi', 'zip', 'rar', 'exe', 'bin'];
    const isBinary = binaryFormats.includes(fileType);
    let decodedContent = content;

    // For binary formats, content might already be binary or need decoding
    if (isBinary) {
      try {
        // Try to decode if it looks like base64
        if (content.match(/^[A-Za-z0-9+/=]+$/)) {
          decodedContent = atob(content);
        } else {
          // Content is already binary
          decodedContent = content;
        }
      } catch (error) {
        // If decoding fails, use content as-is
        decodedContent = content;
        console.warn(`Binary decode warning for ${fileType}:`, error);
      }
    }

    let sequence = '';
    let sequenceType: 'dna' | 'rna' | 'protein' | 'document' | 'data' | 'unknown' = 'unknown';
    const features: string[] = [];
    let documentContent = '';
    const metadata: any = {
      fileSize: content.length
    };

    // Add file metadata if available
    if (originalFile) {
      metadata.lastModified = new Date(originalFile.lastModified);
      metadata.encoding = 'UTF-8';
    }

    // Add specialized metadata for certain formats
    switch (fileType) {
      case 'jpg':
      case 'jpeg':
      case 'png':
        metadata.dimensions = extractImageDimensions(decodedContent);
        break;
      case 'mp3':
      case 'wav':
      case 'mp4':
      case 'avi':
        metadata.duration = extractMediaDuration(decodedContent);
        break;
    }

    // Content analysis logic
    switch (fileType) {
      case 'fasta':
        sequence = parseFastaSequence(decodedContent);
        sequenceType = determineSequenceType(sequence);
        documentContent = `FASTA file containing ${sequenceType} sequence(s). Length: ${sequence.length} characters.`;
        break;

      case 'genbank':
        const gbResult = parseGenBankFile(decodedContent);
        sequence = gbResult.sequence;
        sequenceType = gbResult.type;
        features.push(...gbResult.features);
        documentContent = `GenBank file with ${sequenceType} sequence and annotations: ${features.join(', ')}`;
        break;

      // ... (other cases remain similar with decodedContent)

      case 'pdf':
      case 'docx':
        sequenceType = 'document';
        documentContent = extractTextFromBinary(decodedContent, fileType);
        sequence = extractPotentialSequences(documentContent);
        features.push('binary_document');
        break;

      case 'txt':
      case 'md':
        sequence = extractPotentialSequences(decodedContent);
        if (sequence.length > 0) {
          sequenceType = determineSequenceType(sequence);
          documentContent = `Text file containing ${sequenceType} sequences and text content.`;
        } else {
          sequenceType = 'document';
          documentContent = decodedContent.substring(0, 2000);
        }
        break;

      case 'jpg':
      case 'png':
        sequenceType = 'data';
        documentContent = `Image file: ${fileType.toUpperCase()} format. Dimensions: ${metadata.dimensions?.width || 0}x${metadata.dimensions?.height || 0} pixels.`;
        features.push('image_file');
        break;

      // ... (other cases)

      default:
        sequenceType = 'data';
        documentContent = `File type: ${fileType}. ${isBinary ? 'Binary file' : 'Text content available'}.`;
    }

    // Stats calculation
    const stats = {
      length: sequence.length || decodedContent.length,
      composition: calculateComposition(sequence || decodedContent)
    };

    if (sequenceType === 'document' || sequenceType === 'data') {
      stats.wordCount = decodedContent.split(/\s+/).length;
      stats.lineCount = decodedContent.split('\n').length;
    }

    const analysis: BioFileAnalysis = {
      sequenceType,
      sequence: sequence.substring(0, 1000),
      fileType,
      stats,
      metadata
    };

    if (documentContent) {
      analysis.documentContent = documentContent.substring(0, 2000);
    }

    if (sequenceType === 'dna' || sequenceType === 'rna') {
      analysis.gcContent = calculateGCContent(sequence);
    }

    if (features.length > 0) {
      analysis.features = features;
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing bio file:', error);
    return {
      sequenceType: 'unknown',
      sequence: content.substring(0, 1000),
      fileType,
      stats: {
        length: content.length,
        composition: {}
      },
      metadata: {
        fileSize: content.length
      }
    };
  }
}

// Helper function to extract text from binary formats
function extractTextFromBinary(content: string, fileType: BioFileType): string {
  try {
    switch (fileType) {
      case 'pdf':
        return extractPdfText(content);
      case 'docx':
        return extractDocxText(content);
      default:
        return `Binary content (${Math.round(content.length / 1024)}KB) - No text extractor available`;
    }
  } catch (error) {
    return `Failed to extract text: ${(error as Error).message}`;
  }
}

// PDF text extraction (robust with multiple fallback methods)
function extractPdfText(pdfContent: string): string {
  try {
    const textChunks: string[] = [];
    
    // Method 1: Extract text from PDF text objects with improved regex
    const textObjectRegex = /\(([^)]*)\)\s*Tj/g;
    let match;
    while ((match = textObjectRegex.exec(pdfContent)) !== null) {
      const text = match[1].trim();
      if (text && text.length > 1) {
        // Decode common PDF text encodings
        const decodedText = text
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\(/g, '(')
          .replace(/\\)/g, ')')
          .replace(/\\\\/g, '\\');
        textChunks.push(decodedText);
      }
    }
    
    // Method 2: Enhanced BT/ET block extraction
    const btEtRegex = /BT\s*(.*?)\s*ET/gs;
    while ((match = btEtRegex.exec(pdfContent)) !== null) {
      const blockContent = match[1];
      
      // Extract text from various PDF text commands
      const textCommands = [
        /\(([^)]+)\)\s*Tj/g,
        /\[([^\]]+)\]\s*TJ/g,
        /'([^']+)'\s*Tj/g,
        /"([^"]+)"\s*Tj/g
      ];
      
      textCommands.forEach(regex => {
        let textMatch;
        while ((textMatch = regex.exec(blockContent)) !== null) {
          const text = textMatch[1].trim();
          if (text && text.length > 1) {
            textChunks.push(text.replace(/\\n/g, ' ').replace(/\s+/g, ' '));
          }
        }
      });
    }
    
    // Method 3: Extract from stream objects with better filtering
    if (textChunks.length < 5) {
      const streamRegex = /stream\s*(.*?)\s*endstream/gs;
      while ((match = streamRegex.exec(pdfContent)) !== null) {
        const streamContent = match[1];
        
        // Look for readable text patterns in streams
        const readableText = streamContent.match(/[A-Za-z][A-Za-z0-9\s.,!?;:'"()\-]{15,}/g) || [];
        readableText.forEach(text => {
          const cleanText = text.replace(/[^\x20-\x7E\s]/g, '').trim();
          if (cleanText.length > 10) {
            textChunks.push(cleanText);
          }
        });
      }
    }
    
    // Method 4: Extract from content streams with PDF operators
    if (textChunks.length < 3) {
      const contentStreamRegex = /\/Length\s+\d+[^>]*>>\s*stream\s*(.*?)\s*endstream/gs;
      while ((match = contentStreamRegex.exec(pdfContent)) !== null) {
        const streamData = match[1];
        
        // Look for text after text positioning operators
        const textAfterOperators = streamData.match(/[Tt][jdm]\s*([A-Za-z][^<>\[\](){}]{10,})/g) || [];
        textAfterOperators.forEach(text => {
          const cleanText = text.replace(/^[Tt][jdm]\s*/, '').trim();
          if (cleanText.length > 5) {
            textChunks.push(cleanText);
          }
        });
      }
    }
    
    // Method 5: Emergency extraction with improved patterns
    if (textChunks.length === 0) {
      const emergencyPatterns = [
        /\/Title\s*\(([^)]+)\)/g,
        /\/Subject\s*\(([^)]+)\)/g,
        /\/Author\s*\(([^)]+)\)/g,
        /[A-Za-z]{3,}(?:\s+[A-Za-z0-9.,!?;:'"()\-]{3,}){3,}/g
      ];
      
      emergencyPatterns.forEach(pattern => {
        let emergencyMatch;
        while ((emergencyMatch = pattern.exec(pdfContent)) !== null) {
          const text = emergencyMatch[1] || emergencyMatch[0];
          if (text && text.length > 5) {
            textChunks.push(text.trim());
          }
        }
      });
    }
    
    // Clean and join text chunks
    const extractedText = textChunks
      .filter(chunk => chunk && chunk.trim().length > 2)
      .map(chunk => chunk.replace(/\s+/g, ' ').trim())
      .join(' ')
      .substring(0, 5000);
      
    return extractedText || 'PDF document detected but text extraction requires specialized parsing tools for this specific format.';
    
  } catch (error) {
    return `PDF parsing failed: ${(error as Error).message}`;
  }
}

// DOCX text extraction (robust with multiple fallback methods)
function extractDocxText(docxContent: string): string {
  try {
    const textChunks: string[] = [];
    
    // Method 1: Enhanced text element extraction with better patterns
    const textElementRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
    let match;
    while ((match = textElementRegex.exec(docxContent)) !== null) {
      const text = match[1].trim();
      if (text && text.length > 0) {
        // Decode XML entities
        const decodedText = text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        textChunks.push(decodedText);
      }
    }
    
    // Method 2: Extract from paragraph runs with better structure preservation
    if (textChunks.length < 10) {
      const runRegex = /<w:r[^>]*>(.*?)<\/w:r>/gs;
      while ((match = runRegex.exec(docxContent)) !== null) {
        const runContent = match[1];
        const textInRun = runContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
        textInRun.forEach(t => {
          const textMatch = t.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
          if (textMatch && textMatch[1].trim()) {
            textChunks.push(textMatch[1].trim());
          }
        });
      }
    }
    
    // Method 3: Enhanced paragraph extraction
    if (textChunks.length < 5) {
      const paragraphRegex = /<w:p[^>]*>(.*?)<\/w:p>/gs;
      while ((match = paragraphRegex.exec(docxContent)) !== null) {
        const paraContent = match[1];
        
        // Extract all text content from paragraph, preserving structure
        const allTextInPara = paraContent.match(/>([^<]+)</g) || [];
        const paraText = allTextInPara
          .map(t => t.slice(1, -1).trim())
          .filter(t => t.length > 0 && !/^[0-9\s]*$/.test(t))
          .join(' ');
          
        if (paraText && paraText.length > 3) {
          textChunks.push(paraText);
        }
      }
    }
    
    // Method 4: Extract from document body with improved parsing
    if (textChunks.length < 3) {
      const bodyRegex = /<w:body[^>]*>(.*?)<\/w:body>/gs;
      const bodyMatch = bodyRegex.exec(docxContent);
      if (bodyMatch) {
        const bodyContent = bodyMatch[1];
        
        // Look for any text content within the body
        const allText = bodyContent.match(/>[^<>{}\[\]()]{3,}</g) || [];
        allText.forEach(text => {
          const cleanText = text.slice(1).trim();
          if (cleanText.length > 2 && /[A-Za-z]/.test(cleanText)) {
            textChunks.push(cleanText);
          }
        });
      }
    }
    
    // Method 5: Extract from document properties and metadata
    if (textChunks.length < 2) {
      const titleRegex = /<dc:title>([^<]+)<\/dc:title>/g;
      const subjectRegex = /<dc:subject>([^<]+)<\/dc:subject>/g;
      const descriptionRegex = /<dc:description>([^<]+)<\/dc:description>/g;
      
      [titleRegex, subjectRegex, descriptionRegex].forEach(regex => {
        let metaMatch;
        while ((metaMatch = regex.exec(docxContent)) !== null) {
          if (metaMatch[1].trim()) {
            textChunks.push(`Metadata: ${metaMatch[1].trim()}`);
          }
        }
      });
    }
    
    // Method 6: Emergency extraction with broader patterns
    if (textChunks.length === 0) {
      // Look for any readable text patterns
      const emergencyPatterns = [
        /[A-Za-z]{3,}(?:\s+[A-Za-z0-9.,!?;:'"()\-]{2,}){4,}/g,
        /\b[A-Z][a-z]+(?:\s+[A-Za-z]+){3,}/g,
        /(?:Dear|To|From|Subject|Date|Re:)[^<>]{5,}/gi
      ];
      
      emergencyPatterns.forEach(pattern => {
        const matches = docxContent.match(pattern) || [];
        matches.slice(0, 10).forEach(match => {
          const cleanMatch = match.replace(/[<>{}[\]]/g, '').trim();
          if (cleanMatch.length > 5) {
            textChunks.push(cleanMatch);
          }
        });
      });
    }
    
    // Method 7: Final fallback with document structure analysis
    if (textChunks.length === 0) {
      const hasWordStructure = docxContent.includes('<w:document') || docxContent.includes('word/document');
      const hasTextElements = docxContent.includes('<w:t>') || docxContent.includes('w:t ');
      
      if (hasWordStructure && hasTextElements) {
        textChunks.push('Word document structure detected with text content. The document appears to contain formatted text that may require specialized parsing to extract fully.');
      } else {
        textChunks.push('DOCX document detected but content extraction requires enhanced parsing capabilities for this specific document format.');
      }
    }
    
    // Clean and join text chunks with better formatting
    const extractedText = textChunks
      .filter(chunk => chunk && chunk.trim().length > 1)
      .map(chunk => chunk.replace(/\s+/g, ' ').trim())
      .join('\n')
      .substring(0, 5000);
      
    return extractedText || 'DOCX document structure detected but text content requires specialized extraction.';
    
  } catch (error) {
    return `DOCX parsing failed: ${(error as Error).message}`;
  }
}

// Image dimension extraction
function extractImageDimensions(imageData: string): { width: number; height: number } {
  // Simplified implementation - real implementation would parse binary headers
  return {
    width: 0,
    height: 0
  };
}

// Media duration extraction
function extractMediaDuration(mediaData: string): number {
  // Simplified implementation
  return 0;
}

// Extract potential biological sequences from text
function extractPotentialSequences(content: string): string {
  // Look for DNA/RNA/protein-like sequences
  const sequences = content.match(/[ATCGNRYSWKMBDHV]{10,}/gi) || [];
  return sequences.join('');
}

// Determine sequence type based on content
function determineSequenceType(sequence: string): 'dna' | 'rna' | 'protein' | 'unknown' {
  const cleanSeq = sequence.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (cleanSeq.length === 0) return 'unknown';
  
  const isDNA = /^[ATCGN]+$/.test(cleanSeq);
  const isRNA = /^[AUCGN]+$/.test(cleanSeq);
  const isProtein = /^[ACDEFGHIKLMNPQRSTVWY]+$/.test(cleanSeq);

  if (isDNA) return 'dna';
  if (isRNA) return 'rna';
  if (isProtein) return 'protein';
  return 'unknown';
}

// Calculate GC content for DNA/RNA sequences
function calculateGCContent(sequence: string): number {
  const cleanSeq = sequence.replace(/[^ATCGU]/gi, '');
  if (cleanSeq.length === 0) return 0;
  
  const gcCount = (cleanSeq.match(/[GC]/gi) || []).length;
  return (gcCount / cleanSeq.length) * 100;
}

// Calculate sequence composition
function calculateComposition(sequence: string): Record<string, number> {
  const composition: Record<string, number> = {};
  for (const char of sequence.toUpperCase()) {
    composition[char] = (composition[char] || 0) + 1;
  }
  return composition;
}

// Parse FASTA sequence
function parseFastaSequence(content: string): string {
  const lines = content.split('\n');
  const sequenceLines = lines.filter(line => !line.startsWith('>') && line.trim());
  return sequenceLines.join('').replace(/\s/g, '');
}

// Parse GenBank file
function parseGenBankFile(content: string): { sequence: string; type: 'dna' | 'rna' | 'protein' | 'unknown'; features: string[] } {
  const lines = content.split('\n');
  const features: string[] = [];
  let sequence = '';
  let inOrigin = false;

  for (const line of lines) {
    if (line.startsWith('FEATURES')) {
      // Extract feature information
      const featureMatch = line.match(/\s+(\w+)\s+/);
      if (featureMatch) features.push(featureMatch[1]);
    } else if (line.startsWith('ORIGIN')) {
      inOrigin = true;
    } else if (inOrigin && line.match(/^\s*\d+/)) {
      // Extract sequence from numbered lines
      const seqMatch = line.replace(/^\s*\d+\s*/, '').replace(/\s/g, '');
      sequence += seqMatch;
    }
  }

  return {
    sequence,
    type: determineSequenceType(sequence),
    features
  };
}