import Settings from '../models/settingsModel.js';
import { createAuditLog } from '../utils/auditLogger.js';

// @desc    Get platform settings
// @route   GET /api/settings
// @access  Public (Only some fields)
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        etbUsdRate: Number(process.env.ETB_USD_RATE) || 150
      });
    } else if (!settings.etbUsdRate) {
      settings.etbUsdRate = Number(process.env.ETB_USD_RATE) || 150;
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update platform settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({});
    }
    
    const updatedSettings = await Settings.findByIdAndUpdate(
      settings._id,
      req.body,
      { new: true, runValidators: true }
    );
    
    await createAuditLog(req.user._id, 'Update Platform Settings', 'settings', settings._id, req.body);
    
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
