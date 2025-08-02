
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
}

// Enhanced file analysis function with better content extraction
export async function analyzeBioFile(content: string, fileType: BioFileType): Promise<BioFileAnalysis> {
  try {
    let sequence = '';
    let sequenceType: 'dna' | 'rna' | 'protein' | 'document' | 'data' | 'unknown' = 'unknown';
    const features: string[] = [];
    let documentContent = '';

    // First, try to extract meaningful text content for all file types
    const extractedContent = await extractTextContent(content, fileType);

    switch (fileType) {
      case 'fasta':
        sequence = parseFastaSequence(content);
        sequenceType = determineSequenceType(sequence);
        documentContent = `FASTA file containing ${sequenceType} sequence(s). Length: ${sequence.length} characters.`;
        break;

      case 'genbank':
        const gbResult = parseGenBankFile(content);
        sequence = gbResult.sequence;
        sequenceType = gbResult.type;
        features.push(...gbResult.features);
        documentContent = `GenBank file with ${sequenceType} sequence and annotations: ${features.join(', ')}`;
        break;

      case 'pdb':
        const pdbResult = parsePDBFile(content);
        sequence = pdbResult.sequence;
        sequenceType = 'protein';
        features.push(...pdbResult.features);
        documentContent = `PDB protein structure file with features: ${features.join(', ')}`;
        break;

      case 'fastq':
        const fastqResult = parseFastqFile(content);
        sequence = fastqResult.sequence;
        sequenceType = determineSequenceType(sequence);
        features.push(...fastqResult.features);
        documentContent = `FASTQ sequencing data with quality scores. Sequence type: ${sequenceType}`;
        break;

      case 'vcf':
        sequenceType = 'data';
        documentContent = extractedContent || content.substring(0, 2000);
        features.push('variant_data');
        break;

      case 'gtf':
      case 'gff':
        sequenceType = 'data';
        documentContent = extractedContent || content.substring(0, 2000);
        features.push('annotation_data');
        break;

      case 'csv':
        sequenceType = 'data';
        documentContent = analyzeCSVContent(content);
        features.push('tabular_data');
        break;

      case 'json':
        sequenceType = 'data';
        documentContent = analyzeJSONContent(content);
        features.push('structured_data');
        break;

      case 'xml':
        sequenceType = 'data';
        documentContent = extractedContent || content.substring(0, 2000);
        features.push('markup_data');
        break;

      case 'txt':
      case 'md':
        // Check if it contains biological sequences
        sequence = extractPotentialSequences(content);
        if (sequence.length > 0) {
          sequenceType = determineSequenceType(sequence);
          documentContent = `Text file containing ${sequenceType} sequences and additional content.`;
        } else {
          sequenceType = 'document';
          documentContent = extractedContent || content.substring(0, 2000);
        }
        break;

      case 'pdf':
      case 'docx':
        sequenceType = 'document';
        documentContent = extractedContent || content.substring(0, 2000);
        sequence = extractPotentialSequences(content);
        features.push('binary_document');
        break;

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        sequenceType = 'data';
        documentContent = extractedContent || `Image file: ${fileType.toUpperCase()} format. Visual content analysis available.`;
        features.push('image_file');
        break;

      case 'mp3':
      case 'wav':
        sequenceType = 'data';
        documentContent = extractedContent || `Audio file: ${fileType.toUpperCase()} format. Audio analysis available.`;
        features.push('audio_file');
        break;

      case 'mp4':
      case 'avi':
        sequenceType = 'data';
        documentContent = extractedContent || `Video file: ${fileType.toUpperCase()} format. Video analysis available.`;
        features.push('video_file');
        break;

      case 'zip':
      case 'rar':
        sequenceType = 'data';
        documentContent = extractedContent || `Archive file: ${fileType.toUpperCase()} format. Archive analysis available.`;
        features.push('archive_file');
        break;

      case 'exe':
      case 'bin':
        sequenceType = 'data';
        documentContent = extractedContent || `Binary file: ${fileType.toUpperCase()} format. Binary analysis available.`;
        features.push('binary_file');
        break;

      default:
        sequenceType = 'data';
        documentContent = extractedContent || `File type: ${fileType}. Content analysis available.`;
        sequence = content.substring(0, 1000);
    }

    const stats = {
      length: sequence.length || content.length,
      composition: calculateComposition(sequence || content)
    };

    // Add document-specific stats
    if (sequenceType === 'document' || sequenceType === 'data') {
      stats.wordCount = content.split(/\s+/).length;
      stats.lineCount = content.split('\n').length;
    }

    const analysis: BioFileAnalysis = {
      sequenceType,
      sequence: sequence.substring(0, 1000), // Limit for display
      fileType,
      stats
    };

    if (documentContent) {
      analysis.documentContent = documentContent.substring(0, 2000); // Limit for display
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
      }
    };
  }
}

function calculateComposition(sequence: string): Record<string, number> {
  const composition: Record<string, number> = {};

  for (const char of sequence.toUpperCase()) {
    composition[char] = (composition[char] || 0) + 1;
  }

  return composition;
}

// Helper function to analyze CSV content
function analyzeCSVContent(content: string): string {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',') || [];
    const rowCount = lines.length - 1;

    return `CSV file with ${headers.length} columns (${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}) and ${rowCount} data rows.`;
  } catch (error) {
    return `Tabular data file with ${content.length} characters.`;
  }
}

// Helper function to extract potential sequences from text
function extractPotentialSequences(content: string): string {
  // Look for DNA/RNA/protein-like sequences
  const sequences = content.match(/[ATCGNRYSWKMBDHV]{10,}/gi) || [];
  return sequences.join('');
}

// Helper function to analyze JSON content
function analyzeJSONContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    const keys = Object.keys(parsed);
    const structure = analyzeObjectStructure(parsed);
    return `JSON file with ${keys.length} top-level keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}. Structure: ${structure}`;
  } catch (error) {
    return `JSON-like file with ${content.length} characters. Unable to parse as valid JSON.`;
  }
}

// Analyze object structure
function analyzeObjectStructure(obj: any, depth = 0): string {
  if (depth > 2) return '[nested]';

  if (Array.isArray(obj)) {
    return `Array[${obj.length}]`;
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    return `Object{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
  } else {
    return typeof obj;
  }
}

function parseFastaSequence(content: string): string {
  const sequences = content.split('>').filter(seq => seq.trim().length > 0);
  return sequences.map(seq => seq.split('\n').slice(1).join('').replace(/\s/g, '').toUpperCase()).join('');
}

function determineSequenceType(sequence: string): 'dna' | 'rna' | 'protein' | 'unknown' {
  const isDNA = /^[ATCGN]+$/.test(sequence);
  const isRNA = /^[AUCGN]+$/.test(sequence);
  const isProtein = /^[ACDEFGHIKLMNPQRSTVWY]+$/.test(sequence);

  if (isDNA) return 'dna';
  if (isRNA) return 'rna';
  if (isProtein) return 'protein';
  return 'unknown';
}

function parseGenBankFile(content: string): { sequence: string; type: 'dna' | 'rna' | 'unknown'; features: string[] } {
  let sequence = '';
  let type: 'dna' | 'rna' | 'unknown' = 'unknown';
  const features: string[] = [];

  // Simplified parsing logic
  const originIndex = content.indexOf('ORIGIN');
  if (originIndex > -1) {
    sequence = content.substring(originIndex + 6).replace(/[^ATGC]/gi, '').trim();
    type = determineSequenceType(sequence);
  }

  return { sequence, type, features };
}

function parsePDBFile(content: string): { sequence: string; features: string[] } {
  const lines = content.split('\n');
  let sequence = '';
  const features: string[] = [];

  for (const line of lines) {
    if (line.startsWith('SEQRES')) {
      const residues = line.split('   ').slice(1);
      sequence += residues.join('');
    }
  }

  return { sequence, features };
}

function parseFastqFile(content: string): { sequence: string; features: string[] } {
  const lines = content.split('\n');
  let sequence = '';
  const features: string[] = [];

  for (let i = 1; i < lines.length; i += 4) {
    if (lines[i]) {
      sequence += lines[i].trim();
    }
  }

  return { sequence, features };
}

function calculateGCContent(sequence: string): number {
  const gcCount = (sequence.match(/[GC]/gi) || []).length;
  return sequence.length > 0 ? (gcCount / sequence.length) * 100 : 0;
}

export function generateCRISPRGuides(targetSequence: string, pamType: string = 'NGG'): Array<{
  sequence: string;
  position: number;
  score: number;
  offTargets: number;
}> {
  const guides = [];
  const guideLength = 20;

  // Simple CRISPR guide generation (in reality, this would use more sophisticated algorithms)
  for (let i = 0; i <= targetSequence.length - guideLength - 3; i++) {
    const guide = targetSequence.substring(i, i + guideLength);
    const pam = targetSequence.substring(i + guideLength, i + guideLength + 3);

    if (pam === pamType) {
      // Simple scoring based on GC content and avoiding runs of same nucleotides
      let score = 50;
      const gcContent = (guide.match(/[GC]/g) || []).length / guide.length;
      score += (gcContent >= 0.4 && gcContent <= 0.6) ? 20 : 0;

      // Penalize runs of 4+ same nucleotides
      if (!/(.)\1{3,}/.test(guide)) score += 20;

      // Simulate off-target count (would be calculated against genome)
      const offTargets = Math.floor(Math.random() * 5);

      guides.push({
        sequence: guide,
        position: i,
        score: Math.min(100, score),
        offTargets,
      });
    }
  }

  return guides.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function simulatePCR(primerForward: string, primerReverse: string, template: string): {
  success: boolean;
  productLength?: number;
  tm: { forward: number; reverse: number };
  warnings: string[];
} {
  const warnings = [];

  // Calculate melting temperatures (simplified)
  const calculateTm = (seq: string): number => {
    const gc = (seq.match(/[GC]/g) || []).length;
    const at = seq.length - gc;
    return 64.9 + 41 * (gc - 16.4) / seq.length;
  };

  const tmForward = calculateTm(primerForward);
  const tmReverse = calculateTm(primerReverse);

  // Check if primers can bind to template
  const forwardMatch = template.includes(primerForward);
  const reverseMatch = template.includes(reverseComplement(primerReverse));

  if (Math.abs(tmForward - tmReverse) > 5) {
    warnings.push('Primer melting temperatures differ by more than 5°C');
  }

  if (primerForward.length < 18 || primerReverse.length < 18) {
    warnings.push('Primers should be at least 18 nucleotides long');
  }

  return {
    success: forwardMatch && reverseMatch,
    productLength: forwardMatch && reverseMatch ? Math.abs(template.indexOf(primerForward) - template.lastIndexOf(reverseComplement(primerReverse))) : undefined,
    tm: { forward: Math.round(tmForward), reverse: Math.round(tmReverse) },
    warnings,
  };
}

function reverseComplement(sequence: string): string {
  const complement: Record<string, string> = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
  return sequence.split('').reverse().map(base => complement[base] || base).join('');
}

export function optimizeCodonUsage(sequence: string, organism: 'ecoli' | 'yeast' | 'human'): {
  optimizedSequence: string;
  improvements: number;
  codonUsage: Record<string, number>;
} {
  // Simplified codon optimization (in reality, this would use actual codon usage tables)
  const codonTables: Record<string, Record<string, string[]>> = {
    ecoli: {
      'F': ['TTT', 'TTC'], 'L': ['TTA', 'TTG', 'CTT', 'CTC', 'CTA', 'CTG'],
      'S': ['TCT', 'TCC', 'TCA', 'TCG', 'AGT', 'AGC'], 'Y': ['TAT', 'TAC'],
      'C': ['TGT', 'TGC'], 'W': ['TGG'], 'P': ['CCT', 'CCC', 'CCA', 'CCG'],
      'H': ['CAT', 'CAC'], 'Q': ['CAA', 'CAG'], 'R': ['CGT', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
      'I': ['ATT', 'ATC', 'ATA'], 'M': ['ATG'], 'T': ['ACT', 'ACC', 'ACA', 'ACG'],
      'N': ['AAT', 'AAC'], 'K': ['AAA', 'AAG'], 'V': ['GTT', 'GTC', 'GTA', 'GTG'],
      'A': ['GCT', 'GCC', 'GCA', 'GCG'], 'D': ['GAT', 'GAC'], 'E': ['GAA', 'GAG'],
      'G': ['GGT', 'GGC', 'GGA', 'GGG'], '*': ['TAA', 'TAG', 'TGA']
    },
    yeast: {
      // Simplified - would have actual yeast codon preferences
      'F': ['TTC', 'TTT'], 'L': ['CTG', 'TTG', 'CTC', 'CTT', 'TTA', 'CTA'],
      // ... other codons
    },
    human: {
      // Simplified - would have actual human codon preferences  
      'F': ['TTC', 'TTT'], 'L': ['CTG', 'CTC', 'TTG', 'CTT', 'CTA', 'TTA'],
      // ... other codons
    }
  };

  let optimizedSequence = '';
  let improvements = 0;
  const codonUsage: Record<string, number> = {};

  // Process sequence in codons (groups of 3)
  for (let i = 0; i < sequence.length; i += 3) {
    const codon = sequence.substring(i, i + 3);
    if (codon.length === 3) {
      // Find amino acid for this codon
      const aminoAcid = getAminoAcid(codon);
      if (aminoAcid && codonTables[organism][aminoAcid]) {
        // Use preferred codon for this organism
        const preferredCodon = codonTables[organism][aminoAcid][0];
        optimizedSequence += preferredCodon;

        if (preferredCodon !== codon) improvements++;
        codonUsage[preferredCodon] = (codonUsage[preferredCodon] || 0) + 1;
      } else {
        optimizedSequence += codon;
      }
    }
  }

  return {
    optimizedSequence,
    improvements,
    codonUsage,
  };
}

function getAminoAcid(codon: string): string | null {
  const geneticCode: Record<string, string> = {
    'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
    'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
    'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
    'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
    'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
    'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
    'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
    'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G',
  };

  return geneticCode[codon.toUpperCase()] || null;
}

// Helper function to extract text content based on file type
async function extractTextContent(content: string, fileType: BioFileType): Promise<string> {
  try {
    switch (fileType) {
      case 'pdf':
        return extractPDFContent(content);
      case 'docx':
      case 'doc':
        return extractDocxContent(content);
      case 'json':
        return analyzeJSONContent(content);
      case 'csv':
        return analyzeCSVContent(content);
      case 'xml':
        return extractXMLContent(content);
      case 'rtf':
        return extractRTFContent(content);
      case 'html':
        return extractHTMLContent(content);
      case 'xlsx':
      case 'xls':
        return extractExcelContent(content);
      case 'pptx':
      case 'ppt':
        return extractPowerPointContent(content);
      default:
        return sanitizeContent(content);
    }
  } catch (error) {
    console.warn('Content extraction failed, using raw content:', error);
    return sanitizeContent(content);
  }
}

// Extract readable content from PDF (enhanced text extraction)
function extractPDFContent(content: string): string {
  try {
    let extractedText = '';
    const textChunks: string[] = [];

    // Method 1: Extract text from PDF text objects (BT...ET blocks)
    const textObjectRegex = /BT\s+(.*?)\s+ET/gs;
    const textObjects = content.match(textObjectRegex) || [];

    for (const textObj of textObjects) {
      // Extract text from Tj and TJ operators
      const tjRegex = /\((.*?)\)\s*Tj/g;
      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      
      let match;
      while ((match = tjRegex.exec(textObj)) !== null) {
        const text = match[1].replace(/\\[()]/g, (m) => m[1]); // Unescape parentheses
        textChunks.push(text);
      }
      
      while ((match = tjArrayRegex.exec(textObj)) !== null) {
        const arrayContent = match[1];
        const textParts = arrayContent.match(/\(([^)]*)\)/g) || [];
        textParts.forEach(part => {
          const cleanText = part.slice(1, -1).replace(/\\[()]/g, (m) => m[1]);
          textChunks.push(cleanText);
        });
      }
    }

    // Method 2: Extract from stream objects
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    const streams = content.match(streamRegex) || [];
    
    for (const stream of streams) {
      // Look for readable text in streams
      const readableText = stream.match(/[A-Za-z0-9\s.,!?;:'"()-]{4,}/g) || [];
      textChunks.push(...readableText);
    }

    // Method 3: Direct text extraction from PDF content
    const directTextRegex = /(?:[A-Z][a-z]+\s+){2,}[A-Za-z0-9\s.,!?;:'"()-]*|[A-Za-z0-9]{3,}[\s.,!?;:'"()-]+[A-Za-z0-9\s.,!?;:'"()-]{10,}/g;
    const directMatches = content.match(directTextRegex) || [];
    textChunks.push(...directMatches);

    // Method 4: Extract text patterns between common PDF delimiters
    const patternExtractors = [
      /\/Title\s*\((.*?)\)/g,
      /\/Subject\s*\((.*?)\)/g,
      /\/Author\s*\((.*?)\)/g,
      /\/Creator\s*\((.*?)\)/g,
      /\/Producer\s*\((.*?)\)/g,
      /\/Keywords\s*\((.*?)\)/g
    ];

    for (const regex of patternExtractors) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        textChunks.push(`${regex.source.split('\\')[1]}: ${match[1]}`);
      }
    }

    // Combine and clean all extracted text
    extractedText = textChunks
      .filter(chunk => chunk && chunk.trim().length > 2)
      .map(chunk => chunk.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim())
      .filter(chunk => chunk.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (extractedText.length > 50) {
      return `PDF Document Content:\n\n${extractedText.substring(0, 3000)}${extractedText.length > 3000 ? '\n\n...(content truncated)' : ''}`;
    } else {
      // Fallback: analyze PDF structure
      const pageCount = (content.match(/\/Type\s*\/Page[^s]/g) || []).length;
      const hasImages = content.includes('/XObject') && content.includes('/Image');
      const hasText = content.includes('/Font') || content.includes('Tj') || content.includes('TJ');
      
      let analysis = `PDF Document Analysis:\n\n`;
      analysis += `• File size: ${Math.round(content.length / 1024)}KB\n`;
      if (pageCount > 0) analysis += `• Pages: ${pageCount}\n`;
      if (hasText) analysis += `• Contains text content\n`;
      if (hasImages) analysis += `• Contains images\n`;
      
      // Try to extract any readable fragments
      const fragments = content.match(/[A-Za-z]{4,}[\s\w.,!?;:'"()-]{10,}/g) || [];
      if (fragments.length > 0) {
        analysis += `\nReadable fragments found:\n${fragments.slice(0, 10).join('\n').substring(0, 1000)}`;
      }
      
      return analysis;
    }
  } catch (error) {
    return `PDF document (${Math.round(content.length / 1024)}KB) - Enhanced extraction encountered an error. The document appears to be a structured PDF file that may require specialized parsing.`;
  }
}

// Extract readable content from Word documents
function extractDocxContent(content: string): string {
  try {
    let extractedText = '';
    const textChunks: string[] = [];

    // Method 1: Extract from XML content in DOCX structure
    // DOCX files contain XML, look for document.xml content
    const xmlContentRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
    let match;
    while ((match = xmlContentRegex.exec(content)) !== null) {
      const text = match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      if (text.trim()) textChunks.push(text);
    }

    // Method 2: Extract from paragraph elements
    const paragraphRegex = /<w:p[^>]*>(.*?)<\/w:p>/gs;
    while ((match = paragraphRegex.exec(content)) !== null) {
      const paragraph = match[1];
      const textInParagraph = paragraph.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (textInParagraph.length > 3) textChunks.push(textInParagraph);
    }

    // Method 3: Look for readable text patterns in the binary content
    const readableTextRegex = /[A-Za-z][A-Za-z0-9\s.,!?;:'"()-]{15,}/g;
    const readableMatches = content.match(readableTextRegex) || [];
    textChunks.push(...readableMatches.filter(text => 
      !text.includes('<?xml') && 
      !text.includes('Microsoft') && 
      text.split(' ').length > 2
    ));

    // Method 4: Extract document properties
    const titleMatch = content.match(/<dc:title[^>]*>(.*?)<\/dc:title>/);
    const subjectMatch = content.match(/<dc:subject[^>]*>(.*?)<\/dc:subject>/);
    const creatorMatch = content.match(/<dc:creator[^>]*>(.*?)<\/dc:creator>/);
    
    if (titleMatch) textChunks.unshift(`Title: ${titleMatch[1]}`);
    if (subjectMatch) textChunks.unshift(`Subject: ${subjectMatch[1]}`);
    if (creatorMatch) textChunks.unshift(`Author: ${creatorMatch[1]}`);

    // Method 5: Extract from shared strings (for embedded Excel data)
    const sharedStringRegex = /<si[^>]*>.*?<t[^>]*>(.*?)<\/t>.*?<\/si>/gs;
    while ((match = sharedStringRegex.exec(content)) !== null) {
      const text = match[1].replace(/&[a-z]+;/g, ' ').trim();
      if (text.length > 2) textChunks.push(text);
    }

    // Combine and clean extracted text
    extractedText = textChunks
      .filter(chunk => chunk && chunk.trim().length > 1)
      .map(chunk => chunk
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      )
      .filter(chunk => chunk.length > 0 && !/^[^A-Za-z]*$/.test(chunk))
      .join('\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    if (extractedText.length > 50) {
      return `Word Document Content:\n\n${extractedText.substring(0, 3000)}${extractedText.length > 3000 ? '\n\n...(content truncated)' : ''}`;
    } else {
      // Fallback analysis
      const hasImages = content.includes('image') || content.includes('picture');
      const hasTables = content.includes('<w:tbl') || content.includes('table');
      const hasFormats = content.includes('<w:b/>') || content.includes('<w:i/>');
      
      let analysis = `Word Document Analysis:\n\n`;
      analysis += `• File size: ${Math.round(content.length / 1024)}KB\n`;
      if (hasImages) analysis += `• Contains images\n`;
      if (hasTables) analysis += `• Contains tables\n`;
      if (hasFormats) analysis += `• Contains formatted text\n`;
      
      // Extract any meaningful text fragments
      const fragments = content.match(/[A-Za-z]{3,}[\s\w.,!?;:'"()-]{8,}/g) || [];
      if (fragments.length > 0) {
        const cleanFragments = fragments
          .filter(f => !f.includes('xml') && !f.includes('Microsoft'))
          .slice(0, 15);
        if (cleanFragments.length > 0) {
          analysis += `\nContent fragments:\n${cleanFragments.join('\n').substring(0, 1000)}`;
        }
      }
      
      return analysis;
    }
  } catch (error) {
    return `Word document (${Math.round(content.length / 1024)}KB) - Enhanced extraction encountered an error. This appears to be a structured document that may contain rich formatting.`;
  }
}

// Extract content from XML files
function extractXMLContent(content: string): string {
  try {
    // Remove XML tags but keep text content
    let textContent = content
      .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1') // Extract CDATA content
      .replace(/<!--.*?-->/gs, '') // Remove comments
      .replace(/<[^>]*>/g, ' ') // Remove tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    return textContent.length > 0 ? 
      `XML Document Content:\n\n${textContent.substring(0, 2000)}${textContent.length > 2000 ? '...' : ''}` :
      'XML document structure detected - contains markup data';
  } catch (error) {
    return 'XML document - content extraction failed';
  }
}

// Extract content from RTF files
function extractRTFContent(content: string): string {
  try {
    // RTF uses control words, extract readable text
    let textContent = content
      .replace(/\\[a-z]+\d*\s?/g, ' ') // Remove RTF control words
      .replace(/[{}]/g, ' ') // Remove braces
      .replace(/\\\S/g, ' ') // Remove other RTF codes
      .replace(/\s+/g, ' ')
      .trim();

    return textContent.length > 0 ?
      `RTF Document Content:\n\n${textContent.substring(0, 2000)}${textContent.length > 2000 ? '...' : ''}` :
      'RTF document detected - rich text format';
  } catch (error) {
    return 'RTF document - content extraction failed';
  }
}

// Extract content from HTML files
function extractHTMLContent(content: string): string {
  try {
    // Extract text from HTML, preserve some structure
    let textContent = content
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove styles
      .replace(/<!--.*?-->/gs, '') // Remove comments
      .replace(/<br\s*\/?>/gi, '\n') // Convert breaks to newlines
      .replace(/<\/?(h[1-6]|p|div|section|article)[^>]*>/gi, '\n') // Add newlines for block elements
      .replace(/<[^>]*>/g, ' ') // Remove remaining tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return textContent.length > 0 ?
      `HTML Document Content:\n\n${textContent.substring(0, 2500)}${textContent.length > 2500 ? '...' : ''}` :
      'HTML document detected - web page content';
  } catch (error) {
    return 'HTML document - content extraction failed';
  }
}

// Extract content from Excel files (basic)
function extractExcelContent(content: string): string {
  try {
    const textChunks: string[] = [];

    // Method 1: Extract from shared strings XML (xlsx)
    const sharedStringRegex = /<t[^>]*>(.*?)<\/t>/g;
    let match;
    while ((match = sharedStringRegex.exec(content)) !== null) {
      const text = match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
      if (text.length > 0) textChunks.push(text);
    }

    // Method 2: Extract readable text patterns
    const readableRegex = /[A-Za-z][A-Za-z0-9\s.,!?;:'"()-]{5,}/g;
    const readableMatches = content.match(readableRegex) || [];
    textChunks.push(...readableMatches.filter(text => 
      !text.includes('xml') && 
      !text.includes('Microsoft') &&
      text.split(' ').length > 1
    ));

    const extractedText = textChunks
      .filter((chunk, index) => textChunks.indexOf(chunk) === index) // Remove duplicates
      .slice(0, 100) // Limit chunks
      .join('\n');

    return extractedText.length > 20 ?
      `Excel Spreadsheet Content:\n\n${extractedText.substring(0, 2000)}${extractedText.length > 2000 ? '...' : ''}` :
      `Excel spreadsheet detected (${Math.round(content.length / 1024)}KB) - contains spreadsheet data and formulas`;
  } catch (error) {
    return 'Excel document - content extraction failed';
  }
}

// Extract content from PowerPoint files (basic)
function extractPowerPointContent(content: string): string {
  try {
    const textChunks: string[] = [];

    // Extract from slide content XML
    const slideTextRegex = /<a:t[^>]*>(.*?)<\/a:t>/g;
    let match;
    while ((match = slideTextRegex.exec(content)) !== null) {
      const text = match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
      if (text.length > 0) textChunks.push(text);
    }

    // Extract from paragraph elements
    const paragraphRegex = /<p:txBody[^>]*>(.*?)<\/p:txBody>/gs;
    while ((match = paragraphRegex.exec(content)) !== null) {
      const paragraph = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (paragraph.length > 3) textChunks.push(paragraph);
    }

    const extractedText = textChunks
      .filter((chunk, index) => textChunks.indexOf(chunk) === index)
      .slice(0, 50)
      .join('\n');

    return extractedText.length > 20 ?
      `PowerPoint Presentation Content:\n\n${extractedText.substring(0, 2000)}${extractedText.length > 2000 ? '...' : ''}` :
      `PowerPoint presentation detected (${Math.round(content.length / 1024)}KB) - contains slide content`;
  } catch (error) {
    return 'PowerPoint document - content extraction failed';
  }
}

// Sanitize and extract readable content
function sanitizeContent(content: string): string {
  try {
    // Remove control characters but keep readable text
    const cleanContent = content
      .replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Replace non-printable with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return cleanContent.substring(0, 2000);
  } catch (error) {
    return `File content (${content.length} bytes) - requires specialized parsing for this format.`;
  }
}
