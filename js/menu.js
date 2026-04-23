// ============================================
// MENU PAGE FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const menuGrid = document.querySelector('.menu-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Add event listeners to Add buttons
    menuGrid.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-add') || e.target.closest('.btn-add')) {
            const button = e.target.classList.contains('btn-add') ? e.target : e.target.closest('.btn-add');
            const itemId = parseInt(button.getAttribute('data-id'));
            const itemName = button.getAttribute('data-name');
            const itemPrice = parseFloat(button.getAttribute('data-price'));
            
            addToCart(itemId, itemName, itemPrice);
            
            // Show feedback
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.style.background = 'linear-gradient(135deg, #06D6A0 0%, #118AB2 100%)';
            
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-plus"></i> Add';
                button.style.background = 'linear-gradient(135deg, #06D6A0 0%, #118AB2 100%)';
            }, 1000);
        }
    });
    
    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items
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
});