// ============================================
// ORDERS PAGE 
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const ordersList = document.getElementById('ordersList');
    
    if (!ordersList) {
        console.error("ordersList element not found!");
        return;
    }
    
    function getStatusText(statusCode) {
        const statuses = { 1: 'Ordered', 2: 'Preparing', 3: 'Baking', 4: 'Out for Delivery', 5: 'Delivered' };
        return statuses[statusCode] || 'Unknown';
    }
    
    // SAFE date formatting
    function formatOrderDate(timestamp) {
        if (!timestamp) return 'Unknown date';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'Unknown date';
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'Unknown date';
        }
    }
    
    const currentUser = getCurrentUser();
    console.log("Current user:", currentUser);
    
    if (!currentUser) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-lock fa-3x" style="color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666;">Please Login to View Your Orders</h3>
                <p style="color: #999; margin-bottom: 1rem;">You need to be logged in to see your order history.</p>
                <a href="login.html" class="btn-primary" style="display: inline-block;">Login Now</a>
            </div>
        `;
        return;
    }
    
    const userOrders = getUserOrders();
    console.log("User orders:", userOrders);
    
    if (!userOrders || userOrders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-shopping-cart fa-3x" style="color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666;">No Orders Yet</h3>
                <p style="color: #999; margin-bottom: 1rem;">You haven't placed any orders yet.</p>
                <a href="menu.html" class="btn-primary" style="display: inline-block;">Browse Menu</a>
            </div>
        `;
        return;
    }
    
    let html = '';
    for (let i = userOrders.length - 1; i >= 0; i--) {
        const order = userOrders[i];
        const orderDateFormatted = formatOrderDate(order.timestamp);
        
        html += `
            <div style="background: white; border-radius: 16px; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid #E63946; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h3 style="margin: 0 0 5px 0;">Order #${order.id}</h3>
                        <p style="margin: 0; color: #666; font-size: 0.85rem;">${orderDateFormatted}</p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 0.85rem;">${order.items.length} item(s)</p>
                    </div>
                    <div>
                        <span style="display: inline-block; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold; color: white; background: ${order.status === 5 ? '#0984e3' : '#E63946'}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                    <div style="font-weight: bold; color: #E63946; font-size: 1.1rem;">
                        ${formatPrice(order.total)}
                    </div>
                    <button onclick="window.location.href='tracking.html?order=${order.id}'" style="background: #E63946; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-eye"></i> View Order
                    </button>
                </div>
            </div>
        `;
    }
    ordersList.innerHTML = html;
    console.log("Orders displayed successfully!");
});