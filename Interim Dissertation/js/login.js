// ============================================
// LOGIN PAGE FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Validation
            if (!email || !password) {
                showMessage('Please enter both email and password', 'error');
                return;
            }
            
            // Attempt login using the function from app.js
            const user = loginUser(email, password);
            
            if (user) {
                // Success - show success message
                showMessage(`Welcome back, ${user.name}! Redirecting...`, 'success');
                
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                submitBtn.style.background = 'linear-gradient(135deg, #06D6A0 0%, #118AB2 100%)';
                
                setTimeout(() => {
                    // Redirect based on user type
                    if (user.type === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'menu.html';
                    }
                }, 1500);
            } else {
                // Error - show specific message
                const data = initAppData();
                const existingUser = data.users.find(u => u.email === email);
                
                if (!existingUser) {
                    showMessage('Email not found. Please register first.', 'error');
                } else {
                    showMessage('Incorrect password. Please try again.', 'error');
                }
                
                // Visual feedback on button
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-times"></i> Login Failed';
                submitBtn.style.background = 'linear-gradient(135deg, #FF4757 0%, #FF6B6B 100%)';
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #FFA726 100%)';
                }, 2000);
            }
        });
    }
    
    // Helper function to show messages
    function showMessage(message, type) {
        // Remove existing message container
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message container
        const messageContainer = document.createElement('div');
        messageContainer.className = `form-message ${type}`;
        messageContainer.textContent = message;
        
        // Insert at top of form
        const form = document.getElementById('loginForm');
        form.insertBefore(messageContainer, form.firstChild);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageContainer) {
                messageContainer.style.opacity = '0';
                setTimeout(() => messageContainer.remove(), 500);
            }
        }, 3000);
    }
});