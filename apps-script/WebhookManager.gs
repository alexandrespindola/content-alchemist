// Content Alchemist - Webhook Manager
// Handles incoming webhooks from N8N

/**
 * Webhook Manager Class
 * Manages incoming webhook requests from N8N
 */
class WebhookManager {
  
  constructor() {
    this.campaignManager = new CampaignManager();
  }
  
  /**
   * Handle incoming webhook from N8N
   * @param {Object} e - Webhook event object
   * @returns {Object} Response object
   */
  handleWebhook(e) {
    try {
      console.log('Webhook received:', JSON.stringify(e, null, 2));
      
      // Parse webhook data
      const webhookData = this.parseWebhookData(e);
      
      if (!webhookData) {
        return this.createErrorResponse('Invalid webhook data format');
      }
      
      // Validate webhook data
      const validationResult = this.validateWebhookData(webhookData);
      if (!validationResult.valid) {
        return this.createErrorResponse(`Validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Process webhook based on type
      const result = this.processWebhook(webhookData);
      
      return this.createSuccessResponse(result);
      
    } catch (error) {
      console.error('Error handling webhook:', error);
      return this.createErrorResponse(`Webhook processing error: ${error.message}`);
    }
  }
  
  /**
   * Parse webhook data from event
   * @param {Object} e - Webhook event object
   * @returns {Object|null} Parsed webhook data or null if invalid
   */
  parseWebhookData(e) {
    try {
      if (!e || !e.postData || !e.postData.contents) {
        console.error('Invalid webhook event structure');
        return null;
      }
      
      const contents = e.postData.contents;
      let webhookData;
      
      try {
        webhookData = JSON.parse(contents);
      } catch (parseError) {
        console.error('Failed to parse webhook JSON:', parseError);
        return null;
      }
      
      return webhookData;
      
    } catch (error) {
      console.error('Error parsing webhook data:', error);
      return null;
    }
  }
  
  /**
   * Validate webhook data
   * @param {Object} webhookData - Webhook data to validate
   * @returns {Object} Validation result
   */
  validateWebhookData(webhookData) {
    const errors = [];
    
    // Check required fields
    if (!webhookData.campaign_id) {
      errors.push('campaign_id is required');
    }
    
    if (!webhookData.status) {
      errors.push('status is required');
    }
    
    // Validate status value
    if (webhookData.status && !Object.values(CONFIG.STATUSES).includes(webhookData.status)) {
      errors.push(`Invalid status: ${webhookData.status}`);
    }
    
    // Validate campaign_id format
    if (webhookData.campaign_id && typeof webhookData.campaign_id !== 'string') {
      errors.push('campaign_id must be a string');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * Process webhook based on data type
   * @param {Object} webhookData - Validated webhook data
   * @returns {Object} Processing result
   */
  processWebhook(webhookData) {
    try {
      const { campaign_id, status, output_folder, message, error_details } = webhookData;
      
      console.log(`Processing webhook for campaign ${campaign_id} with status ${status}`);
      
      // Update campaign status in sheet
      const updateResult = this.campaignManager.updateCampaignStatus(
        campaign_id, 
        status, 
        output_folder
      );
      
      if (!updateResult) {
        throw new Error(`Failed to update campaign ${campaign_id} status`);
      }
      
      // Log additional information if provided
      if (message) {
        console.log(`Campaign ${campaign_id} message: ${message}`);
      }
      
      if (error_details) {
        console.log(`Campaign ${campaign_id} error details: ${error_details}`);
      }
      
      return {
        campaign_id: campaign_id,
        status: status,
        updated: true,
        timestamp: new Date().toISOString(),
        message: `Campaign ${campaign_id} status updated to ${status}`
      };
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }
  
  /**
   * Create success response
   * @param {Object} data - Response data
   * @returns {Object} Success response object
   */
  createSuccessResponse(data) {
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Create error response
   * @param {string} error - Error message
   * @returns {Object} Error response object
   */
  createErrorResponse(error) {
    return {
      success: false,
      error: error,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Handle test webhook
   * @param {Object} webhookData - Test webhook data
   * @returns {Object} Test response
   */
  handleTestWebhook(webhookData) {
    console.log('Test webhook received:', webhookData);
    
    return {
      success: true,
      message: 'Test webhook received successfully',
      received_data: webhookData,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get webhook statistics
   * @returns {Object} Webhook statistics
   */
  getWebhookStats() {
    try {
      const allCampaigns = this.campaignManager.sheetManager.getAllCampaigns();
      
      const stats = {
        total_campaigns: allCampaigns.length,
        by_status: {},
        last_updated: null
      };
      
      // Count by status
      Object.values(CONFIG.STATUSES).forEach(status => {
        stats.by_status[status] = 0;
      });
      
      allCampaigns.forEach(campaign => {
        if (campaign.Status) {
          stats.by_status[campaign.Status] = (stats.by_status[campaign.Status] || 0) + 1;
        }
        
        // Track last update
        if (campaign.Created_At) {
          const campaignDate = new Date(campaign.Created_At);
          if (!stats.last_updated || campaignDate > stats.last_updated) {
            stats.last_updated = campaignDate;
          }
        }
      });
      
      return stats;
      
    } catch (error) {
      console.error('Error getting webhook stats:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
