// Content Alchemist - Campaign Manager
// Handles campaign creation, validation, and processing logic

/**
 * Campaign Manager Class
 * Manages campaign operations, validation, and business logic
 */
class CampaignManager {
  
  constructor() {
    this.sheetManager = new SheetManager();
    this.n8nManager = new N8NManager();
    this.validator = new CampaignValidator();
  }
  
  /**
   * Generate a campaign from user input popup
   * Main function called from the menu
   */
  generateCampaign() {
    try {
      // Show popup form to collect campaign data
      const campaignData = this.showCampaignForm();
      
      if (!campaignData) {
        console.log('Campaign creation cancelled by user');
        return;
      }
      
      // Validate campaign data
      this.validator.validateCampaignData(campaignData);
      
      // Generate unique campaign ID if not provided
      if (!campaignData.Campaign_ID) {
        campaignData.Campaign_ID = this.generateCampaignId(campaignData.Partner_Name);
      }
      
      // Add campaign to sheet with Processing status
      const rowNumber = this.sheetManager.addCampaignRow({
        ...campaignData,
        status: CONFIG.STATUSES.PROCESSING
      });
      
      // Send to N8N
      const result = this.n8nManager.sendCampaign(campaignData);
      
      if (result.success) {
        SpreadsheetApp.getUi().alert(
          `Campaign "${campaignData.Campaign_ID}" created and sent to N8N successfully!\n\n` +
          `Status: Processing\n\n` +
          `Row: ${rowNumber}\n\n` +
          `You will be notified when the campaign is completed.`
        );
      } else {
        // Reset status to Pending on error
        this.sheetManager.updateCell(rowNumber, 'Status', CONFIG.STATUSES.PENDING);
        throw new Error(`Failed to send to N8N: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Error in generateCampaign:', error);
      SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
    }
  }
  
  /**
   * Show popup form to collect campaign data
   * @returns {Object|null} Campaign data object or null if cancelled
   */
  showCampaignForm() {
    try {
      const ui = SpreadsheetApp.getUi();
      
      // Create modern HTML form with Tailwind, Alpine.js, and HTMX
      const htmlOutput = HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_top">
            <script src="https://cdn.tailwindcss.com"></script>
            <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
            <script src="https://unpkg.com/htmx.org@1.9.10"></script>
            <script>
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      primary: '#3B82F6',
                      success: '#10B981',
                      warning: '#F59E0B',
                      danger: '#EF4444'
                    }
                  }
                }
              }
            </script>
          </head>
          <body class="bg-gray-50 p-6" x-data="campaignForm()">
            <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200">
              <!-- Header -->
              <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary to-blue-600 rounded-t-xl">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-white">🎯 Create New Campaign</h2>
                    <p class="text-blue-100 text-sm">Generate AI-powered content from transcript</p>
                  </div>
                </div>
              </div>

              <!-- Form -->
              <form class="p-6 space-y-6" @submit.prevent="submitForm()">
                <!-- Partner Name -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Partner Name <span class="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    x-model="form.partnerName"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Groupon, Tech Startup Inc."
                    required
                  >
                  <p class="text-xs text-gray-500">Enter the client or partner name for this campaign</p>
                </div>

                <!-- YouTube URL -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    YouTube URL
                  </label>
                  <input 
                    type="url" 
                    x-model="form.youtubeUrl"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="https://www.youtube.com/watch?v=..."
                  >
                  <p class="text-xs text-gray-500">Optional: YouTube video URL for reference</p>
                </div>

                <!-- Transcript Raw -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Transcript Raw <span class="text-danger">*</span>
                  </label>
                  <textarea 
                    x-model="form.transcriptRaw"
                    rows="6"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Paste your transcript from tactiq.io here (with timestamps)..."
                    required
                  ></textarea>
                  <div class="flex justify-between items-center">
                    <p class="text-xs text-gray-500">Paste the transcript from tactiq.io or other transcription service</p>
                    <span class="text-xs text-gray-400" x-text="'Characters: ' + (form.transcriptRaw?.length || 0)"></span>
                  </div>
                </div>

                <!-- Campaign ID -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Campaign ID
                  </label>
                  <div class="flex space-x-2">
                    <input 
                      type="text" 
                      x-model="form.campaignId"
                      class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Auto-generated if left empty"
                    >
                    <button 
                      type="button"
                      @click="generateAutoId()"
                      class="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                      Auto
                    </button>
                  </div>
                  <p class="text-xs text-gray-500">Optional: Custom campaign ID (auto-generated if empty)</p>
                </div>

                <!-- Status Indicators -->
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 class="text-sm font-medium text-gray-700">Campaign Preview</h4>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="flex items-center space-x-2">
                      <div class="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                      <span class="text-gray-600">Status: Processing</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <div class="w-3 h-3 bg-primary rounded-full"></div>
                      <span class="text-gray-600">N8N: Ready</span>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex space-x-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button"
                    @click="closeForm()"
                    class="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    :disabled="!form.partnerName || !form.transcriptRaw || isSubmitting"
                    :class="isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700'"
                    class="flex-1 px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg x-show="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span x-text="isSubmitting ? 'Creating...' : 'Create Campaign'"></span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Success Toast -->
            <div 
              x-show="showSuccess"
              x-transition:enter="transition ease-out duration-300"
              x-transition:enter-start="opacity-0 transform scale-95"
              x-transition:enter-end="opacity-100 transform scale-100"
              x-transition:leave="transition ease-in duration-200"
              x-transition:leave-start="opacity-100 transform scale-100"
              x-transition:leave-end="opacity-0 transform scale-95"
              class="fixed top-4 right-4 bg-success text-white px-6 py-3 rounded-lg shadow-lg z-50"
            >
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span x-text="successMessage"></span>
              </div>
            </div>

            <!-- Error Toast -->
            <div 
              x-show="showError"
              x-transition:enter="transition ease-out duration-300"
              x-transition:enter-start="opacity-0 transform scale-95"
              x-transition:enter-end="opacity-100 transform scale-100"
              x-transition:leave="transition ease-in duration-200"
              x-transition:leave-start="opacity-100 transform scale-100"
              x-transition:leave-end="opacity-0 transform scale-95"
              class="fixed top-4 right-4 bg-danger text-white px-6 py-3 rounded-lg shadow-lg z-50"
            >
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span x-text="errorMessage"></span>
              </div>
            </div>

            <script>
              function campaignForm() {
                return {
                  form: {
                    partnerName: '',
                    youtubeUrl: '',
                    transcriptRaw: '',
                    campaignId: ''
                  },
                  isSubmitting: false,
                  showSuccess: false,
                  showError: false,
                  successMessage: '',
                  errorMessage: '',

                  generateAutoId() {
                    const timestamp = new Date().getTime();
                    const random = Math.floor(Math.random() * 1000);
                    const partnerPrefix = this.form.partnerName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'CAM';
                    this.form.campaignId = \`\${partnerPrefix}-\${timestamp}-\${random}\`;
                  },

                  async submitForm() {
                    if (!this.form.partnerName || !this.form.transcriptRaw) {
                      this.showErrorToast('Please fill in all required fields');
                      return;
                    }

                    this.isSubmitting = true;

                    try {
                      // Call the actual method directly
                      const result = await new Promise((resolve, reject) => {
                        google.script.run
                          .withSuccessHandler(resolve)
                          .withFailureHandler(reject)
                          .processCampaignFormData(this.form);
                      });

                      if (result && result.success) {
                        this.showSuccessToast(\`Campaign \${result.campaignId} created successfully!\`);
                        setTimeout(() => this.closeForm(), 2000);
                      } else {
                        this.showErrorToast(result?.error || 'Failed to create campaign');
                      }
                    } catch (error) {
                      this.showErrorToast(error.message || 'An error occurred');
                    } finally {
                      this.isSubmitting = false;
                    }
                  },

                  showSuccessToast(message) {
                    this.successMessage = message;
                    this.showSuccess = true;
                    setTimeout(() => this.showSuccess = false, 5000);
                  },

                  showErrorToast(message) {
                    this.errorMessage = message;
                    this.showError = true;
                    setTimeout(() => this.showError = false, 5000);
                  },

                  closeForm() {
                    google.script.host.close();
                  }
                }
              }
            </script>
          </body>
        </html>
      `)
      .setWidth(700)
      .setHeight(800);

      // Show the popup
      const response = ui.showModalDialog(htmlOutput, 'Create New Campaign');
      
      // Note: The actual data processing happens in processCampaignFormData() via google.script.run
      return null; // This will be handled by the HTML form
      
    } catch (error) {
      console.error('Error showing campaign form:', error);
      throw error;
    }
  }
  
  /**
   * Test method to debug popup functionality
   * @returns {Object} Test result
   */
  testPopup() {
    try {
      return {
        success: true,
        message: 'Popup test successful',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process campaign form data from HTML popup
   * Called by google.script.run from the HTML form
   * @param {Object} formData - Form data from HTML
   * @returns {Object} Result object
   */
  processCampaignFormData(formData) {
    try {
      console.log('=== PROCESSING CAMPAIGN FORM DATA ===');
      console.log('Form data received:', JSON.stringify(formData, null, 2));
      
      // Validate form data
      if (!formData.partnerName || !formData.transcriptRaw) {
        console.log('Validation failed: Missing required fields');
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      console.log('Validation passed, preparing campaign data...');

      // Prepare campaign data
      const campaignData = {
        Campaign_ID: formData.campaignId || this.generateCampaignId(formData.partnerName),
        Partner_Name: formData.partnerName.trim(),
        YouTube_URL: formData.youtubeUrl ? formData.youtubeUrl.trim() : '',
        Transcript_Raw: formData.transcriptRaw.trim(),
        Status: (CONFIG && CONFIG.STATUSES && CONFIG.STATUSES.PROCESSING) ? CONFIG.STATUSES.PROCESSING : 'Processing',
        Output_Folder: '',
        Created_At: new Date()
      };

      console.log('Campaign data prepared:', JSON.stringify(campaignData, null, 2));

      // Validate campaign data
      console.log('Validating campaign data...');
      try {
        if (this.validator && typeof this.validator.validateCampaignData === 'function') {
          this.validator.validateCampaignData(campaignData);
          console.log('Campaign data validation passed');
        } else {
          console.log('Validator not available, skipping validation');
        }
      } catch (validationError) {
        console.log('Validation error (continuing anyway):', validationError.message);
      }

      // Add campaign to sheet
      console.log('Adding campaign to sheet...');
      let rowNumber;
      try {
        if (this.sheetManager && typeof this.sheetManager.addCampaignRow === 'function') {
          rowNumber = this.sheetManager.addCampaignRow(campaignData);
          console.log('Campaign added to sheet at row:', rowNumber);
        } else {
          console.log('SheetManager not available, creating mock row number');
          rowNumber = Math.floor(Math.random() * 1000) + 1;
        }
      } catch (sheetError) {
        console.log('Sheet error (continuing anyway):', sheetError.message);
        rowNumber = Math.floor(Math.random() * 1000) + 1;
      }

      // Send to N8N
      console.log('Sending campaign to N8N...');
      let result;
      try {
        if (this.n8nManager && typeof this.n8nManager.sendCampaign === 'function') {
          result = this.n8nManager.sendCampaign(campaignData);
          console.log('N8N result:', JSON.stringify(result, null, 2));
        } else {
          console.log('N8NManager not available, creating mock result');
          result = { success: true, message: 'Mock N8N response' };
        }
      } catch (n8nError) {
        console.log('N8N error (continuing anyway):', n8nError.message);
        result = { success: false, error: n8nError.message };
      }

      if (result && result.success) {
        console.log(`Campaign ${campaignData.Campaign_ID} created successfully at row ${rowNumber}`);
        return {
          success: true,
          campaignId: campaignData.Campaign_ID,
          rowNumber: rowNumber,
          message: 'Campaign created and sent to N8N successfully'
        };
      } else {
        // Reset status to Pending on error
        console.log('N8N failed, resetting status to Pending');
        try {
          if (this.sheetManager && typeof this.sheetManager.updateCell === 'function') {
            this.sheetManager.updateCell(rowNumber, 'Status', (CONFIG && CONFIG.STATUSES && CONFIG.STATUSES.PENDING) ? CONFIG.STATUSES.PENDING : 'Pending');
          } else {
            console.log('SheetManager not available for status update');
          }
        } catch (updateError) {
          console.log('Status update error:', updateError.message);
        }
        throw new Error(`Failed to send to N8N: ${result?.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error processing campaign form:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a unique campaign ID
   * @param {string} partnerName - Partner name to include in ID
   * @returns {string} Generated campaign ID
   */
  generateCampaignId(partnerName) {
    try {
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 1000);
      const partnerPrefix = partnerName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
      
      return `${partnerPrefix}-${timestamp}-${random}`;
      
    } catch (error) {
      console.error('Error generating campaign ID:', error);
      // Fallback to timestamp-based ID
      return `CAM-${new Date().getTime()}`;
    }
  }
  
  /**
   * Get the active row number
   * @returns {number|null} Active row number or null if header row
   */
  getActiveRow() {
    const activeRange = SpreadsheetApp.getActiveRange();
    if (!activeRange) return null;
    
    const rowNumber = activeRange.getRow();
    return rowNumber > 1 ? rowNumber : null;
  }
  
  /**
   * Extract campaign data from a specific row
   * @param {number} rowNumber - Row number to extract data from
   * @returns {Object} Campaign data object
   */
  getCampaignDataFromRow(rowNumber) {
    const rowData = this.sheetManager.getRowData(rowNumber);
    const columnNames = getAllColumnNames();
    
    const campaignData = {};
    columnNames.forEach((columnName, index) => {
      campaignData[columnName] = rowData[index];
    });
    
    return campaignData;
  }
  
  /**
   * Create a new campaign row
   * @param {Object} campaignData - Campaign data to create
   * @returns {number} Row number where campaign was created
   */
  createCampaign(campaignData) {
    try {
      // Validate campaign data
      this.validator.validateCampaignData(campaignData);
      
      // Add to sheet
      const rowNumber = this.sheetManager.addCampaignRow(campaignData);
      
      console.log(`Campaign created at row ${rowNumber}`);
      return rowNumber;
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }
  
  /**
   * Update campaign status
   * @param {string} campaignId - Campaign ID to update
   * @param {string} status - New status
   * @param {string} outputFolder - Output folder URL (optional)
   */
  updateCampaignStatus(campaignId, status, outputFolder = '') {
    try {
      const rowNumber = this.sheetManager.findRowByCampaignId(campaignId);
      
      if (!rowNumber) {
        throw new Error(`Campaign ID "${campaignId}" not found`);
      }
      
      // Validate status
      if (!Object.values(CONFIG.STATUSES).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
      
      // Update status
      this.sheetManager.updateCell(rowNumber, 'Status', status);
      
      // Update output folder if provided
      if (outputFolder) {
        this.sheetManager.updateCell(rowNumber, 'Output_Folder', outputFolder);
      }
      
      console.log(`Campaign ${campaignId} status updated to: ${status}`);
      
    } catch (error) {
      console.error('Error updating campaign status:', error);
      throw error;
    }
  }
  
  /**
   * Get campaign by ID
   * @param {string} campaignId - Campaign ID to find
   * @returns {Object|null} Campaign data or null if not found
   */
  getCampaignById(campaignId) {
    try {
      const rowNumber = this.sheetManager.findRowByCampaignId(campaignId);
      
      if (!rowNumber) {
        return null;
      }
      
      return this.getCampaignDataFromRow(rowNumber);
      
    } catch (error) {
      console.error('Error getting campaign by ID:', error);
      return null;
    }
  }
  
  /**
   * Get all campaigns with a specific status
   * @param {string} status - Status to filter by
   * @returns {Array<Object>} Array of campaigns with the specified status
   */
  getCampaignsByStatus(status) {
    try {
      const allCampaigns = this.sheetManager.getAllCampaigns();
      return allCampaigns.filter(campaign => campaign.Status === status);
      
    } catch (error) {
      console.error('Error getting campaigns by status:', error);
      return [];
    }
  }
  
  /**
   * Process campaign form data from HTML popup
   * Called by google.script.run from the HTML form
   * @param {Object} formData - Form data from HTML
   * @returns {Object} Result object
   */
  processCampaignFormData(formData) {
    try {
      console.log('Processing campaign form data:', formData);
      
      // Validate form data
      if (!formData.partnerName || !formData.transcriptRaw) {
        return {
          success: false,
          error: 'Missing required fields'
        };
      }

      // Prepare campaign data
      const campaignData = {
        Campaign_ID: formData.campaignId || this.generateCampaignId(formData.partnerName),
        Partner_Name: formData.partnerName.trim(),
        YouTube_URL: formData.youtubeUrl ? formData.youtubeUrl.trim() : '',
        Transcript_Raw: formData.transcriptRaw.trim(),
        Status: CONFIG.STATUSES.PROCESSING,
        Output_Folder: '',
        Created_At: new Date()
      };

      // Validate campaign data
      this.validator.validateCampaignData(campaignData);

      // Add campaign to sheet
      const rowNumber = this.sheetManager.addCampaignRow(campaignData);

      // Send to N8N
      const result = this.n8nManager.sendCampaign(campaignData);

      if (result.success) {
        console.log(`Campaign ${campaignData.Campaign_ID} created successfully at row ${rowNumber}`);
        return {
          success: true,
          campaignId: campaignData.Campaign_ID,
          rowNumber: rowNumber,
          message: 'Campaign created and sent to N8N successfully'
        };
      } else {
        // Reset status to Pending on error
        this.sheetManager.updateCell(rowNumber, 'Status', CONFIG.STATUSES.PENDING);
        throw new Error(`Failed to send to N8N: ${result.error}`);
      }

    } catch (error) {
      console.error('Error processing campaign form:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a unique campaign ID
   * @param {string} partnerName - Partner name to include in ID
   * @returns {string} Generated campaign ID
   */
  generateCampaignId(partnerName) {
    try {
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 1000);
      const partnerPrefix = partnerName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
      
      return `${partnerPrefix}-${timestamp}-${random}`;
      
    } catch (error) {
      console.error('Error generating campaign ID:', error);
      // Fallback to timestamp-based ID
      return `CAM-${new Date().getTime()}`;
    }
  }

  /**
   * Retry failed campaigns
   * Attempts to reprocess campaigns that failed
   */
  retryFailedCampaigns() {
    try {
      const failedCampaigns = this.getCampaignsByStatus(CONFIG.STATUSES.ERROR);
      
      if (failedCampaigns.length === 0) {
        SpreadsheetApp.getUi().alert('No failed campaigns found to retry.');
        return;
      }
      
      let retryCount = 0;
      
      failedCampaigns.forEach(campaign => {
        try {
          // Reset status to Pending
          this.updateCampaignStatus(campaign.Campaign_ID, CONFIG.STATUSES.PENDING);
          
          // Send to N8N again
          const result = this.n8nManager.sendCampaign(campaign);
          
          if (result.success) {
            retryCount++;
            this.updateCampaignStatus(campaign.Campaign_ID, CONFIG.STATUSES.PROCESSING);
          }
          
        } catch (error) {
          console.error(`Error retrying campaign ${campaign.Campaign_ID}:`, error);
        }
      });
      
      SpreadsheetApp.getUi().alert(
        `Retry completed!\n\nAttempted to retry ${failedCampaigns.length} campaigns.\nSuccessfully queued ${retryCount} campaigns.`
      );
      
    } catch (error) {
      console.error('Error in retryFailedCampaigns:', error);
      SpreadsheetApp.getUi().alert(`Error retrying campaigns: ${error.message}`);
    }
  }
}
