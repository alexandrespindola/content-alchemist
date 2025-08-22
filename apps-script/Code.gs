// Content Alchemist - Main Entry Point
// Main orchestration file for the Content Alchemist system

/**
 * Main entry point when spreadsheet is opened
 * Sets up the custom menu and initializes the system
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("Content Alchemist")
      .addItem("Generate Campaign", "generateCampaign")
      .addItem("Test Popup", "testPopup")
      .addItem("Refresh Status", "refreshStatus")
      .addSeparator()
      .addItem("Setup Sheet", "setupSheet")
      .addItem("Test N8N Connection", "testN8NConnection")
      .addToUi();

    console.log("Content Alchemist menu created successfully");
  } catch (error) {
    console.error("Error creating menu:", error);
  }
}

/**
 * Test popup functionality
 * Tests if the popup can communicate with Apps Script
 */
function testPopup() {
  try {
    const campaignManager = new CampaignManager();
    const result = campaignManager.testPopup();
    
    if (result.success) {
      SpreadsheetApp.getUi().alert("Popup test successful!\n\n" + result.message);
    } else {
      SpreadsheetApp.getUi().alert("Popup test failed: " + result.error);
    }
  } catch (error) {
    console.error("Error in testPopup:", error);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Main function to generate a campaign
 * Orchestrates the entire campaign generation process
 */
function generateCampaign() {
  try {
    const campaignManager = new CampaignManager();
    campaignManager.generateCampaign();
  } catch (error) {
    console.error("Error in generateCampaign:", error);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Refresh campaign statuses
 * Updates all campaign statuses from N8N
 */
function refreshStatus() {
  try {
    const statusManager = new StatusManager();
    statusManager.refreshAllStatuses();
  } catch (error) {
    console.error("Error in refreshStatus:", error);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Setup the spreadsheet with proper headers and formatting
 * Should be run once when creating a new sheet
 */
function setupSheet() {
  try {
    const sheetManager = new SheetManager();
    sheetManager.setupSheet();
    SpreadsheetApp.getUi().alert("Sheet setup completed successfully!");
  } catch (error) {
    console.error("Error in setupSheet:", error);
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
  }
}

/**
 * Test N8N webhook connection
 * Verifies if the webhook is accessible and responding
 */
function testN8NConnection() {
  try {
    const n8nManager = new N8NManager();
    const result = n8nManager.testConnection();

    if (result.success) {
      SpreadsheetApp.getUi().alert("N8N connection successful!");
    } else {
      SpreadsheetApp.getUi().alert(`N8N connection failed: ${result.error}`);
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Test failed: ${error.message}`);
  }
}

/**
 * Webhook endpoint for receiving updates from N8N
 * This function is called by N8N to update campaign status
 */
function doPost(e) {
  try {
    const webhookManager = new WebhookManager();
    const response = webhookManager.handleWebhook(e);

    return ContentService.createTextOutput(
      JSON.stringify(response)
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error in doPost:", error);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.message,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Process form data from the HTML popup (imperative version)
 * - Appends a row to the sheet
 * - Sets Status to Processing
 * - Triggers N8N webhook with partner_name, youtube_url, transcript_raw
 * Returns { success, campaignId, rowNumber, error? }
 */
function processCampaignFormData(formData) {
  try {
    const sheetName = (typeof CONFIG !== 'undefined' && CONFIG.SHEET_NAME) ? CONFIG.SHEET_NAME : 'Content Alchemist';
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }

    const partnerName = (formData && formData.partnerName || '').trim();
    const youtubeUrl = (formData && formData.youtubeUrl || '').trim();
    const transcriptRaw = (formData && formData.transcriptRaw || '').trim();
    const inputCampaignId = (formData && formData.campaignId || '').trim();

    if (!partnerName || !transcriptRaw) {
      return { success: false, error: 'Missing required fields: partnerName and transcriptRaw are required.' };
    }

    const statusProcessing = (typeof CONFIG !== 'undefined' && CONFIG.STATUSES && CONFIG.STATUSES.PROCESSING)
      ? CONFIG.STATUSES.PROCESSING
      : 'Processing';

    const campaignId = inputCampaignId || generateCampaignIdSimple(partnerName);

    const rowValues = [
      campaignId,                // A: Campaign_ID
      partnerName,               // B: Partner_Name
      youtubeUrl,                // C: YouTube_URL
      transcriptRaw,             // D: Transcript_Raw
      statusProcessing,          // E: Status
      '',                        // F: Output_Folder
      new Date()                 // G: Created_At
    ];

    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, rowValues.length).setValues([rowValues]);

    // Trigger webhook
    const webhookUrl = (typeof CONFIG !== 'undefined' && CONFIG.N8N && CONFIG.N8N.WEBHOOK_URL)
      ? CONFIG.N8N.WEBHOOK_URL
      : (PropertiesService.getScriptProperties().getProperty('N8N_WEBHOOK_URL') || '');

    if (webhookUrl) {
      const payload = {
        campaign_id: campaignId,
        partner_name: partnerName,
        youtube_url: youtubeUrl,
        transcript_raw: transcriptRaw
      };

      try {
        UrlFetchApp.fetch(webhookUrl, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
      } catch (err) {
        // Still return success for the sheet write; include warning
        return { success: true, campaignId: campaignId, rowNumber: nextRow, warning: 'Webhook failed: ' + err.message };
      }
    } else {
      // No webhook configured; return success for the sheet write
      return { success: true, campaignId: campaignId, rowNumber: nextRow, warning: 'Webhook URL not configured' };
    }

    return { success: true, campaignId: campaignId, rowNumber: nextRow };
  } catch (error) {
    console.error('processCampaignFormData error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Simple ID generator used by the imperative handler
 */
function generateCampaignIdSimple(partnerName) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  const prefix = (partnerName || 'CAM').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'CAM';
  return prefix + '-' + timestamp + '-' + random;
}
