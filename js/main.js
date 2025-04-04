// This file contains the main JavaScript code for the Highlander Commons Daily Menu application.

const PERIOD_IDS = {
    breakfast: '677e9d69351d53052c3f7604',
    lunch: '677e9d69351d53052c3f761e',
    dinner: '677e9d69351d53052c3f7638'
};

const LOCATION_ID = '615f4f93a9f13a32678e5feb';

const appSettings = {
    showMacros: false,
    showAllergies: false
};

function formatDate(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

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

function formatNutrition(item) {
    if (!item.nutrients) return 'Nutrition info not available';
    
    const calories = item.nutrients.find(n => n.name === 'Calories')?.value || 'N/A';
    const servingSize = item.portion || 'N/A';
    
    let nutritionText = `Calories: ${calories} | Serving: ${servingSize}`;
    
    if (appSettings.showMacros) {
        var protein = item.nutrients.find(n => n.name === 'Protein (g)')?.value || 'N/A';
        var carbs = item.nutrients.find(n => n.name === 'Total Carbohydrates (g)')?.value || 'N/A';
        var fat = item.nutrients.find(n => n.name === 'Total Fat (g)')?.value || 'N/A';

        if (protein === 'less than 1 gram') protein = '<1';
        if (carbs === 'less than 1 gram') carbs = '<1';
        if (fat === 'less than 1 gram') fat = '<1';
        
        nutritionText += ` | Protein: ${protein}g | Carbs: ${carbs}g | Fat: ${fat}g`;
    }
    
    return nutritionText;
}

function formatMenuOutput(menuData, mealType) {
    if (!menuData || !menuData.menu || !menuData.menu.periods || menuData.menu.periods.length === 0) {
        return `No ${mealType} menu available for today.`;
    }
    
    let output = `=== ${mealType.toUpperCase()} ===\n\n`;
    
        const period = menuData.menu.periods;
    if (period && period.categories) {
        period.categories.forEach(category => {
            output += `## ${category.name}\n`;
            
            if (category.items && Array.isArray(category.items)) {
                category.items.forEach(item => {
                    output += `• ${item.name}\n`;
                    output += `  ${formatNutrition(item)}\n\n`;
                });
            }
        });
    } else {
        output += `Menu details unavailable\n`;
    }
    
    return output;
}

function generateMenuHTML(menuData, mealType) {
    if (!menuData || !menuData.menu || !menuData.menu.periods || menuData.menu.periods.length === 0) {
        return `<div class="menu-container">
            <h2>${mealType.toUpperCase()}</h2>
            <p>No menu available for today.</p>
        </div>`;
    }
    
    let html = `<div class="menu-container" id="${mealType.toLowerCase()}-menu">
        <h2>${mealType.toUpperCase()}</h2>`;
    
    // Check if periods[0] exists and has categories
    const period = menuData.menu.periods;
    if (period && period.categories) {
        period.categories.forEach((category, index) => {
            const categoryId = `${mealType.toLowerCase()}-category-${index}`;
            
            html += `
                <div class="category-container">
                    <h3 class="category-header" data-target="${categoryId}">
                        ${category.name}
                        <span class="collapse-icon">−</span>
                    </h3>
                    <div id="${categoryId}" class="category-content">`;
            
            if (category.items && Array.isArray(category.items)) {
                category.items.forEach(item => {
                    html += `<div class="food-item">
                        <h4>${item.name}</h4>
                        <div class="nutrition">${formatNutrition(item)}</div>
                    </div>`;
                });
            }
            
            html += `</div></div>`;
        });
    } else {
        html += `<p>Menu structure unavailable</p>`;
    }
    
    html += `</div>`;
    return html;
}

// Add this function to generate category navigation
function generateCategoryNavigation() {
    const categoryNav = document.getElementById('category-nav');
    categoryNav.innerHTML = ''; // Clear existing navigation
    
    // Get all visible meal containers (based on current filter)
    const visibleMeals = Array.from(document.querySelectorAll('.menu-container'))
        .filter(container => container.style.display !== 'none');
    
    visibleMeals.forEach(mealContainer => {
        const mealTitle = mealContainer.querySelector('h2').textContent;
        
        // Add meal heading if we're showing multiple meals
        if (visibleMeals.length > 1) {
            const mealLink = document.createElement('a');
            mealLink.classList.add('category-nav-item', 'meal-nav-item');
            mealLink.textContent = mealTitle;
            mealLink.href = '#' + mealContainer.id;
            categoryNav.appendChild(mealLink);
        }
        
        // Add all categories under this meal
        const categories = mealContainer.querySelectorAll('.category-header');
        categories.forEach(category => {
            const categoryLink = document.createElement('a');
            categoryLink.classList.add('category-nav-item');
            categoryLink.textContent = category.textContent.replace('−', '').replace('+', '').trim();
            
            const targetId = category.dataset.target;
            categoryLink.href = '#' + targetId;
            
            categoryLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(targetId).scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Highlight this category in the nav
                document.querySelectorAll('.category-nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                categoryLink.classList.add('active');
            });
            
            categoryNav.appendChild(categoryLink);
        });
    });
}

async function fetchAndDisplayMenus(date = new Date()) {
    document.getElementById('current-date').textContent = date.toDateString();
    
    document.getElementById('menu-container').innerHTML = '<div class="loading">Loading menus...</div>';
    
    try {
        const [breakfastData, lunchData, dinnerData] = await Promise.all([
            fetchMenu(PERIOD_IDS.breakfast, date),
            fetchMenu(PERIOD_IDS.lunch, date),
            fetchMenu(PERIOD_IDS.dinner, date)
        ]);
        
        const breakfastHTML = generateMenuHTML(breakfastData, 'Breakfast');
        const lunchHTML = generateMenuHTML(lunchData, 'Lunch');
        const dinnerHTML = generateMenuHTML(dinnerData, 'Dinner');
        
        document.getElementById('menu-container').innerHTML = breakfastHTML + lunchHTML + dinnerHTML;
        
        setupCollapsibleCategories();
        generateCategoryNavigation();
        
        const breakfastText = formatMenuOutput(breakfastData, 'Breakfast');
        const lunchText = formatMenuOutput(lunchData, 'Lunch');
        const dinnerText = formatMenuOutput(dinnerData, 'Dinner');
        
        const fullText = `HIGHLANDER COMMONS MENU - ${date.toDateString()}\n\n${breakfastText}\n${lunchText}\n${dinnerText}`;
        document.getElementById('menu-output').textContent = fullText;
        
    } catch (error) {
        document.getElementById('menu-container').innerHTML = `<p>Error loading menus: ${error.message}</p>`;
        console.error('Error:', error);
    }
}

function copyMenuToClipboard() {
    const textToCopy = document.getElementById('menu-output').textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Menu copied to clipboard!');
    }, () => {
        alert('Failed to copy menu. Please try again.');
    });
}

// Add this function to your JavaScript file
function copySelectedMenuToClipboard() {
    // Determine which meal type is currently active
    const activeMealBtn = document.querySelector('.meal-btn.active');
    if (!activeMealBtn) {
        alert('Please select a meal first');
        return;
    }

    const mealType = activeMealBtn.id === 'all-btn' ? 'ALL' : activeMealBtn.textContent.toUpperCase();
    
    if (mealType === 'ALL') {
        // If "All" is selected, just use the regular copy function
        copyMenuToClipboard();
        return;
    }

    // Get the selected menu container
    const selectedContainer = Array.from(document.querySelectorAll('.menu-container')).find(container => {
        const heading = container.querySelector('h2').textContent.toUpperCase();
        return heading === mealType;
    });

    if (!selectedContainer) {
        alert('No menu selected or available');
        return;
    }

    // Format the selected menu for copying
    const date = new Date();
    let textToCopy = `HIGHLANDER COMMONS ${mealType} MENU - ${date.toDateString()}\n\n`;
    
    // Extract the menu content and format it - fix for new structure
    const categories = selectedContainer.querySelectorAll('.category-header');
    
    categories.forEach(category => {
        // Remove the collapse/expand icon from text
        const categoryName = category.textContent.replace('−', '').replace('+', '').trim();
        textToCopy += `=== ${categoryName} ===\n\n`;
        
        // Find the corresponding content section
        const targetId = category.dataset.target;
        const contentSection = document.getElementById(targetId);
        
        if (contentSection) {
            // Get all food items in this content section
            const foodItems = contentSection.querySelectorAll('.food-item');
            foodItems.forEach(item => {
                const foodName = item.querySelector('h4').textContent;
                const nutrition = item.querySelector('.nutrition').textContent;
                
                textToCopy += `• ${foodName}\n`;
                textToCopy += `  ${nutrition}\n\n`;
            });
        }
    });

    // Copy to clipboard
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert(`${mealType} menu copied to clipboard!`);
    }, () => {
        alert('Failed to copy menu. Please try again.');
    });
}

function setupCollapsibleCategories() {
    document.querySelectorAll('.category-header').forEach(header => {
        const targetId = header.dataset.target;
        const content = document.getElementById(targetId);
        const icon = header.querySelector('.collapse-icon');
        
        // Set initial state (expanded)
        content.style.maxHeight = content.scrollHeight + "px";
        icon.textContent = '−';  // Minus sign for expanded
        
        header.addEventListener('click', () => {
            // Toggle state
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                // Currently expanded, so collapse
                content.style.maxHeight = '0px';
                icon.textContent = '+';  // Plus sign for collapsed
            } else {
                // Currently collapsed, so expand
                content.style.maxHeight = content.scrollHeight + "px";
                icon.textContent = '−';  // Minus sign for expanded
            }
        });
    });
}

// Update showMeal function to regenerate category navigation
function showMeal(mealType, activeBtn) {
    const menuContainers = document.querySelectorAll('.menu-container');
    
    menuContainers.forEach(container => {
        const heading = container.querySelector('h2').textContent;
        
        if (mealType === 'ALL' || heading.toUpperCase() === mealType) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });
    
    // Update active button state
    document.querySelectorAll('.meal-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to the clicked button
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Regenerate category navigation after DOM updates
    setTimeout(generateCategoryNavigation, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayMenus();
    
    document.getElementById('refresh-btn').addEventListener('click', fetchAndDisplayMenus);
    document.getElementById('copy-btn').addEventListener('click', copyMenuToClipboard);
    document.getElementById('copy-selected-btn').addEventListener('click', copySelectedMenuToClipboard);

    // Get meal filter buttons
    const breakfastBtn = document.getElementById('breakfast-btn');
    const lunchBtn = document.getElementById('lunch-btn');
    const dinnerBtn = document.getElementById('dinner-btn');
    const allBtn = document.getElementById('all-btn');

    // Add event listeners for meal buttons
    breakfastBtn.addEventListener('click', () => {
        showMeal('BREAKFAST', breakfastBtn);
    });

    lunchBtn.addEventListener('click', () => {
        showMeal('LUNCH', lunchBtn);
    });

    dinnerBtn.addEventListener('click', () => {
        showMeal('DINNER', dinnerBtn);
    });

    allBtn.addEventListener('click', () => {
        showMeal('ALL', allBtn);
    });

    const optionsBtn = document.getElementById('options-btn');
    const optionsMenu = document.getElementById('options-menu');
    
    optionsBtn.addEventListener('click', () => {
        optionsMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!optionsBtn.contains(e.target) && !optionsMenu.contains(e.target)) {
            optionsMenu.classList.remove('active');
        }
    });
    
    document.getElementById('show-macros').addEventListener('change', function() {
        appSettings.showMacros = this.checked;
        fetchAndDisplayMenus(); 
    });
    
    document.getElementById('show-allergies').addEventListener('change', function() {
        appSettings.showAllergies = this.checked;
        fetchAndDisplayMenus(); 
    });
    
    const dateDisplay = document.getElementById('current-date');
    dateDisplay.classList.add('clickable');
    dateDisplay.addEventListener('click', showDatePicker);
});

// Replace the current showDatePicker function with this improved version
function showDatePicker() {
    const dateDisplay = document.getElementById('current-date');
    
    // Create a date input element
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    
    // Center it on the screen
    dateInput.style.position = 'fixed';
    dateInput.style.top = '50%';
    dateInput.style.left = '50%';
    dateInput.style.transform = 'translate(-50%, -50%)';
    dateInput.style.zIndex = '2000';
    dateInput.style.padding = '10px';
    dateInput.style.fontSize = '16px';
    dateInput.style.border = '1px solid #ccc';
    dateInput.style.borderRadius = '4px';
    dateInput.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    dateInput.style.backgroundColor = 'white';
    
    // Add a visible label above the input
    const label = document.createElement('div');
    label.textContent = 'Select a date:';
    label.style.position = 'fixed';
    label.style.top = 'calc(50% - 40px)';
    label.style.left = '50%';
    label.style.transform = 'translateX(-50%)';
    label.style.zIndex = '2000';
    label.style.fontSize = '16px';
    label.style.fontWeight = 'bold';
    
    // Create background overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '1999';
    
    // Get the current displayed date
    const currentDateText = dateDisplay.textContent;
    
    // Parse the displayed date (handle any format)
    let displayedDate;
    try {
        displayedDate = new Date(currentDateText);
        if (isNaN(displayedDate.getTime())) {
            displayedDate = new Date(); // Fallback to today
        }
    } catch (e) {
        displayedDate = new Date(); // Fallback to today
    }
    
    // Format for input
    const year = displayedDate.getFullYear();
    const month = String(displayedDate.getMonth() + 1).padStart(2, '0');
    const day = String(displayedDate.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    
    // Add to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(label);
    document.body.appendChild(dateInput);
    
    // Force the calendar to appear
    dateInput.focus();
    dateInput.showPicker(); // For browsers that support it
    
    // Close when clicking overlay
    overlay.addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(label);
        document.body.removeChild(dateInput);
    });
    
    // Handle date selection
    dateInput.addEventListener('change', () => {
        try {
            const selectedDate = new Date(dateInput.value + 'T00:00:00'); // Ensure proper date parsing
            
            // Check if date is valid
            if (!isNaN(selectedDate.getTime())) {
                fetchAndDisplayMenus(selectedDate);
            }
        } catch (e) {
            console.error('Error parsing selected date:', e);
        }
        
        // Clean up
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        if (document.body.contains(label)) document.body.removeChild(label);
        if (document.body.contains(dateInput)) document.body.removeChild(dateInput);
    });
    
    // Handle when the picker is closed without selection
    dateInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            if (document.body.contains(label)) document.body.removeChild(label);
            if (document.body.contains(dateInput)) document.body.removeChild(dateInput);
        }, 300);
    });
}