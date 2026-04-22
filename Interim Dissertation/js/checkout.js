// ============================================
// CHECKOUT PAGE 
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutItems = document.getElementById('checkoutItems');
    const totalAmountSpan = document.getElementById('checkoutTotal');
    const usePointsCheckbox = document.getElementById('usePointsCheckbox');
    const pointsBalanceSpan = document.getElementById('pointsBalance');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    const DELIVERY_FEE = 2.99;
    let discountApplied = 0;
    let currentPoints = 0;
    
    const currentUser = getCurrentUser();
    const isLoggedIn = currentUser !== null;
    
    // ============================================
    // PHONE NUMBER VALIDATION 
    // ============================================
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Remove any non-digit characters
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        // Also validate on blur to ensure no letters
        phoneInput.addEventListener('blur', function(e) {
            if (this.value.length > 0 && this.value.length < 10) {
                // Optional: show warning if phone number is too short
                console.log("Phone number length:", this.value.length);
            }
        });
    }
    
    function showToastMessage(message, type) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2A9D8F' : '#E63946'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    function loadPointsBalance() {
        if (isLoggedIn && currentUser.type === 'customer') {
            currentPoints = getUserPoints(currentUser.email);
            pointsBalanceSpan.innerHTML = `⭐ You have ${currentPoints} points. 100 points = £5 off`;
            
            if (currentPoints >= 100) {
                usePointsCheckbox.disabled = false;
                pointsBalanceSpan.innerHTML += ` <span style="color: green;">(Available to use!)</span>`;
            } else {
                usePointsCheckbox.disabled = true;
                pointsBalanceSpan.innerHTML += ` <span style="color: red;">(Need ${100 - currentPoints} more points)</span>`;
            }
        } else {
            pointsBalanceSpan.innerHTML = `🔐 <a href="login.html" style="color: #E63946;">Login</a> to earn points on orders!`;
            usePointsCheckbox.disabled = true;
            usePointsCheckbox.style.display = 'none';
        }
    }
    
    function updateAllTotals() {
        const cart = getCart();
        
        // Calculate subtotal manually
        let subtotal = 0;
        for (let i = 0; i < cart.length; i++) {
            subtotal = subtotal + (cart[i].price * cart[i].quantity);
        }
        
        let total = subtotal + DELIVERY_FEE - discountApplied;
        if (total < 0) total = 0;
        
        if (cart.length === 0) {
            total = 0;
        }
        
        if (totalAmountSpan) {
            totalAmountSpan.textContent = formatPrice(total);
        }
        
        if (placeOrderBtn) {
            if (cart.length === 0) {
                placeOrderBtn.innerHTML = `PLACE ORDER - £0.00`;
            } else {
                placeOrderBtn.innerHTML = `PLACE ORDER - ${formatPrice(total)}`;
            }
        }
        
        if (checkoutItems) {
            checkoutItems.innerHTML = '';
            
            if (cart.length === 0) {
                checkoutItems.innerHTML = '<p style="text-align: center; color: #888;">Your cart is empty. <a href="menu.html">Browse Menu</a></p>';
                return;
            }
            
            for (let i = 0; i < cart.length; i++) {
                const item = cart[i];
                const itemRow = document.createElement('div');
                itemRow.style.display = 'flex';
                itemRow.style.justifyContent = 'space-between';
                itemRow.style.padding = '0.5rem 0';
                itemRow.style.borderBottom = '1px solid #eee';
                itemRow.innerHTML = `
                    <span>${item.quantity} x ${item.name}</span>
                    <span>${formatPrice(item.price * item.quantity)}</span>
                `;
                checkoutItems.appendChild(itemRow);
            }
            
            const subtotalRow = document.createElement('div');
            subtotalRow.style.display = 'flex';
            subtotalRow.style.justifyContent = 'space-between';
            subtotalRow.style.padding = '0.5rem 0';
            subtotalRow.innerHTML = `<span>Subtotal</span><span>${formatPrice(subtotal)}</span>`;
            checkoutItems.appendChild(subtotalRow);
            
            if (discountApplied > 0) {
                const discountRow = document.createElement('div');
                discountRow.style.display = 'flex';
                discountRow.style.justifyContent = 'space-between';
                discountRow.style.padding = '0.5rem 0';
                discountRow.style.color = '#2A9D8F';
                discountRow.innerHTML = `<span>Discount (Points)</span><span>-${formatPrice(discountApplied)}</span>`;
                checkoutItems.appendChild(discountRow);
            }
            
            const deliveryRow = document.createElement('div');
            deliveryRow.style.display = 'flex';
            deliveryRow.style.justifyContent = 'space-between';
            deliveryRow.style.padding = '0.5rem 0';
            deliveryRow.innerHTML = `<span>Delivery</span><span>${formatPrice(DELIVERY_FEE)}</span>`;
            checkoutItems.appendChild(deliveryRow);
            
            const totalRow = document.createElement('div');
            totalRow.style.display = 'flex';
            totalRow.style.justifyContent = 'space-between';
            totalRow.style.padding = '0.5rem 0';
            totalRow.style.fontWeight = 'bold';
            totalRow.style.fontSize = '1.2rem';
            totalRow.style.marginTop = '0.5rem';
            totalRow.style.paddingTop = '0.5rem';
            totalRow.style.borderTop = '2px solid #E63946';
            totalRow.innerHTML = `<span>Total</span><span>${formatPrice(total)}</span>`;
            checkoutItems.appendChild(totalRow);
        }
    }
    
    if (usePointsCheckbox) {
        usePointsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                if (currentPoints >= 100) {
                    discountApplied = 5;
                    showToastMessage('£5 discount applied!', 'success');
                    updateAllTotals();
                } else {
                    this.checked = false;
                    discountApplied = 0;
                    showToastMessage(`Not enough points. You have ${currentPoints}, need 100.`, 'error');
                }
            } else {
                discountApplied = 0;
                updateAllTotals();
            }
        });
    }
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const cart = getCart();
            if (cart.length === 0) {
                alert('Your cart is empty!');
                window.location.href = 'menu.html';
                return;
            }
            
            const fullName = document.getElementById('fullName').value;
            const address = document.getElementById('address').value;
            let phone = document.getElementById('phone').value;
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            
            if (!fullName || !address || !phone) {
                alert('Please fill in all delivery details.');
                return;
            }
            
            // Remove any non-digit characters from phone (extra safety)
            phone = phone.replace(/[^0-9]/g, '');
            
            if (phone.length === 0) {
                alert('Please enter a valid phone number (numbers only).');
                return;
            }
            
            // Calculate total BEFORE creating order
            let subtotal = 0;
            for (let i = 0; i < cart.length; i++) {
                subtotal = subtotal + (cart[i].price * cart[i].quantity);
            }
            const totalBeforeOrder = subtotal + DELIVERY_FEE - discountApplied;
            
            const orderId = createOrder(fullName, address, phone, paymentMethod, discountApplied);
            
            if (orderId) {
                alert(`🎉 Order #${orderId} placed successfully!\n\nTotal: ${formatPrice(totalBeforeOrder)}\n\nYou can track your order on the tracking page.`);
                window.location.href = `tracking.html?order=${orderId}`;
            } else {
                alert('There was an error placing your order. Please try again.');
            }
        });
    }
    
    updateAllTotals();
    loadPointsBalance();
});