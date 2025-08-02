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
      case 'xlsx':
      case 'xls':
        sequenceType = 'document';
        documentContent = await extractTextFromBinary(decodedContent, fileType, originalFile);
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
async function extractTextFromBinary(content: string, fileType: BioFileType, originalFile?: File): Promise<string> {
  try {
    if (!originalFile) {
      return `Binary content (${Math.round(content.length / 1024)}KB) - File object required for parsing`;
    }

    switch (fileType) {
      case 'pdf':
        return await extractPdfTextProper(originalFile);
      case 'docx':
        return await extractDocxTextProper(originalFile);
      case 'xlsx':
      case 'xls':
        return await extractXlsxTextProper(originalFile);
      default:
        return `Binary content (${Math.round(content.length / 1024)}KB) - No text extractor available`;
    }
  } catch (error) {
    return `Failed to extract text: ${(error as Error).message}`;
  }
}



// Proper PDF text extraction using PDF.js
async function extractPdfTextProper(file: File): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim() || 'PDF document processed but no readable text found';
  } catch (error) {
    return `PDF parsing failed: ${(error as Error).message}`;
  }
}

// Proper DOCX text extraction using Mammoth.js
async function extractDocxTextProper(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim() || 'DOCX document processed but no readable text found';
  } catch (error) {
    return `DOCX parsing failed: ${(error as Error).message}`;
  }
}

// Proper XLSX text extraction using SheetJS
async function extractXlsxTextProper(file: File): Promise<string> {
  try {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    
    let allText = '';
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      allText += `Sheet: ${sheetName}\n${csv}\n\n`;
    });
    
    return allText.trim() || 'Excel document processed but no readable content found';
  } catch (error) {
    return `Excel parsing failed: ${(error as Error).message}`;
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