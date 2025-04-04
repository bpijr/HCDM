// filepath: highlander-commons-menu/highlander-commons-menu/js/menuService.js

const PERIOD_IDS = {
    breakfast: '677e9d69351d53052c3f7604',
    lunch: '677e9d69351d53052c3f761e',
    dinner: '677e9d69351d53052c3f7638'
};

const LOCATION_ID = '615f4f93a9f13a32678e5feb';

// Format date as YYYY-M-D (the API doesn't require leading zeros)
function formatDate(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Fetch menu for a specific period
async function fetchMenu(periodId, date) {
    const formattedDate = formatDate(date);
    const url = `https://api.dineoncampus.com/v1/location/${LOCATION_ID}/periods/${periodId}?platform=0&date=${formattedDate}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch menu: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching menu: ${error.message}`);
        return null;
    }
}

// Export functions for use in other modules
export { fetchMenu, formatDate };