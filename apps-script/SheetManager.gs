// Content Alchemist - Sheet Manager
// Handles all Google Sheets operations and formatting

/**
 * Sheet Manager Class
 * Manages Google Sheets operations, formatting, and structure
 */
class SheetManager {
  
  constructor() {
    this.sheet = this.getSheet();
  }
  
  /**
   * Get the active sheet by name
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object
   */
  getSheet() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found! Please create it first.`);
    }
    
    return sheet;
  }
  
  /**
   * Setup the sheet with headers, formatting, and validation
   * Should be run once when creating a new sheet
   */
  setupSheet() {
    try {
      this.setupHeaders();
      this.setupFormatting();
      this.setupValidation();
      this.setupColumnWidths();
      this.freezeHeaderRow();
      
      console.log('Sheet setup completed successfully');
    } catch (error) {
      console.error('Error in setupSheet:', error);
      throw error;
    }
  }
  
  /**
   * Setup sheet headers
   */
  setupHeaders() {
    const headers = getAllColumnNames();
    const headerRange = this.sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
  }
  
  /**
   * Apply formatting to headers
   */
  setupFormatting() {
    const headerRange = this.sheet.getRange(1, 1, 1, getAllColumnNames().length);
    
    headerRange
      .setFontWeight('bold')
      .setBackground(CONFIG.UI.HEADER_BACKGROUND)
      .setFontColor(CONFIG.UI.HEADER_FONT_COLOR)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  }
  
  /**
   * Setup data validation for status column
   */
  setupValidation() {
    const statusColumn = getColumnIndex('Status') + 1; // +1 because sheets are 1-indexed
    const statusValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(Object.values(CONFIG.STATUSES), true)
      .setAllowInvalid(false)
      .setHelpText('Select a valid status')
      .build();
    
    // Apply validation to status column (rows 2-1000)
    this.sheet.getRange(2, statusColumn, 999, 1).setDataValidation(statusValidation);
  }
  
  /**
   * Set column widths based on configuration
   */
  setupColumnWidths() {
    const columnWidths = getAllColumnWidths();
    
    columnWidths.forEach((width, index) => {
      this.sheet.setColumnWidth(index + 1, width);
    });
  }
  
  /**
   * Freeze the header row
   */
  freezeHeaderRow() {
    this.sheet.setFrozenRows(1);
  }
  
  /**
   * Get data from a specific row
   * @param {number} rowNumber - Row number (1-indexed)
   * @returns {Array} Array of values from the row
   */
  getRowData(rowNumber) {
    if (rowNumber <= 1) {
      throw new Error('Row number must be greater than 1 (header row)');
    }
    
    const columnCount = getAllColumnNames().length;
    return this.sheet.getRange(rowNumber, 1, 1, columnCount).getValues()[0];
  }
  
  /**
   * Update a specific cell value
   * @param {number} rowNumber - Row number (1-indexed)
   * @param {string} columnName - Name of the column
   * @param {*} value - Value to set
   */
  updateCell(rowNumber, columnName, value) {
    if (rowNumber <= 1) {
      throw new Error('Cannot update header row');
    }
    
    const columnIndex = getColumnIndex(columnName) + 1; // +1 because sheets are 1-indexed
    this.sheet.getRange(rowNumber, columnIndex).setValue(value);
  }
  
  /**
   * Get the next empty row number
   * @returns {number} Next empty row number
   */
  getNextEmptyRow() {
    const lastRow = this.sheet.getLastRow();
    return lastRow + 1;
  }
  
  /**
   * Add a new campaign row
   * @param {Object} campaignData - Campaign data object
   * @returns {number} Row number where data was added
   */
  addCampaignRow(campaignData) {
    const nextRow = this.getNextEmptyRow();
    const rowData = [
      campaignData.Campaign_ID || '',
      campaignData.Partner_Name || '',
      campaignData.YouTube_URL || '',
      campaignData.Transcript_Raw || '',
      campaignData.Status || CONFIG.STATUSES.PENDING,
      campaignData.Output_Folder || '', // Output folder (empty initially)
      campaignData.Created_At || new Date() // Created at
    ];
    
    this.sheet.getRange(nextRow, 1, 1, rowData.length).setValues([rowData]);
    return nextRow;
  }
  
  /**
   * Find row by campaign ID
   * @param {string} campaignId - Campaign ID to search for
   * @returns {number|null} Row number or null if not found
   */
  findRowByCampaignId(campaignId) {
    const campaignColumn = this.sheet.getRange('A:A').getValues();
    
    for (let i = 1; i < campaignColumn.length; i++) {
      if (campaignColumn[i][0] === campaignId) {
        return i + 1; // +1 because sheets are 1-indexed
      }
    }
    
    return null;
  }
  
  /**
   * Get all campaign data as array of objects
   * @returns {Array<Object>} Array of campaign objects
   */
  getAllCampaigns() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return []; // Only header row
    
    const data = this.sheet.getRange(2, 1, lastRow - 1, getAllColumnNames().length).getValues();
    const columnNames = getAllColumnNames();
    
    return data.map(row => {
      const campaign = {};
      columnNames.forEach((columnName, index) => {
        campaign[columnName] = row[index];
      });
      return campaign;
    });
  }
  
  /**
   * Clear all data rows (keep headers)
   */
  clearAllData() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow > 1) {
      this.sheet.deleteRows(2, lastRow - 1);
    }
  }
}
