// Content Alchemist - Status Manager
// Handles campaign status management and refresh operations

/**
 * Status Manager Class
 * Manages campaign statuses and provides status refresh functionality
 */
class StatusManager {
  
  constructor() {
    this.sheetManager = new SheetManager();
    this.n8nManager = new N8NManager();
  }
  
  /**
   * Refresh all campaign statuses
   * Updates statuses for campaigns that might be stale
   */
  refreshAllStatuses() {
    try {
      console.log('Starting status refresh for all campaigns...');
      
      const allCampaigns = this.sheetManager.getAllCampaigns();
      let updatedCount = 0;
      let errorCount = 0;
      
      if (allCampaigns.length === 0) {
        SpreadsheetApp.getUi().alert('No campaigns found to refresh.');
        return;
      }
      
      // Process each campaign
      allCampaigns.forEach((campaign, index) => {
        try {
          const result = this.refreshCampaignStatus(campaign);
          if (result.updated) {
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error refreshing campaign ${campaign.Campaign_ID}:`, error);
          errorCount++;
        }
        
        // Add small delay to avoid overwhelming the system
        if (index < allCampaigns.length - 1) {
          Utilities.sleep(100);
        }
      });
      
      // Show results
      const message = `Status refresh completed!\n\n` +
                     `Total campaigns: ${allCampaigns.length}\n` +
                     `Updated: ${updatedCount}\n` +
                     `Errors: ${errorCount}`;
      
      SpreadsheetApp.getUi().alert(message);
      
    } catch (error) {
      console.error('Error in refreshAllStatuses:', error);
      SpreadsheetApp.getUi().alert(`Error refreshing statuses: ${error.message}`);
    }
  }
  
  /**
   * Refresh status for a specific campaign
   * @param {Object} campaign - Campaign object
   * @returns {Object} Refresh result
   */
  refreshCampaignStatus(campaign) {
    try {
      const campaignId = campaign.Campaign_ID;
      const currentStatus = campaign.Status;
      
      console.log(`Refreshing status for campaign ${campaignId} (current: ${currentStatus})`);
      
      // Skip campaigns that are already completed or in error state
      if (currentStatus === CONFIG.STATUSES.COMPLETED || currentStatus === CONFIG.STATUSES.ERROR) {
        return {
          campaignId: campaignId,
          updated: false,
          reason: 'Status is final (Completed/Error)'
        };
      }
      
      // Check if campaign is stuck in Processing for too long
      if (currentStatus === CONFIG.STATUSES.PROCESSING) {
        const isStuck = this.isCampaignStuck(campaign);
        if (isStuck) {
          console.log(`Campaign ${campaignId} appears to be stuck, resetting to Pending`);
          this.sheetManager.updateCell(
            this.sheetManager.findRowByCampaignId(campaignId),
            'Status',
            CONFIG.STATUSES.PENDING
          );
          
          return {
            campaignId: campaignId,
            updated: true,
            reason: 'Reset stuck Processing status to Pending'
          };
        }
      }
      
      // For Pending campaigns, check if they should be retried
      if (currentStatus === CONFIG.STATUSES.PENDING) {
        const shouldRetry = this.shouldRetryCampaign(campaign);
        if (shouldRetry) {
          console.log(`Campaign ${campaignId} eligible for retry`);
          // Note: Actual retry logic is handled by CampaignManager.retryFailedCampaigns()
        }
      }
      
      return {
        campaignId: campaignId,
        updated: false,
        reason: 'No status update needed'
      };
      
    } catch (error) {
      console.error(`Error refreshing campaign ${campaign.Campaign_ID}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if a campaign is stuck in Processing status
   * @param {Object} campaign - Campaign object
   * @returns {boolean} True if campaign appears stuck
   */
  isCampaignStuck(campaign) {
    try {
      if (campaign.Status !== CONFIG.STATUSES.PROCESSING) {
        return false;
      }
      
      // Check if campaign has been in Processing for more than 30 minutes
      if (campaign.Created_At) {
        const createdTime = new Date(campaign.Created_At);
        const currentTime = new Date();
        const timeDiff = currentTime - createdTime;
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (timeDiff > thirtyMinutes) {
          console.log(`Campaign ${campaign.Campaign_ID} has been Processing for ${Math.round(timeDiff / 60000)} minutes`);
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('Error checking if campaign is stuck:', error);
      return false;
    }
  }
  
  /**
   * Check if a campaign should be retried
   * @param {Object} campaign - Campaign object
   * @returns {boolean} True if campaign should be retried
   */
  shouldRetryCampaign(campaign) {
    try {
      if (campaign.Status !== CONFIG.STATUSES.PENDING) {
        return false;
      }
      
      // Check if campaign has been Pending for more than 1 hour
      if (campaign.Created_At) {
        const createdTime = new Date(campaign.Created_At);
        const currentTime = new Date();
        const timeDiff = currentTime - createdTime;
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (timeDiff > oneHour) {
          console.log(`Campaign ${campaign.Campaign_ID} has been Pending for ${Math.round(timeDiff / 60000)} minutes`);
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('Error checking if campaign should be retried:', error);
      return false;
    }
  }
  
  /**
   * Get status summary for all campaigns
   * @returns {Object} Status summary
   */
  getStatusSummary() {
    try {
      const allCampaigns = this.sheetManager.getAllCampaigns();
      
      const summary = {
        total: allCampaigns.length,
        by_status: {},
        processing_time: {},
        last_activity: null
      };
      
      // Initialize status counters
      Object.values(CONFIG.STATUSES).forEach(status => {
        summary.by_status[status] = 0;
      });
      
      // Count campaigns by status and calculate processing times
      allCampaigns.forEach(campaign => {
        const status = campaign.Status || 'Unknown';
        summary.by_status[status] = (summary.by_status[status] || 0) + 1;
        
        // Calculate processing time for Processing campaigns
        if (status === CONFIG.STATUSES.PROCESSING && campaign.Created_At) {
          const createdTime = new Date(campaign.Created_At);
          const currentTime = new Date();
          const processingTime = Math.round((currentTime - createdTime) / 60000); // minutes
          
          if (!summary.processing_time[campaign.Campaign_ID]) {
            summary.processing_time[campaign.Campaign_ID] = processingTime;
          }
        }
        
        // Track last activity
        if (campaign.Created_At) {
          const campaignDate = new Date(campaign.Created_At);
          if (!summary.last_activity || campaignDate > summary.last_activity) {
            summary.last_activity = campaignDate;
          }
        }
      });
      
      return summary;
      
    } catch (error) {
      console.error('Error getting status summary:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Clean up old completed campaigns
   * Optionally archive or remove very old completed campaigns
   * @param {number} daysOld - Number of days old to consider for cleanup
   */
  cleanupOldCampaigns(daysOld = 30) {
    try {
      console.log(`Starting cleanup of campaigns older than ${daysOld} days...`);
      
      const allCampaigns = this.sheetManager.getAllCampaigns();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let cleanedCount = 0;
      
      allCampaigns.forEach(campaign => {
        if (campaign.Status === CONFIG.STATUSES.COMPLETED && campaign.Created_At) {
          const createdDate = new Date(campaign.Created_At);
          
          if (createdDate < cutoffDate) {
            console.log(`Marking old completed campaign ${campaign.Campaign_ID} for cleanup`);
            // For now, just log. In the future, could move to archive sheet or delete
            cleanedCount++;
          }
        }
      });
      
      console.log(`Cleanup completed. Found ${cleanedCount} old campaigns.`);
      return cleanedCount;
      
    } catch (error) {
      console.error('Error in cleanupOldCampaigns:', error);
      throw error;
    }
  }
  
  /**
   * Export status report
   * @returns {string} CSV formatted status report
   */
  exportStatusReport() {
    try {
      const allCampaigns = this.sheetManager.getAllCampaigns();
      const columnNames = getAllColumnNames();
      
      // Create CSV header
      let csv = columnNames.join(',') + '\n';
      
      // Add data rows
      allCampaigns.forEach(campaign => {
        const row = columnNames.map(columnName => {
          const value = campaign[columnName];
          // Escape commas and quotes for CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        csv += row.join(',') + '\n';
      });
      
      return csv;
      
    } catch (error) {
      console.error('Error exporting status report:', error);
      throw error;
    }
  }
}
