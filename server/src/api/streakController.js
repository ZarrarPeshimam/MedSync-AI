import Medication from "../models/medicineModel.js";

/**
 * Calculates streak days based on medication adherence.
 * Fetches all medications for a user and determines the current streak 
 * of consecutive days where adherence met the required threshold.
 * * @param {Object} req - The Express request object containing `localuser` in body.
 * @param {Object} res - The Express response object used to send back the streak data.
 * @returns {Promise<Object>} JSON response with success status, streak count, and message.
 */
export const calculateStreakDays = async (req, res) => {
  try {
    const { localuser } = req.body;
    
    if (!localuser?.id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const userId = localuser.id;
    console.log("Calculating streak for user:", userId);

    // Get all medications for the user
    const medications = await Medication.find({ userId });
    
    if (medications.length === 0) {
      return res.status(200).json({ 
        success: true, 
        streakDays: 0, 
        message: "No medications found" 
      });
    }

    // Calculate streak based on adherence history
    const streakDays = calculateConsecutiveAdherenceDays(medications);
    
    return res.status(200).json({
      success: true,
      streakDays,
      message: `Streak calculated successfully: ${streakDays} days`
    });

  } catch (error) {
    console.error("Error calculating streak:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while calculating streak",
      error: error.message
    });
  }
};

/**
 * Helper function to calculate consecutive adherence days.
 * Groups adherence records by date and calculates the streak backwards from today.
 * A day is counted in the streak if adherence is >= 80%.
 * * @param {Array} medications - Array of medication objects containing adherence history.
 * @returns {number} The number of consecutive days the user has adhered to their medication.
 */
function calculateConsecutiveAdherenceDays(medications) {
  // Get all adherence records from all medications
  const allAdherenceRecords = [];
  
  medications.forEach(med => {
    if (med.adherenceHistory && med.adherenceHistory.length > 0) {
      med.adherenceHistory.forEach(record => {
        allAdherenceRecords.push({
          date: new Date(record.date),
          status: record.status,
          pillName: med.pillName
        });
      });
    }
  });

  if (allAdherenceRecords.length === 0) {
    return 0;
  }

  // Group records by date
  const dailyAdherence = {};
  
  allAdherenceRecords.forEach(record => {
    const dateStr = record.date.toISOString().split('T')[0];
    
    if (!dailyAdherence[dateStr]) {
      dailyAdherence[dateStr] = {
        total: 0,
        taken: 0,
        missed: 0,
        delayed: 0
      };
    }
    
    dailyAdherence[dateStr].total++;
    if (record.status === 'taken') {
      dailyAdherence[dateStr].taken++;
    } else if (record.status === 'missed') {
      dailyAdherence[dateStr].missed++;
    } else if (record.status === 'delayed') {
      dailyAdherence[dateStr].delayed++;
    }
  });

  // Convert to sorted array of dates
  const sortedDates = Object.keys(dailyAdherence)
    .sort((a, b) => new Date(b) - new Date(a)); // Most recent first

  if (sortedDates.length === 0) {
    return 0;
  }

  // Calculate streak from most recent date backwards
  let streakDays = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i];
    const recordDate = new Date(dateStr);
    recordDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
    
    // Skip future dates
    if (daysDiff < 0) continue;
    
    // If there's a gap in dates, break the streak
    if (i > 0 && daysDiff > streakDays) {
      break;
    }
    
    const dayData = dailyAdherence[dateStr];
    const adherenceRate = dayData.total > 0 ? (dayData.taken / dayData.total) : 0;
    
    // Consider a day successful if adherence rate is >= 80%
    if (adherenceRate >= 0.8) {
      streakDays = daysDiff + 1;
    } else {
      // If today's adherence is poor, break the streak
      if (daysDiff === 0) {
        streakDays = 0;
      }
      break;
    }
  }

  return streakDays;
}

/**
 * Gets detailed adherence statistics for analytics.
 * Calculates total days, perfect days, and average adherence percentage 
 * over a specified period (default 30 days).
 * * @param {Object} req - The Express request object. `req.body` should contain `localuser` and optionally `days`.
 * @param {Object} res - The Express response object used to return the stats.
 * @returns {Promise<Object>} JSON response containing the calculated statistics.
 */
export const getAdherenceStats = async (req, res) => {
  try {
    const { localuser, days = 30 } = req.body;
    
    if (!localuser?.id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const userId = localuser.id;
    const medications = await Medication.find({ userId });
    
    if (medications.length === 0) {
      return res.status(200).json({ 
        success: true, 
        stats: { totalDays: 0, perfectDays: 0, averageAdherence: 0 }
      });
    }

    // Calculate stats for the last N days
    const stats = calculateAdherenceStats(medications, days);
    
    return res.status(200).json({
      success: true,
      stats,
      message: `Adherence stats calculated for last ${days} days`
    });

  } catch (error) {
    console.error("Error calculating adherence stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while calculating stats",
      error: error.message
    });
  }
};

/**
 * Helper function to calculate detailed adherence statistics.
 * Filters adherence records within the date range and computes metrics.
 * * @param {Array} medications - Array of medication objects.
 * @param {number} days - Number of past days to include in the analysis.
 * @returns {Object} An object containing totalDays, perfectDays, averageAdherence, totalDoses, etc.
 */
function calculateAdherenceStats(medications, days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dailyAdherence = {};
  let totalDoses = 0;
  let takenDoses = 0;

  medications.forEach(med => {
    if (med.adherenceHistory && med.adherenceHistory.length > 0) {
      med.adherenceHistory.forEach(record => {
        const recordDate = new Date(record.date);
        
        if (recordDate >= startDate && recordDate <= endDate) {
          const dateStr = recordDate.toISOString().split('T')[0];
          
          if (!dailyAdherence[dateStr]) {
            dailyAdherence[dateStr] = { total: 0, taken: 0 };
          }
          
          dailyAdherence[dateStr].total++;
          totalDoses++;
          
          if (record.status === 'taken') {
            dailyAdherence[dateStr].taken++;
            takenDoses++;
          }
        }
      });
    }
  });

  const totalDays = Object.keys(dailyAdherence).length;
  const perfectDays = Object.values(dailyAdherence).filter(day => 
    day.total > 0 && day.taken === day.total
  ).length;
  
  const averageAdherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  return {
    totalDays,
    perfectDays,
    averageAdherence,
    totalDoses,
    takenDoses,
    missedDoses: totalDoses - takenDoses
  };
}
