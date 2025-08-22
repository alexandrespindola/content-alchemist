// Content Alchemist - Configuration
// Centralized configuration for the entire system

/**
 * Configuration constants for Content Alchemist
 */
const CONFIG = {
  // Sheet configuration
  SHEET_NAME: 'Content Alchemist',
  
  // Column definitions
  COLUMNS: {
    CAMPAIGN_ID: { index: 0, name: 'Campaign_ID', width: 120 },
    PARTNER_NAME: { index: 1, name: 'Partner_Name', width: 150 },
    YOUTUBE_URL: { index: 2, name: 'YouTube_URL', width: 300 },
    TRANSCRIPT_RAW: { index: 3, name: 'Transcript_Raw', width: 400 },
    STATUS: { index: 4, name: 'Status', width: 100 },
    OUTPUT_FOLDER: { index: 5, name: 'Output_Folder', width: 300 },
    CREATED_AT: { index: 6, name: 'Created_At', width: 150 }
  },
  
  // Status values
  STATUSES: {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    ERROR: 'Error'
  },
  
  // N8N configuration
  N8N: {
    WEBHOOK_URL: 'https://n8n-local.titansdev.es/webhook/content-alchemy',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
  },
  
  // UI configuration
  UI: {
    HEADER_BACKGROUND: '#4285f4',
    HEADER_FONT_COLOR: 'white',
    SUCCESS_COLOR: '#34a853',
    ERROR_COLOR: '#ea4335',
    WARNING_COLOR: '#fbbc04'
  },
  
  // Validation rules
  VALIDATION: {
    MIN_CAMPAIGN_ID_LENGTH: 3,
    MAX_CAMPAIGN_ID_LENGTH: 50,
    MIN_PARTNER_NAME_LENGTH: 2,
    MAX_PARTNER_NAME_LENGTH: 100,
    MIN_TRANSCRIPT_LENGTH: 50
  }
};

function getColumnIndex(columnName) {
  for (const [key, column] of Object.entries(CONFIG.COLUMNS)) {
    if (column.name === columnName) {
      return column.index;
    }
  }
  throw new Error(`Column "${columnName}" not found`);
}

/**
 * Get column name by index
 * @param {number} columnIndex - Column index (0-based)
 * @returns {string} Column name
 */
function getColumnName(columnIndex) {
  for (const [key, column] of Object.entries(CONFIG.COLUMNS)) {
    if (column.index === columnIndex) {
      return column.name;
    }
  }
  throw new Error(`Column index ${columnIndex} not found`);
}

/**
 * Get all column names as array
 * @returns {Array<string>} Array of column names
 */
function getAllColumnNames() {
  return Object.values(CONFIG.COLUMNS)
    .sort((a, b) => a.index - b.index)
    .map(column => column.name);
}

/**
 * Get all column widths as array
 * @returns {Array<number>} Array of column widths
 */
function getAllColumnWidths() {
  return Object.values(CONFIG.COLUMNS)
    .sort((a, b) => a.index - b.index)
    .map(column => column.width);
}
