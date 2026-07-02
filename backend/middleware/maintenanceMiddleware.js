import Settings from '../models/settingsModel.js';

// @desc    Check if maintenance mode is enabled
// @access  Applied to all routes except settings and admin dashboard
const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Skip maintenance check for:
    // 1. Settings endpoint (so admin can disable maintenance mode)
    // 2. Admin dashboard (so admin can access to disable maintenance)
    // 3. SuperAdmin users (always have access)
    // 4. GET requests to /api/settings (public endpoint to check status)
    
    const skipPaths = ['/api/settings', '/api/admin/dashboard'];
    const isSkipPath = skipPaths.some(path => req.path.startsWith(path));
    
    if (isSkipPath) {
     return next();
    }
    
    // Allow superAdmin to bypass maintenance mode
    if (req.user && req.user.role === 'superAdmin') {
      return next();
    }
    
    // Check maintenance mode status
    const settings = await Settings.findOne();
    
    if (settings && settings.maintenanceMode) {
      return res.status(503).json({ 
        message: 'System under maintenance',
        maintenanceMode: true,
        details: 'The system is currently under maintenance. Please try again later.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Maintenance mode check error:', error);
    // If settings check fails, allow request to proceed (fail-open)
    next();
  }
};

export { checkMaintenanceMode };
