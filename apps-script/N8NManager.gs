// Content Alchemist - N8N Manager
// Handles communication with N8N webhook

/**
 * N8N Manager Class
 * Manages communication with N8N workflow engine
 */
class N8NManager {
  
  constructor() {
    this.webhookUrl = CONFIG.N8N.WEBHOOK_URL;
    this.timeout = CONFIG.N8N.TIMEOUT;
    this.retryAttempts = CONFIG.N8N.RETRY_ATTEMPTS;
  }
  
  /**
   * Send campaign data to N8N
   * @param {Object} campaignData - Campaign data to send
   * @returns {Object} Result object with success status and data/error
   */
  sendCampaign(campaignData) {
    try {
      // Prepare payload for N8N
      const payload = this.preparePayload(campaignData);
      
      // Send to N8N with retry logic
      const result = this.sendWithRetry(payload);
      
      if (result.success) {
        console.log(`Campaign ${campaignData.Campaign_ID} sent to N8N successfully`);
      } else {
        console.error(`Failed to send campaign ${campaignData.Campaign_ID} to N8N:`, result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error in sendCampaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Prepare payload for N8N
   * @param {Object} campaignData - Campaign data to prepare
   * @returns {Object} Formatted payload for N8N
   */
  preparePayload(campaignData) {
    return {
      campaign_id: campaignData.Campaign_ID,
      partner_name: campaignData.Partner_Name,
      youtube_url: campaignData.YouTube_URL || '',
      transcript_raw: campaignData.Transcript_Raw,
      timestamp: new Date().toISOString(),
      source: 'google_sheets'
    };
  }
  
  /**
   * Send payload to N8N with retry logic
   * @param {Object} payload - Payload to send
   * @returns {Object} Result object
   */
  sendWithRetry(payload) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${this.retryAttempts} to send to N8N`);
        
        const result = this.sendRequest(payload);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
        
        // Wait before retry (exponential backoff)
        if (attempt < this.retryAttempts) {
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Waiting ${waitTime}ms before retry...`);
          Utilities.sleep(waitTime);
        }
        
      } catch (error) {
        lastError = error.message;
        console.error(`Attempt ${attempt} failed:`, error);
        
        // Wait before retry
        if (attempt < this.retryAttempts) {
          const waitTime = Math.pow(2, attempt) * 1000;
          Utilities.sleep(waitTime);
        }
      }
    }
    
    return {
      success: false,
      error: `All ${this.retryAttempts} attempts failed. Last error: ${lastError}`
    };
  }
  
  /**
   * Send HTTP request to N8N
   * @param {Object} payload - Payload to send
   * @returns {Object} Result object
   */
  sendRequest(payload) {
    try {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Content-Alchemist-AppsScript/1.0'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
        timeout: this.timeout
      };
      
      console.log('Sending payload to N8N:', JSON.stringify(payload, null, 2));
      
      const response = UrlFetchApp.fetch(this.webhookUrl, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      console.log(`N8N response: ${responseCode} - ${responseText}`);
      
      if (responseCode === 200) {
        try {
          const responseData = JSON.parse(responseText);
          return {
            success: true,
            data: responseData,
            responseCode: responseCode
          };
        } catch (parseError) {
          return {
            success: true,
            data: responseText,
            responseCode: responseCode
          };
        }
      } else {
        return {
          success: false,
          error: `HTTP ${responseCode}: ${responseText}`,
          responseCode: responseCode
        };
      }
      
    } catch (error) {
      console.error('Error in sendRequest:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Test connection to N8N
   * @returns {Object} Test result
   */
  testConnection() {
    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Connection test from Content Alchemist Apps Script'
      };
      
      const result = this.sendRequest(testPayload);
      
      if (result.success) {
        return {
          success: true,
          message: 'N8N connection successful',
          response: result.data
        };
      } else {
        return {
          success: false,
          error: result.error,
          responseCode: result.responseCode
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get N8N webhook status
   * @returns {Object} Status information
   */
  getWebhookStatus() {
    try {
      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'Content-Alchemist-AppsScript/1.0'
        },
        muteHttpExceptions: true,
        timeout: 10000 // 10 seconds for status check
      };
      
      const response = UrlFetchApp.fetch(this.webhookUrl, options);
      const responseCode = response.getResponseCode();
      
      return {
        url: this.webhookUrl,
        accessible: responseCode < 400,
        responseCode: responseCode,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        url: this.webhookUrl,
        accessible: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Update webhook URL
   * @param {string} newUrl - New webhook URL
   */
  updateWebhookUrl(newUrl) {
    if (!newUrl || typeof newUrl !== 'string') {
      throw new Error('Invalid webhook URL provided');
    }
    
    // Basic URL validation
    try {
      new URL(newUrl);
    } catch (error) {
      throw new Error('Invalid URL format');
    }
    
    this.webhookUrl = newUrl;
    console.log(`Webhook URL updated to: ${newUrl}`);
  }
  
  /**
   * Get current webhook URL
   * @returns {string} Current webhook URL
   */
  getWebhookUrl() {
    return this.webhookUrl;
  }
}
