// Military-grade security for BioScriptor
import crypto from 'crypto';

export class SecurityManager {
  private static readonly BLACKLIST_PATTERNS = [
    // System commands
    /rm\s+-rf/gi,
    /sudo\s+/gi,
    /chmod\s+/gi,
    /chown\s+/gi,
    
    // Database operations
    /DROP\s+(DATABASE|TABLE|INDEX)/gi,
    /DELETE\s+FROM/gi,
    /TRUNCATE\s+TABLE/gi,
    
    // Code execution
    /eval\s*\(/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /shell_exec\s*\(/gi,
    /__import__\s*\(/gi,
    /subprocess\./gi,
    /os\.system/gi,
    /child_process/gi,
    
    // Network operations
    /curl\s+.*\|\s*sh/gi,
    /wget\s+.*\|\s*sh/gi,
    /nc\s+-/gi,
    /netcat\s+-/gi,
    
    // File operations
    />\s*\/dev\/null/gi,
    /2>&1/gi,
    /&\s*$/gi,
    
    // Injection attempts
    /\;\s*(rm|sudo|chmod)/gi,
    /\|\s*(rm|sudo|chmod)/gi,
    /&&\s*(rm|sudo|chmod)/gi,
  ];

  private static readonly WHITELIST_DOMAINS = [
    'ncbi.nlm.nih.gov',
    'ebi.ac.uk',
    'uniprot.org',
    'rcsb.org',
    'ensembl.org',
    'bioconductor.org',
    'biopython.org',
  ];

  private encryptionKey: Buffer;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey 
      ? Buffer.from(encryptionKey, 'hex')
      : crypto.randomBytes(32);
  }

  /**
   * Sanitize and validate user input
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: must be a non-empty string');
    }

    // Check length limits
    if (input.length > 100000) {
      throw new Error('Input too long: maximum 100,000 characters allowed');
    }

    // Check for malicious patterns
    for (const pattern of SecurityManager.BLACKLIST_PATTERNS) {
      if (pattern.test(input)) {
        const match = input.match(pattern);
        throw new Error(`Security violation: Blocked dangerous pattern: ${match?.[0]}`);
      }
    }

    // Remove potentially dangerous characters in specific contexts
    const sanitized = input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
      .trim();

    return sanitized;
  }

  /**
   * Validate URLs for safe external access
   */
  validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS
      if (urlObj.protocol !== 'https:') {
        return false;
      }
      
      // Check against whitelist
      return SecurityManager.WHITELIST_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    cipher.setIV(iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    decipher.setIV(iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate secure session token
   */
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash passwords or sensitive data
   */
  hashData(data: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    const verification = this.hashData(data, salt);
    return verification.hash === hash;
  }

  /**
   * Rate limiting helper
   */
  isRateLimited(identifier: string, maxRequests: number, windowMs: number): boolean {
    // This would typically use Redis or in-memory cache
    // For now, implement basic in-memory rate limiting
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    
    // In a real implementation, use proper cache/storage
    // This is simplified for demonstration
    return false; // Always allow for now
  }

  /**
   * Audit log entry
   */
  createAuditLog(event: {
    userId?: string;
    action: string;
    resource: string;
    timestamp?: Date;
    metadata?: any;
  }): void {
    const logEntry = {
      timestamp: event.timestamp || new Date(),
      userId: event.userId || 'anonymous',
      action: event.action,
      resource: event.resource,
      metadata: event.metadata || {},
      sessionId: crypto.randomUUID(),
    };

    // In production, send to secure logging service
    console.log('AUDIT_LOG:', JSON.stringify(logEntry));
  }

  /**
   * Validate bioinformatics file content
   */
  validateBioFile(content: string, fileType: string): boolean {
    switch (fileType.toLowerCase()) {
      case 'fasta':
        return this.validateFastaContent(content);
      case 'gb':
      case 'genbank':
        return this.validateGenbankContent(content);
      case 'pdb':
        return this.validatePDBContent(content);
      case 'csv':
        return this.validateCSVContent(content);
      default:
        return false;
    }
  }

  private validateFastaContent(content: string): boolean {
    // Basic FASTA format validation
    const lines = content.split('\n');
    let hasHeader = false;
    let hasSequence = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('>')) {
        hasHeader = true;
      } else if (/^[ATGCNRYSWKMBDHV\-]+$/i.test(trimmed)) {
        hasSequence = true;
      } else if (hasHeader) {
        // Invalid character in sequence
        return false;
      }
    }
    
    return hasHeader && hasSequence;
  }

  private validateGenbankContent(content: string): boolean {
    // Basic GenBank format validation
    return content.includes('LOCUS') && content.includes('//');
  }

  private validatePDBContent(content: string): boolean {
    // Basic PDB format validation
    const lines = content.split('\n');
    return lines.some(line => line.startsWith('ATOM') || line.startsWith('HETATM'));
  }

  private validateCSVContent(content: string): boolean {
    // Basic CSV validation
    const lines = content.split('\n');
    if (lines.length < 2) return false;
    
    const headerCols = lines[0].split(',').length;
    return lines.slice(1, 6).every(line => 
      line.trim() === '' || line.split(',').length === headerCols
    );
  }

  /**
   * Sanitize code output for display
   */
  sanitizeCodeOutput(output: string): string {
    // Remove potential script injections from code output
    return output
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
      .replace(/javascript:/gi, 'javascript_removed:')
      .replace(/on\w+\s*=/gi, 'event_handler_removed=')
      .substring(0, 50000); // Limit output length
  }
}

// Singleton instance
export const securityManager = new SecurityManager(process.env.ENCRYPTION_KEY);