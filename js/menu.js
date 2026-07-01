// ============================================
// MENU PAGE FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const menuGrid = document.querySelector('.menu-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Load toppings from localStorage
    function getToppings() {
        const data = initAppData();
        return data.toppings || [];
    }
    
    // ============================================
    //  Update prices from localStorage
    // ============================================
    function updatePricesFromStorage() {
        const data = initAppData();
        const menuItems = data.menuItems;
        
        document.querySelectorAll('.btn-add').forEach(button => {
            const itemId = parseInt(button.getAttribute('data-id'));
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
                // Update the data-price attribute used when adding to cart
                button.setAttribute('data-price', item.price);
                // Update the displayed price on the card
                const itemInfo = button.closest('.item-info');
                if (itemInfo) {
                    const priceElement = itemInfo.querySelector('.item-price');
                    if (priceElement) {
                        priceElement.textContent = formatPrice(item.price);
                    }
                }
            }
        });
    }
    
    // Render toppings for a specific pizza
    function renderToppings(pizzaId, container) {
        const toppings = getToppings();
        if (toppings.length === 0) {
            container.innerHTML = '<p style="font-size: 0.8rem; color: #999; margin: 0.3rem 0;">No toppings available</p>';
            return;
        }
        
        let html = `
            <div class="toppings-section" style="margin: 0.5rem 0 0.8rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                <div style="font-size: 0.8rem; font-weight: 600; color: #2D3436; margin-bottom: 0.3rem;">
                    <i class="fas fa-plus-circle"></i> Add Toppings:
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
        `;
        
        toppings.forEach(topping => {
            html += `
                <label style="display: inline-flex; align-items: center; font-size: 0.75rem; cursor: pointer; background: white; padding: 0.2rem 0.5rem; border-radius: 12px; border: 1px solid #ddd;">
                    <input type="checkbox" class="topping-checkbox" data-pizza-id="${pizzaId}" data-topping-id="${topping.id}" data-topping-name="${topping.name}" data-topping-price="${topping.price}" style="margin-right: 0.3rem;">
                    ${topping.name} 
                    <span style="color: #E63946; font-weight: 600; margin-left: 0.2rem;">${formatPrice(topping.price)}</span>
                </label>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners to checkboxes to update button text
        container.querySelectorAll('.topping-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                const pizzaId = this.getAttribute('data-pizza-id');
                updateAddButtonText(pizzaId);
            });
        });
    }
    
    // Update "Add" button text to show total price with toppings
    function updateAddButtonText(pizzaId) {
        const checkboxes = document.querySelectorAll(`.topping-checkbox[data-pizza-id="${pizzaId}"]`);
        const button = document.querySelector(`.btn-add[data-id="${pizzaId}"]`);
        if (!button) return;
        
        const basePrice = parseFloat(button.getAttribute('data-price'));
        let toppingsPrice = 0;
        let selectedToppings = [];
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const price = parseFloat(cb.getAttribute('data-topping-price'));
                toppingsPrice += price;
                selectedToppings.push(cb.getAttribute('data-topping-name'));
            }
        });
        
        const totalPrice = basePrice + toppingsPrice;
        
        button.setAttribute('data-toppings', JSON.stringify(selectedToppings));
        button.setAttribute('data-toppings-price', toppingsPrice);
        
        if (selectedToppings.length > 0) {
            button.innerHTML = `<i class="fas fa-plus"></i> Add (${formatPrice(totalPrice)})`;
        } else {
            button.innerHTML = `<i class="fas fa-plus"></i> Add`;
        }
    }
    
    // Add event listeners to Add buttons
    menuGrid.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-add') || e.target.closest('.btn-add')) {
            const button = e.target.classList.contains('btn-add') ? e.target : e.target.closest('.btn-add');
            const itemId = parseInt(button.getAttribute('data-id'));
            const itemName = button.getAttribute('data-name');
            let itemPrice = parseFloat(button.getAttribute('data-price'));
            
            const isPizza = button.getAttribute('data-category') === 'pizza';
            let toppings = [];
            let toppingsPrice = 0;
            
            if (isPizza) {
                const checkboxes = document.querySelectorAll(`.topping-checkbox[data-pizza-id="${itemId}"]`);
                checkboxes.forEach(cb => {
                    if (cb.checked) {
                        const name = cb.getAttribute('data-topping-name');
                        const price = parseFloat(cb.getAttribute('data-topping-price'));
                        toppings.push({ name: name, price: price });
                        toppingsPrice += price;
                    }
                });
            }
            
            const finalPrice = itemPrice + toppingsPrice;
            
            addToCartWithToppings(itemId, itemName, finalPrice, toppings, 1);
            
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.style.background = 'linear-gradient(135deg, #06D6A0 0%, #118AB2 100%)';
            
            setTimeout(() => {
                if (isPizza) {
                    const selectedCount = document.querySelectorAll(`.topping-checkbox[data-pizza-id="${itemId}"]:checked`).length;
                    if (selectedCount > 0) {
                        const total = parseFloat(button.getAttribute('data-price')) + parseFloat(button.getAttribute('data-toppings-price') || 0);
                        button.innerHTML = `<i class="fas fa-plus"></i> Add (${formatPrice(total)})`;
                    } else {
                        button.innerHTML = `<i class="fas fa-plus"></i> Add`;
                    }
                } else {
                    button.innerHTML = `<i class="fas fa-plus"></i> Add`;
                }
                button.style.background = '#2A9D8F';
            }, 1000);
        }
    });
    
    // Add to cart with toppings
    window.addToCartWithToppings = function(itemId, itemName, itemPrice, toppings, quantity = 1) {
        const data = initAppData();
        
        const existingItem = data.cart.find(item => item.id === itemId);
        
        let displayName = itemName;
        if (toppings && toppings.length > 0) {
            const toppingNames = toppings.map(t => t.name).join(', ');
            displayName = `${itemName} (${toppingNames})`;
        }
        
        if (existingItem) {
            existingItem.quantity += quantity;
            if (toppings && toppings.length > 0 && !existingItem.toppings) {
                existingItem.toppings = toppings;
            }
        } else {
            data.cart.push({
                id: itemId,
                name: displayName,
                baseName: itemName,
                price: itemPrice,
                quantity: quantity,
                toppings: toppings || [],
                basePrice: itemPrice - (toppings ? toppings.reduce((sum, t) => sum + t.price, 0) : 0)
            });
        }
        
        localStorage.setItem('charliesPizzeria', JSON.stringify(data));
        updateCartCount();
        return true;
    }
    
    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            const menuItems = document.querySelectorAll('.menu-item');
            
            menuItems.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Initialize toppings for all pizza items
    function initializeToppings() {
        const pizzaItems = document.querySelectorAll('.menu-item[data-category="pizza"]');
        pizzaItems.forEach(item => {
            let toppingsContainer = item.querySelector('.toppings-container');
            if (!toppingsContainer) {
                const itemInfo = item.querySelector('.item-info');
                if (itemInfo) {
                    const footer = itemInfo.querySelector('.item-footer');
                    toppingsContainer = document.createElement('div');
                    toppingsContainer.className = 'toppings-container';
                    if (footer) {
                        itemInfo.insertBefore(toppingsContainer, footer);
                    } else {
                        itemInfo.appendChild(toppingsContainer);
                    }
                }
            }
            
            if (toppingsContainer) {
                const pizzaId = parseInt(item.querySelector('.btn-add').getAttribute('data-id'));
                renderToppings(pizzaId, toppingsContainer);
            }
        });
    }
    
    // Run price update first, then initialize toppings
    updatePricesFromStorage();
    setTimeout(initializeToppings, 100);
});
