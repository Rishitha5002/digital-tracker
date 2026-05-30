// Date and time formatting utilities
export const formatters = {
  // Format date to readable string
  formatDate: (date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Format time to readable string
  formatTime: (date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Format date and time together
  formatDateTime: (date) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Format duration in seconds to readable format
  formatDuration: (seconds) => {
    if (!seconds || seconds === 0) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return '< 1 min';
    }
  },

  // Format distance in meters to readable format
  formatDistance: (meters) => {
    if (!meters || meters === 0) return '0 km';
    
    const km = meters / 1000;
    if (km >= 1) {
      return `${km.toFixed(2)} km`;
    } else {
      return `${meters.toFixed(0)} m`;
    }
  },

  // Check if trip is active
  isTripActive: (trip) => {
    return trip && trip.status === 'active';
  },

  // Get trip status color
  getTripStatusColor: (status) => {
    switch (status) {
      case 'active':
        return '#3B82F6'; // blue
      case 'completed':
        return '#10B981'; // green
      default:
        return '#6B7280'; // gray
    }
  },

  // Get trip status text
  getTripStatusText: (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  },
};

export default formatters;
