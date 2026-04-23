// ============================================
// TRACKING PAGE 
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const trackingContent = document.getElementById('trackingContent');
    
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    let orderId = parseInt(urlParams.get('order'));
    
    console.log("Order ID from URL:", orderId);
    
    // If no order in URL, get the most recent order for the CURRENT USER ONLY
    if (!orderId || isNaN(orderId)) {
        const userOrders = getUserOrders();
        console.log("User's orders:", userOrders);
        
        if (userOrders && userOrders.length > 0) {
            orderId = userOrders[0].id;
            console.log("Using most recent user order:", orderId);
        }
    }
    
    // SAFE formatTime function - handles undefined/null
    function formatTime(dateString) {
        if (!dateString) return 'Pending';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Pending';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'Pending';
        }
    }
    
    // SAFE formatDate function - handles undefined/null (THIS WAS THE PROBLEM)
    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Unknown';
            return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return 'Unknown';
        }
    }
    
    function showModal(options) {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 25px; padding: 2rem; max-width: 400px; width: 90%; text-align: center;">
                ${options.type === 'confirm' ? '<i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #E63946; margin-bottom: 1rem;"></i>' : '<i class="fas fa-check-circle" style="font-size: 4rem; color: #2A9D8F; margin-bottom: 1rem;"></i>'}
                <h3 style="margin-bottom: 1rem;">${options.title}</h3>
                <p style="color: #666; margin-bottom: 1.5rem;">${options.message}</p>
                ${options.refundAmount ? `<div style="font-size: 1.8rem; font-weight: bold; color: #2A9D8F; margin: 1rem 0;">${formatPrice(options.refundAmount)}</div>` : ''}
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    ${options.showCancelButton ? '<button id="modalCancelBtn" style="background: #e0e0e0; color: #666; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; cursor: pointer;">No, Go Back</button>' : ''}
                    <button id="modalConfirmBtn" style="background: #E63946; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; cursor: pointer;">${options.confirmText || 'OK'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('modalConfirmBtn').addEventListener('click', () => {
            modal.remove();
            if (options.onConfirm) options.onConfirm();
        });
        
        if (options.showCancelButton) {
            const cancelBtn = document.getElementById('modalCancelBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    modal.remove();
                    if (options.onCancel) options.onCancel();
                });
            }
        }
    }
    
    function loadOrderDetails() {
        if (!trackingContent) return;
        
        if (!orderId) {
            trackingContent.innerHTML = `
                <div class="no-order-card" style="text-align: center; padding: 3rem; background: rgba(255,255,255,0.95); border-radius: 24px;">
                    <i class="fas fa-search" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3 style="color: #666;">No Order Found</h3>
                    <p style="color: #999; margin-bottom: 1.5rem;">You haven't placed any orders yet.</p>
                    <a href="menu.html" class="btn-primary">Browse Menu</a>
                </div>
            `;
            return;
        }
        
        // Get the order
        const order = getOrder(orderId);
        
        console.log("Found order:", order);
        
        if (!order) {
            trackingContent.innerHTML = `
                <div class="no-order-card" style="text-align: center; padding: 3rem; background: rgba(255,255,255,0.95); border-radius: 24px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ffa726; margin-bottom: 1rem;"></i>
                    <h3 style="color: #666;">Order #${orderId} Not Found</h3>
                    <p style="color: #999; margin-bottom: 1.5rem;">This order doesn't exist or you don't have permission to view it.</p>
                    <a href="menu.html" class="btn-primary">Browse Menu</a>
                </div>
            `;
            return;
        }
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = `Track Order #${order.id}`;
        }
        
        // Build timeline
        const statuses = [
            { status: 1, icon: 'fa-shopping-cart', title: 'Ordered', description: 'Order received' },
            { status: 2, icon: 'fa-utensils', title: 'Preparing', description: 'Chef is cooking' },
            { status: 3, icon: 'fa-fire', title: 'Baking', description: 'In the oven' },
            { status: 4, icon: 'fa-motorcycle', title: 'Out for Delivery', description: 'On the way' },
            { status: 5, icon: 'fa-check-circle', title: 'Delivered', description: 'Enjoy your meal!' }
        ];
        
        let timelineHTML = '<div class="status-timeline" style="display: flex; justify-content: space-between; margin: 2rem 0; flex-wrap: wrap;">';
        statuses.forEach(step => {
            let bgColor = '#E9ECEF';
            let iconColor = '#6C757D';
            
            if (order.status > step.status) {
                bgColor = '#2A9D8F';
                iconColor = 'white';
            } else if (order.status === step.status) {
                bgColor = '#E63946';
                iconColor = 'white';
            }
            if (order.status === step.status && step.status === 4) {
                timelineHTML += `
                    <div class="status-step" style="text-align: center; flex: 1; min-width: 80px;">
                        <div class="step-icon" style="width: 50px; height: 50px; background: ${bgColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.8rem; color: ${iconColor}; animation: pulse 1.5s infinite;">
                            <i class="fas ${step.icon}"></i>
                        </div>
                        <div class="step-info">
                            <h3 style="font-size: 0.9rem; margin-bottom: 0.2rem;">${step.title}</h3>
                            <p style="font-size: 0.75rem; color: #6C757D;">${step.description}</p>
                            <p class="eta" style="color: #E63946; font-size: 0.7rem;">ETA: 15-25 minutes</p>
                        </div>
                    </div>
                `;
            } else {
                timelineHTML += `
                    <div class="status-step" style="text-align: center; flex: 1; min-width: 80px;">
                        <div class="step-icon" style="width: 50px; height: 50px; background: ${bgColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.8rem; color: ${iconColor};">
                            <i class="fas ${step.icon}"></i>
                        </div>
                        <div class="step-info">
                            <h3 style="font-size: 0.9rem; margin-bottom: 0.2rem;">${step.title}</h3>
                            <p style="font-size: 0.75rem; color: #6C757D;">${step.description}</p>
                        </div>
                    </div>
                `;
            }
        });
        timelineHTML += '</div>';
        
        // Build order details
        let itemsHTML = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                itemsHTML += `
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span>${item.name} x${item.quantity}</span>
                        <span>${formatPrice(item.price * item.quantity)}</span>
                    </div>
                `;
            });
        }
        
        const canCancel = canCancelOrder(order);
        
        // SAFE timestamp formatting with fallbacks
        const orderTimestamp = order.timestamp || new Date().toISOString();
        const formattedDate = formatDate(orderTimestamp);
        const formattedTime = formatTime(orderTimestamp);
        
        trackingContent.innerHTML = `
            <div class="order-status-card" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-radius: 24px; padding: 2rem;">
                <h2 style="color: #2D3436; margin-bottom: 1.5rem;">ORDER STATUS: ${getStatusText(order.status).toUpperCase()}</h2>
                ${timelineHTML}
                <div class="order-details" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E9ECEF;">
                    <h3 style="margin-bottom: 1rem;">Order Details</h3>
                    ${itemsHTML}
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span>Delivery Fee</span>
                        <span>${formatPrice(order.delivery || 2.99)}</span>
                    </div>
                    <div class="detail-row total" style="border-top: 2px solid #E63946; border-bottom: none; margin-top: 0.5rem; padding-top: 1rem; font-weight: bold; font-size: 1.1rem; color: #E63946; display: flex; justify-content: space-between;">
                        <span>Total</span>
                        <span>${formatPrice(order.total)}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span>Delivery Address</span>
                        <span>${order.address || 'Not specified'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span>Phone Number</span>
                        <span>${order.phone || 'Not specified'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #f0f0f0;">
                        <span>Payment Method</span>
                        <span>${order.payment === 'card' ? 'Credit Card' : 'Cash on Delivery'}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; padding: 0.8rem 0;">
                        <span>Order Placed</span>
                        <span>${formattedDate} at ${formattedTime}</span>
                    </div>
                </div>
                ${canCancel ? `
                    <div id="cancelOrderContainer" style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E9ECEF;">
                        <button id="cancelOrderBtn" class="btn-cancel-order" style="background: #E63946; color: white; border: none; padding: 0.8rem 2rem; border-radius: 50px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-times-circle"></i> Cancel Order
                        </button>
                        <p style="font-size: 0.8rem; color: #888; margin-top: 0.5rem;">You will be refunded ${formatPrice(order.total)}</p>
                    </div>
                ` : ''}
                ${order.isGuest ? `
                    <div style="text-align: center; margin-top: 1.5rem; padding: 1rem; background: #FFF8E7; border-radius: 12px;">
                        <p style="font-size: 0.85rem; color: #666;">
                            <i class="fas fa-star" style="color: #FFD166;"></i> 
                            <a href="register.html" style="color: #E63946;">Create an account</a> to earn points on future orders!
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Add cancel button event listener
        const cancelBtn = document.getElementById('cancelOrderBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                showModal({
                    type: 'confirm',
                    title: 'Cancel Order?',
                    message: `Are you sure you want to cancel Order #${order.id}?`,
                    showCancelButton: true,
                    confirmText: 'Yes, Cancel Order',
                    onConfirm: function() {
                        const result = cancelOrder(order.id);
                        if (result.success) {
                            showModal({
                                type: 'refund',
                                title: 'Order Cancelled!',
                                message: 'Your order has been cancelled successfully.',
                                refundAmount: result.refundAmount,
                                showCancelButton: false,
                                confirmText: 'OK',
                                onConfirm: function() {
                                    window.location.href = 'menu.html';
                                }
                            });
                        } else {
                            showModal({
                                type: 'confirm',
                                title: 'Cannot Cancel Order',
                                message: result.message,
                                showCancelButton: false,
                                confirmText: 'OK'
                            });
                        }
                    }
                });
            });
        }
    }
    
    // Load the order details
    setTimeout(function() {
        loadOrderDetails();
    }, 100);
});