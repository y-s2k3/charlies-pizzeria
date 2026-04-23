// ============================================
// CHARLIE'S PIZZERIA 
// ============================================

// Initialize localStorage with sample data
function initAppData() {
    if (!localStorage.getItem('charliesPizzeria')) {
        const initialData = {
            users: [
                { email: "customer@test.com", password: "123", name: "John", type: "customer" },
                { email: "admin@test.com", password: "admin123", name: "Admin", type: "admin" }
            ],
            menuItems: [
                { id: 1, name: "Margherita Pizza", description: "Fresh tomatoes, mozzarella cheese, basil", price: 9.99, category: "pizza" },
                { id: 2, name: "Pepperoni Pizza", description: "Pepperoni, extra cheese, tomato sauce", price: 10.99, category: "pizza" },
                { id: 3, name: "Garlic Bread", description: "Freshly baked with garlic butter", price: 4.99, category: "sides" },
                { id: 4, name: "Coke", description: "Refreshing Coca-Cola", price: 1.99, category: "drinks" }
            ],
            orders: [],
            currentOrderId: 1001,
            cart: []
        };
        localStorage.setItem('charliesPizzeria', JSON.stringify(initialData));
    }
    
    // Initialize points system if not exists
    if (!localStorage.getItem('userPoints')) {
        localStorage.setItem('userPoints', JSON.stringify({}));
    }
    
    return JSON.parse(localStorage.getItem('charliesPizzeria'));
}

// Get cart items
function getCart() {
    const data = initAppData();
    return data.cart;
}

// Add item to cart
function addToCart(itemId, itemName, itemPrice, quantity = 1) {
    const data = initAppData();
    const existingItem = data.cart.find(item => item.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        data.cart.push({
            id: itemId,
            name: itemName,
            price: itemPrice,
            quantity: quantity
        });
    }
    
    localStorage.setItem('charliesPizzeria', JSON.stringify(data));
    updateCartCount();
    return true;
}

// Remove item from cart
function removeFromCart(itemId) {
    const data = initAppData();
    data.cart = data.cart.filter(item => item.id !== itemId);
    localStorage.setItem('charliesPizzeria', JSON.stringify(data));
    updateCartCount();
}

// Update cart quantity
function updateCartQuantity(itemId, quantity) {
    const data = initAppData();
    const cartItem = data.cart.find(item => item.id === itemId);
    
    if (cartItem) {
        if (quantity <= 0) {
            removeFromCart(itemId);
        } else {
            cartItem.quantity = quantity;
            localStorage.setItem('charliesPizzeria', JSON.stringify(data));
        }
    }
    updateCartCount();
}

// Clear entire cart
function clearCart() {
    const data = initAppData();
    data.cart = [];
    localStorage.setItem('charliesPizzeria', JSON.stringify(data));
    updateCartCount();
}

// Get cart total
function getCartTotal() {
    const cart = getCart();
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
        total = total + (cart[i].price * cart[i].quantity);
    }
    return total;
}

// ============================================
// CREATE ORDER 
// ============================================

function createOrder(customerName, address, phone, paymentMethod, discountApplied = 0) {
    const data = initAppData();
    const cart = data.cart;
    const currentUser = getCurrentUser();
    
    if (cart.length === 0) return null;
    
    // Calculate subtotal correctly
    let subtotal = 0;
    for (let i = 0; i < cart.length; i++) {
        subtotal = subtotal + (cart[i].price * cart[i].quantity);
    }
    
    const deliveryFee = 2.99;
    let total = subtotal + deliveryFee - discountApplied;
    if (total < 0) total = 0;
    
    // Get a consistent guest ID for non-logged-in users
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
        guestId = 'guest_' + Date.now();
        localStorage.setItem('guestId', guestId);
    }
    
    // Use the logged-in user's email
    let userEmail = 'guest';
    if (currentUser) {
        userEmail = currentUser.email;
    } else {
        userEmail = guestId;
    }
    
    const order = {
        id: data.currentOrderId++,
        customerName: customerName,
        userEmail: userEmail,
        isGuest: !currentUser,
        items: [...cart],
        subtotal: subtotal,
        delivery: deliveryFee,
        discount: discountApplied,
        total: total,
        status: 1,
        timestamp: new Date().toISOString(),
        address: address,
        phone: phone,
        payment: paymentMethod,
        isDeleted: false,
        revenueRecorded: false
    };
    
    data.orders.unshift(order);
    data.cart = [];
    
    localStorage.setItem('charliesPizzeria', JSON.stringify(data));
    updateCartCount();
    
    // Add loyalty points ONLY if logged in
    if (currentUser && currentUser.type === 'customer') {
        const pointsEarned = Math.floor((subtotal + deliveryFee) * 10);
        addUserPoints(currentUser.email, pointsEarned);
        sessionStorage.setItem('lastPointsEarned', pointsEarned);
        
        // Deduct points if discount was used
        if (discountApplied > 0) {
            usePoints(currentUser.email, 100);
        }
    }
    
    return order.id;
}

// ============================================
// LOYALTY POINTS SYSTEM
// ============================================

function getUserPoints(email) {
    const pointsData = localStorage.getItem('userPoints');
    if (pointsData) {
        const points = JSON.parse(pointsData);
        return points[email] || 0;
    }
    return 0;
}

function addUserPoints(email, points) {
    let pointsData = localStorage.getItem('userPoints');
    if (!pointsData) {
        pointsData = '{}';
    }
    const pointsObj = JSON.parse(pointsData);
    pointsObj[email] = (pointsObj[email] || 0) + points;
    localStorage.setItem('userPoints', JSON.stringify(pointsObj));
    updatePointsDisplay();
    return pointsObj[email];
}

function usePoints(email, pointsToUse) {
    const currentPoints = getUserPoints(email);
    if (currentPoints >= pointsToUse) {
        let pointsData = localStorage.getItem('userPoints');
        const pointsObj = JSON.parse(pointsData);
        pointsObj[email] = currentPoints - pointsToUse;
        localStorage.setItem('userPoints', JSON.stringify(pointsObj));
        updatePointsDisplay();
        return true;
    }
    return false;
}

function updatePointsDisplay() {
    const currentUser = getCurrentUser();
    const pointsDisplay = document.getElementById('pointsDisplay');
    const pointsValue = document.getElementById('pointsValue');
    
    if (currentUser && currentUser.type === 'customer') {
        const points = getUserPoints(currentUser.email);
        if (pointsDisplay) {
            pointsDisplay.style.display = 'inline-block';
        }
        if (pointsValue) {
            pointsValue.textContent = points;
        }
    } else {
        if (pointsDisplay) {
            pointsDisplay.style.display = 'none';
        }
    }
}

// ============================================
// ORDER FUNCTIONS
// ============================================

// Get all orders for admin view (excludes deleted orders)
function getAllOrders() {
    const data = initAppData();
    return data.orders.filter(order => !order.isDeleted);
}

// Get all orders INCLUDING deleted for revenue calculation
function getAllOrdersForRevenue() {
    const data = initAppData();
    return data.orders.filter(order => order.revenueRecorded === true || order.status === 5);
}

// Get orders for current user (excludes deleted orders)
function getUserOrders() {
    const data = initAppData();
    const currentUser = getCurrentUser();
    
    const activeOrders = data.orders.filter(order => !order.isDeleted);
    
    if (!currentUser) {
        const guestId = localStorage.getItem('guestId');
        if (guestId) {
            return activeOrders.filter(order => order.userEmail === guestId);
        }
        return [];
    }
    
    if (currentUser.type === 'admin') {
        return activeOrders;
    }
    
    return activeOrders.filter(order => order.userEmail === currentUser.email);
}

// Get single order (checks permissions, excludes deleted)
function getOrder(orderId) {
    const data = initAppData();
    const currentUser = getCurrentUser();
    const order = data.orders.find(order => order.id === orderId);
    
    if (!order) return null;
    if (order.isDeleted) return null;
    
    if (currentUser && currentUser.type === 'admin') {
        return order;
    }
    
    if (currentUser && currentUser.type === 'customer' && order.userEmail === currentUser.email) {
        return order;
    }
    
    const guestId = localStorage.getItem('guestId');
    if (guestId && order.userEmail === guestId) {
        return order;
    }
    
    return null;
}

function updateOrderStatus(orderId, newStatus) {
    const data = initAppData();
    const order = data.orders.find(order => order.id === orderId);
    
    if (order && !order.isDeleted) {
        if (newStatus === 5 && !order.revenueRecorded) {
            order.revenueRecorded = true;
        }
        order.status = newStatus;
        localStorage.setItem('charliesPizzeria', JSON.stringify(data));
        return true;
    }
    return false;
}

// DELETE ORDER - 
function deleteOrder(orderId) {
    const data = initAppData();
    const order = data.orders.find(order => order.id === orderId);
    
    if (!order) {
        return { success: false, message: 'Order not found' };
    }
    
    if (order.status !== 5) {
        return { success: false, message: 'Only delivered orders can be deleted' };
    }
    
    order.isDeleted = true;
    localStorage.setItem('charliesPizzeria', JSON.stringify(data));
    
    return { success: true, message: 'Order removed from active list. Revenue remains unchanged.' };
}

function cancelOrder(orderId) {
    const data = initAppData();
    const currentUser = getCurrentUser();
    const orderIndex = data.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
        return { success: false, message: 'Order not found' };
    }
    
    const order = data.orders[orderIndex];
    
    if (order.isDeleted) {
        return { success: false, message: 'Order cannot be cancelled' };
    }
    
    if (currentUser && currentUser.type !== 'admin') {
        const guestId = localStorage.getItem('guestId');
        if (order.userEmail !== currentUser.email && order.userEmail !== guestId) {
            return { success: false, message: 'You do not have permission to cancel this order' };
        }
    }
    
    if (order.status >= 5) {
        return { success: false, message: 'This order has already been delivered and cannot be cancelled.' };
    }
    
    if (order.status === 4) {
        return { success: false, message: 'This order is already out for delivery and cannot be cancelled.' };
    }
    
    const refundAmount = order.total;
    data.orders.splice(orderIndex, 1);
    localStorage.setItem('charliesPizzeria', JSON.stringify(data));
    
    return { success: true, refundAmount: refundAmount };
}

function canCancelOrder(order) {
    if (!order) return false;
    if (order.isDeleted) return false;
    return order.status >= 1 && order.status <= 3;
}

// ============================================
// USER FUNCTIONS
// ============================================

function loginUser(email, password) {
    const data = initAppData();
    const user = data.users.find(user => user.email === email && user.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }
    return null;
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function logoutUser() {
    localStorage.removeItem('currentUser');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPrice(price) {
    return `£${price.toFixed(2)}`;
}

function getStatusText(statusCode) {
    const statuses = {
        1: 'Ordered',
        2: 'Preparing',
        3: 'Baking',
        4: 'Out for Delivery',
        5: 'Delivered'
    };
    return statuses[statusCode] || 'Unknown';
}

function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count');
    const cart = getCart();
    let count = 0;
    for (let i = 0; i < cart.length; i++) {
        count = count + cart[i].quantity;
    }
    
    cartCountElements.forEach(element => {
        element.textContent = count;
        if (count > 0) {
            element.style.display = 'inline-block';
        } else {
            element.style.display = 'none';
        }
    });
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2A9D8F' : type === 'error' ? '#E63946' : '#F4A261'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
    `;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// NAVBAR UPDATE FUNCTION - CONTROLS ALL LINKS
// ============================================

function updateNavbarForLoginStatus() {
    const currentUser = getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminLink = document.getElementById('adminLink');
    const myOrdersLink = document.getElementById('myOrdersLink');
    const pointsDisplay = document.getElementById('pointsDisplay');
    const pointsValue = document.getElementById('pointsValue');
    
    if (currentUser) {
        // User is logged in
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // Show My Orders link for ALL logged in users
        if (myOrdersLink) myOrdersLink.style.display = 'inline-block';
        
        // Show admin link ONLY for admin users
        if (adminLink) {
            if (currentUser.type === 'admin') {
                adminLink.style.display = 'inline-block';
            } else {
                adminLink.style.display = 'none';
            }
        }
        
        // Show points display ONLY for customers
        if (pointsDisplay) {
            if (currentUser.type === 'customer') {
                pointsDisplay.style.display = 'inline-block';
                const points = getUserPoints(currentUser.email);
                if (pointsValue) pointsValue.textContent = points;
            } else {
                pointsDisplay.style.display = 'none';
            }
        }
    } else {
        // User is logged out
        if (loginLink) loginLink.style.display = 'inline-block';
        if (registerLink) registerLink.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (myOrdersLink) myOrdersLink.style.display = 'none';
        if (pointsDisplay) pointsDisplay.style.display = 'none';
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initAppData();
    updateCartCount();
    updateNavbarForLoginStatus();
    
    const user = getCurrentUser();
    if (user && document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
    }
    
    const lastPointsEarned = sessionStorage.getItem('lastPointsEarned');
    if (lastPointsEarned && user && user.type === 'customer') {
        showToast(`✨ You earned ${lastPointsEarned} points!`, 'success');
        sessionStorage.removeItem('lastPointsEarned');
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
            window.location.href = 'index.html';
        });
    }
    
    // Admin logout button (on admin page)
    const adminLogout = document.getElementById('adminLogout');
    if (adminLogout) {
        adminLogout.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
            window.location.href = 'index.html';
        });
    }
    
    console.log("Charlie's Pizzeria - App initialized!");
});