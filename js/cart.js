// ============================================
// CART PAGE FUNCTIONALITY 
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const subtotalElement = document.getElementById('cartSubtotal');
    const totalElement = document.getElementById('cartTotal');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    const DELIVERY_FEE = 2.99;
    
    function loadCartItems() {
        const cart = getCart();
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-container">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any items yet.</p>
                    <a href="menu.html" class="btn-primary" style="display: inline-block; margin-top: 1rem;">
                        Browse Our Menu <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;
            if (subtotalElement) subtotalElement.textContent = formatPrice(0);
            if (totalElement) totalElement.textContent = formatPrice(DELIVERY_FEE);
            return;
        }
        
        const subtotal = getCartTotal();
        const total = subtotal + DELIVERY_FEE;
        
        if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
        if (totalElement) totalElement.textContent = formatPrice(total);
        
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.innerHTML = `Proceed to Checkout ${formatPrice(total)} <i class="fas fa-arrow-right"></i>`;
        }
        
        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="item-info-cart">
                    <h3>${item.name}</h3>
                    <p class="item-price-cart">${formatPrice(item.price)} each</p>
                </div>
                <div class="item-actions-cart">
                    <div class="quantity-control">
                        <button class="qty-btn minus" data-id="${item.id}">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="item-total">
                    ${formatPrice(item.price * item.quantity)}
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
        
        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const cart = getCart();
                const item = cart.find(i => i.id === id);
                if (item && item.quantity > 1) {
                    updateCartQuantity(id, item.quantity - 1);
                    loadCartItems();
                } else if (item && item.quantity === 1) {
                    if (confirm(`Remove ${item.name} from cart?`)) {
                        removeFromCart(id);
                        loadCartItems();
                    }
                }
            });
        });
        
        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const cart = getCart();
                const item = cart.find(i => i.id === id);
                if (item) {
                    updateCartQuantity(id, item.quantity + 1);
                    loadCartItems();
                }
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const cart = getCart();
                const item = cart.find(i => i.id === id);
                if (item && confirm(`Remove ${item.name} from cart?`)) {
                    removeFromCart(id);
                    loadCartItems();
                }
            });
        });
    }
    
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            const cart = getCart();
            if (cart.length === 0) {
                alert('Your cart is already empty.');
                return;
            }
            if (confirm('Are you sure you want to clear your entire cart?')) {
                clearCart();
                loadCartItems();
            }
        });
    }
    
    loadCartItems();
});