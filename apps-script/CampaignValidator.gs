// Content Alchemist - Campaign Validator
// Handles validation of campaign data and business rules

/**
 * Campaign Validator Class
 * Validates campaign data according to business rules
 */
class CampaignValidator {
  
  constructor() {
    this.errors = [];
  }
  
  /**
   * Validate campaign data
   * @param {Object} campaignData - Campaign data to validate
   * @throws {Error} If validation fails
   */
  validateCampaignData(campaignData) {
    this.errors = [];
    
    // Validate required fields
    this.validateRequiredFields(campaignData);
    
    // Validate field lengths
    this.validateFieldLengths(campaignData);
    
    // Validate field formats
    this.validateFieldFormats(campaignData);
    
    // Validate business rules
    this.validateBusinessRules(campaignData);
    
    // If there are errors, throw them
    if (this.errors.length > 0) {
      throw new Error(`Validation failed:\n${this.errors.join('\n')}`);
    }
  }
  
  /**
   * Validate required fields
   * @param {Object} campaignData - Campaign data to validate
   */
  validateRequiredFields(campaignData) {
    const requiredFields = [
      { field: 'Campaign_ID', displayName: 'Campaign ID' },
      { field: 'Partner_Name', displayName: 'Partner Name' },
      { field: 'Transcript_Raw', displayName: 'Transcript' }
    ];
    
    requiredFields.forEach(({ field, displayName }) => {
      if (!campaignData[field] || campaignData[field].toString().trim() === '') {
        this.errors.push(`${displayName} is required`);
      }
    });
  }
  
  /**
   * Validate field lengths
   * @param {Object} campaignData - Campaign data to validate
   */
  validateFieldLengths(campaignData) {
    // Campaign ID length
    if (campaignData.Campaign_ID) {
      const campaignId = campaignData.Campaign_ID.toString().trim();
      if (campaignId.length < CONFIG.VALIDATION.MIN_CAMPAIGN_ID_LENGTH) {
        this.errors.push(
          `Campaign ID must be at least ${CONFIG.VALIDATION.MIN_CAMPAIGN_ID_LENGTH} characters long`
        );
      }
      if (campaignId.length > CONFIG.VALIDATION.MAX_CAMPAIGN_ID_LENGTH) {
        this.errors.push(
          `Campaign ID must be no more than ${CONFIG.VALIDATION.MAX_CAMPAIGN_ID_LENGTH} characters long`
        );
      }
    }
    
    // Partner Name length
    if (campaignData.Partner_Name) {
      const partnerName = campaignData.Partner_Name.toString().trim();
      if (partnerName.length < CONFIG.VALIDATION.MIN_PARTNER_NAME_LENGTH) {
        this.errors.push(
          `Partner Name must be at least ${CONFIG.VALIDATION.MIN_PARTNER_NAME_LENGTH} characters long`
        );
      }
      if (partnerName.length > CONFIG.VALIDATION.MAX_PARTNER_NAME_LENGTH) {
        this.errors.push(
          `Partner Name must be no more than ${CONFIG.VALIDATION.MAX_PARTNER_NAME_LENGTH} characters long`
        );
      }
    }
    
    // Transcript length
    if (campaignData.Transcript_Raw) {
      const transcript = campaignData.Transcript_Raw.toString().trim();
      if (transcript.length < CONFIG.VALIDATION.MIN_TRANSCRIPT_LENGTH) {
        this.errors.push(
          `Transcript must be at least ${CONFIG.VALIDATION.MIN_TRANSCRIPT_LENGTH} characters long`
        );
      }
    }
  }
  
  /**
   * Validate field formats
   * @param {Object} campaignData - Campaign data to validate
   */
  validateFieldFormats(campaignData) {
    // Campaign ID format (alphanumeric, hyphens, underscores)
    if (campaignData.Campaign_ID) {
      const campaignId = campaignData.Campaign_ID.toString().trim();
      const campaignIdRegex = /^[a-zA-Z0-9_-]+$/;
      
      if (!campaignIdRegex.test(campaignId)) {
        this.errors.push(
          'Campaign ID can only contain letters, numbers, hyphens, and underscores'
        );
      }
    }
    
    // YouTube URL format (if provided)
    if (campaignData.YouTube_URL && campaignData.YouTube_URL.toString().trim() !== '') {
      const youtubeUrl = campaignData.YouTube_URL.toString().trim();
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      
      if (!youtubeRegex.test(youtubeUrl)) {
        this.errors.push('YouTube URL format is invalid');
      }
    }
    
    // Partner Name format (letters, spaces, hyphens, apostrophes)
    if (campaignData.Partner_Name) {
      const partnerName = campaignData.Partner_Name.toString().trim();
      const partnerNameRegex = /^[a-zA-Z\s\-']+$/;
      
      if (!partnerNameRegex.test(partnerName)) {
        this.errors.push(
          'Partner Name can only contain letters, spaces, hyphens, and apostrophes'
        );
      }
    }
  }
  
  /**
   * Validate business rules
   * @param {Object} campaignData - Campaign data to validate
   */
  validateBusinessRules(campaignData) {
    // Check for duplicate Campaign ID
    if (campaignData.Campaign_ID) {
      const sheetManager = new SheetManager();
      const existingRow = sheetManager.findRowByCampaignId(campaignData.Campaign_ID);
      
      if (existingRow) {
        // If it's the same row, that's fine (updating existing)
        const activeRow = this.getActiveRow();
        if (existingRow !== activeRow) {
          this.errors.push(`Campaign ID "${campaignData.Campaign_ID}" already exists`);
        }
      }
    }
    
    // Validate transcript content quality
    if (campaignData.Transcript_Raw) {
      const transcript = campaignData.Transcript_Raw.toString();
      
      // Check if transcript contains meaningful content
      const meaningfulWords = transcript.split(/\s+/).filter(word => 
        word.length > 2 && !word.match(/^\d+$/)
      ).length;
      
      if (meaningfulWords < 10) {
        this.errors.push('Transcript appears to be too short or contains insufficient meaningful content');
      }
      
      // Check for common transcription artifacts
      const hasTimestamps = /\d{1,2}:\d{2}:\d{2}/.test(transcript);
      if (!hasTimestamps) {
        this.errors.push('Transcript should contain timestamps (HH:MM:SS format)');
      }
    }
  }
  
  /**
   * Get the active row number (helper method)
   * @returns {number|null} Active row number or null if header row
   */
  getActiveRow() {
    const activeRange = SpreadsheetApp.getActiveRange();
    if (!activeRange) return null;
    
    const rowNumber = activeRange.getRow();
    return rowNumber > 1 ? rowNumber : null;
  }
  
  /**
   * Validate a single field
   * @param {string} fieldName - Name of the field to validate
   * @param {*} value - Value to validate
   * @param {Object} rules - Validation rules for the field
   * @returns {boolean} True if valid, false otherwise
   */
  validateField(fieldName, value, rules) {
    try {
      // Required field check
      if (rules.required && (!value || value.toString().trim() === '')) {
        this.errors.push(`${fieldName} is required`);
        return false;
      }
      
      // Length checks
      if (rules.minLength && value && value.toString().length < rules.minLength) {
        this.errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
        return false;
      }
      
      if (rules.maxLength && value && value.toString().length > rules.maxLength) {
        this.errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
        return false;
      }
      
      // Format checks
      if (rules.pattern && value && !rules.pattern.test(value.toString())) {
        this.errors.push(`${fieldName} format is invalid`);
        return false;
      }
      
      return true;
      
    } catch (error) {
      this.errors.push(`Error validating ${fieldName}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get validation errors
   * @returns {Array<string>} Array of validation error messages
   */
  getErrors() {
    return this.errors;
  }
  
  /**
   * Check if validation passed
   * @returns {boolean} True if no errors, false otherwise
   */
  isValid() {
    return this.errors.length === 0;
  }
  
  /**
   * Clear validation errors
   */
  clearErrors() {
    this.errors = [];
  }
}
