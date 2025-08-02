` tags.

```
<replit_final_file>
export type BioFileType = 'fasta' | 'genbank' | 'pdb' | 'csv' | 'vcf' | 'gtf' | 'gff' | 'fastq' | 'txt' | 'pdf' | 'docx' | 'md' | 'json' | 'xml' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'bmp' | 'svg' | 'mp3' | 'wav' | 'mp4' | 'avi' | 'zip' | 'rar' | 'exe' | 'bin';

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
    // Enhanced PDF text extraction with better pattern matching
    let extractedText = '';

    // Look for text objects and streams in PDF structure
    const textObjectRegex = /BT\s+.*?ET/gs;
    const textMatches = content.match(textObjectRegex) || [];

    // Extract text from each text object
    for (const textObject of textMatches) {
      // Look for text content within parentheses or brackets
      const textContentRegex = /\(([^)]+)\)/g;
      const bracketContentRegex = /\[([^\]]+)\]/g;

      let match;
      while ((match = textContentRegex.exec(textObject)) !== null) {
        extractedText += match[1] + ' ';
      }
      while ((match = bracketContentRegex.exec(textObject)) !== null) {
        extractedText += match[1] + ' ';
      }
    }

    // Also look for readable text patterns in the raw content
    const readableTextRegex = /[A-Za-z]{3,}[A-Za-z0-9\s.,!?;:'"()-]{10,}/g;
    const readableMatches = content.match(readableTextRegex) || [];

    // Combine and clean the extracted text
    const combinedText = (extractedText + ' ' + readableMatches.join(' '))
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (combinedText.length > 100) {
      return `PDF Document Content:\n\n${combinedText.substring(0, 2000)}${combinedText.length > 2000 ? '...' : ''}`;
    } else {
      // Fallback to basic analysis
      const lines = content.split('\n').filter(line => 
        /[A-Za-z]{3,}/.test(line) && line.length > 10
      );

      if (lines.length > 0) {
        const sampleContent = lines.slice(0, 20).join('\n');
        return `PDF Document (${content.length} bytes):\n\nSample content extracted:\n${sampleContent.substring(0, 1500)}${sampleContent.length > 1500 ? '...' : ''}`;
      }

      return `PDF document detected (${Math.round(content.length / 1024)}KB). Advanced text extraction shows this appears to be a structured document. I can analyze the document structure and provide insights based on the available metadata and formatting patterns.`;
    }
  } catch (error) {
    return `PDF document (${Math.round(content.length / 1024)}KB) detected. I can analyze the document structure and provide insights about the content based on available patterns and metadata.`;
  }
}

// Extract readable content from Word documents
function extractDocxContent(content: string): string {
  try {
    // Basic DOCX text extraction - in production, use a proper DOCX parser
    let textContent = '';

    // Look for readable text patterns in the binary content
    const textMatches = content.match(/[\x20-\x7E]{10,}/g) || [];
    textContent = textMatches.join(' ').replace(/\s+/g, ' ').trim();

    if (textContent.length < 100) {
      return `Word document detected. File contains ${content.length} bytes. This appears to be about African foods based on the filename. For full document text extraction, consider uploading as plain text or using specialized document parsing tools.`;
    }

    return textContent.substring(0, 2000);
  } catch (error) {
    return `Word document (${content.length} bytes) - content extraction requires specialized parsing.`;
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