// ============================================
// REGISTER PAGE FUNCTIONALITY 
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validation
            if (!fullName || !email || !password || !confirmPassword) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('Please enter a valid email address', 'error');
                return;
            }
            
            // Check password length
            if (password.length < 3) {
                showMessage('Password must be at least 3 characters long', 'error');
                return;
            }
            
            // Check password match
            if (password !== confirmPassword) {
                showMessage('Passwords do not match', 'error');
                return;
            }
            
            // Get existing data from localStorage DIRECTLY
            let data = JSON.parse(localStorage.getItem('charliesPizzeria'));
            
            // If no data exists, create default structure
            if (!data) {
                data = {
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
            }
            
            // Check if user already exists
            const existingUser = data.users.find(user => user.email === email);
            
            if (existingUser) {
                showMessage('This email is already registered. Please login instead.', 'error');
                return;
            }
            
            // Create new user
            const newUser = {
                email: email,
                password: password,
                name: fullName,
                type: 'customer'
            };
            
            // Add to users array
            data.users.push(newUser);
            
            // Save back to localStorage
            localStorage.setItem('charliesPizzeria', JSON.stringify(data));
            
            // Success - auto login
            showMessage(`Account created successfully! Welcome ${fullName}!`, 'success');
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Account Created!';
            submitBtn.style.background = 'linear-gradient(135deg, #06D6A0 0%, #118AB2 100%)';
            
            // Auto-login after registration
            setTimeout(() => {
                // Manually set current user
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                window.location.href = 'menu.html';
            }, 1500);
        });
    }
    
    // Helper function to show messages
    function showMessage(message, type) {
        let messageContainer = document.querySelector('.form-message');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'form-message';
            const form = document.getElementById('registerForm');
            form.insertBefore(messageContainer, form.firstChild);
        }
        
        messageContainer.textContent = message;
        messageContainer.style.padding = '12px';
        messageContainer.style.borderRadius = '10px';
        messageContainer.style.marginBottom = '20px';
        messageContainer.style.fontWeight = '500';
        
        if (type === 'error') {
            messageContainer.style.background = '#ffe0e0';
            messageContainer.style.color = '#d32f2f';
            messageContainer.style.border = '1px solid #d32f2f';
        } else {
            messageContainer.style.background = '#e0ffe0';
            messageContainer.style.color = '#2e7d32';
            messageContainer.style.border = '1px solid #2e7d32';
        }
        
        setTimeout(() => {
            if (messageContainer) {
                messageContainer.style.opacity = '0';
                setTimeout(() => {
                    if (messageContainer) messageContainer.remove();
                }, 500);
            }
        }, 3000);
    }
});