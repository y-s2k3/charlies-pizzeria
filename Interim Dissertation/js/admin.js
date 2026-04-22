// ============================================
// ADMIN PAGE FUNCTIONALITY 
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.type !== 'admin') {
        alert('Admin access required. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Display admin name
    const sidebarHeader = document.querySelector('.sidebar-header p');
    if (sidebarHeader) {
        sidebarHeader.textContent = `Logged in as: ${currentUser.name}`;
    }
    
    const ordersContainer = document.getElementById('ordersContainer');
    const todayOrdersElement = document.getElementById('todayOrdersCount');
    const todayRevenueElement = document.getElementById('todayRevenue');
    const totalCustomersElement = document.getElementById('totalCustomers');
    const totalRevenueElement = document.getElementById('totalRevenue');
    
    // Initialize staff data if not exists
    function initStaffData() {
        if (!localStorage.getItem('staffData')) {
            const staffData = {
                chefs: [
                    { id: 1, name: "Marco Rossi", role: "Head Chef", status: "active", shift: "Morning" },
                    { id: 2, name: "Giuseppe Verdi", role: "Junior Chef", status: "active", shift: "Evening" }
                ],
                cashiers: [
                    { id: 1, name: "Emma Watson", role: "Senior Cashier", status: "active", shift: "Morning" },
                    { id: 2, name: "James Brown", role: "Cashier", status: "active", shift: "Evening" }
                ],
                deliveryDrivers: [
                    { id: 1, name: "David Miller", role: "Delivery Driver", status: "active", vehicle: "Scooter" },
                    { id: 2, name: "Sarah Johnson", role: "Delivery Driver", status: "active", vehicle: "Car" },
                    { id: 3, name: "Mike Wilson", role: "Senior Driver", status: "active", vehicle: "Scooter" }
                ]
            };
            localStorage.setItem('staffData', JSON.stringify(staffData));
        }
        return JSON.parse(localStorage.getItem('staffData'));
    }
    
    // Function to show analytics modal with charts 
    function showAnalyticsModal() {
        const allOrders = getAllOrdersForRevenue();
        const activeOrders = getAllOrders();
        
        // Calculate revenue by month for the last 6 months
        const months = [];
        const revenueData = [];
        const orderCounts = [];
        
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            months.push(`${monthName} ${year}`);
            
            const monthOrders = allOrders.filter(order => {
                const orderDate = new Date(order.timestamp);
                return orderDate.getMonth() === date.getMonth() && 
                       orderDate.getFullYear() === date.getFullYear();
            });
            
            const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
            revenueData.push(monthRevenue);
            orderCounts.push(monthOrders.length);
        }
        
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = allOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Create modal with full styling
        const modal = document.createElement('div');
        modal.className = 'analytics-modal';
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
            z-index: 10002;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 24px; padding: 2rem; max-width: 800px; width: 90%; max-height: 85vh; overflow-y: auto;">
                <h2 style="color: #E63946; margin-bottom: 1rem;">
                    <i class="fas fa-chart-line"></i> Analytics Dashboard
                </h2>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 16px;">
                        <div style="font-size: 1.8rem; font-weight: bold; color: #E63946;">${totalOrders}</div>
                        <div style="font-size: 0.8rem; color: #666;">Total Orders</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 16px;">
                        <div style="font-size: 1.8rem; font-weight: bold; color: #E63946;">${formatPrice(totalRevenue)}</div>
                        <div style="font-size: 0.8rem; color: #666;">Total Revenue</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 16px;">
                        <div style="font-size: 1.8rem; font-weight: bold; color: #E63946;">${formatPrice(avgOrderValue)}</div>
                        <div style="font-size: 0.8rem; color: #666;">Average Order Value</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 16px;">
                        <div style="font-size: 1.8rem; font-weight: bold; color: #E63946;">${activeOrders.length}</div>
                        <div style="font-size: 0.8rem; color: #666;">Active Orders</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 16px;">
                    <h3 style="margin-bottom: 1rem;">Revenue by Month</h3>
                    <canvas id="revenueChart" style="max-height: 250px; width: 100%;"></canvas>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 16px;">
                    <h3 style="margin-bottom: 1rem;">Orders by Month</h3>
                    <canvas id="ordersChart" style="max-height: 250px; width: 100%;"></canvas>
                </div>
                
                <button id="closeAnalyticsBtn" style="background: #E63946; color: white; border: none; padding: 0.8rem; border-radius: 12px; cursor: pointer; width: 100%; margin-top: 1rem;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(function() {
            const revenueCtx = document.getElementById('revenueChart');
            if (revenueCtx) {
                new Chart(revenueCtx, {
                    type: 'bar',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Revenue (£)',
                            data: revenueData,
                            backgroundColor: 'rgba(230, 57, 70, 0.7)',
                            borderColor: '#E63946',
                            borderWidth: 1,
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: { callbacks: { label: function(context) { return `£${context.raw.toFixed(2)}`; } } }
                        }
                    }
                });
            }
            
            const ordersCtx = document.getElementById('ordersChart');
            if (ordersCtx) {
                new Chart(ordersCtx, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Number of Orders',
                            data: orderCounts,
                            backgroundColor: 'rgba(42, 157, 143, 0.2)',
                            borderColor: '#2A9D8F',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: '#2A9D8F',
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: { legend: { position: 'top' } }
                    }
                });
            }
        }, 100);
        
        document.getElementById('closeAnalyticsBtn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    // Function to show staff list modal with full styling
    function showStaffList() {
        const users = initAppData().users;
        const staff = initStaffData();
        
        const customers = users.filter(u => u.type === 'customer');
        const admins = users.filter(u => u.type === 'admin');
        
        let staffHTML = '<div style="max-height: 500px; overflow-y: auto;">';
        
        // CHEFS SECTION
        staffHTML += `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #E63946;"><i class="fas fa-utensils"></i> Chefs (${staff.chefs.length})</h3>
                <table style="width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 12px;">
                    <thead style="background: #E63946; color: white;">
                        <tr><th style="padding: 8px;">Name</th><th>Role</th><th>Shift</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${staff.chefs.map(chef => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;"><strong>${chef.name}</strong></td>
                                <td style="padding: 8px;">${chef.role}</td>
                                <td style="padding: 8px;">${chef.shift}</td>
                                <td style="padding: 8px;"><span style="background: #2A9D8F; color: white; padding: 2px 8px; border-radius: 12px;">${chef.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // CASHIERS SECTION
        staffHTML += `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #F4A261;"><i class="fas fa-cash-register"></i> Cashiers (${staff.cashiers.length})</h3>
                <table style="width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 12px;">
                    <thead style="background: #F4A261; color: white;">
                        <tr><th style="padding: 8px;">Name</th><th>Role</th><th>Shift</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${staff.cashiers.map(cashier => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;"><strong>${cashier.name}</strong></td>
                                <td style="padding: 8px;">${cashier.role}</td>
                                <td style="padding: 8px;">${cashier.shift}</td>
                                <td style="padding: 8px;"><span style="background: #2A9D8F; color: white; padding: 2px 8px; border-radius: 12px;">${cashier.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // DELIVERY DRIVERS SECTION
        staffHTML += `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #118AB2;"><i class="fas fa-motorcycle"></i> Delivery Drivers (${staff.deliveryDrivers.length})</h3>
                <table style="width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 12px;">
                    <thead style="background: #118AB2; color: white;">
                        <tr><th style="padding: 8px;">Name</th><th>Role</th><th>Vehicle</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${staff.deliveryDrivers.map(driver => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;"><strong>${driver.name}</strong></td>
                                <td style="padding: 8px;">${driver.role}</td>
                                <td style="padding: 8px;"><i class="fas ${driver.vehicle === 'Scooter' ? 'fa-motorcycle' : 'fa-car'}"></i> ${driver.vehicle}</td>
                                <td style="padding: 8px;"><span style="background: #2A9D8F; color: white; padding: 2px 8px; border-radius: 12px;">${driver.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // ADMINISTRATORS SECTION
        staffHTML += `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #6c5ce7;"><i class="fas fa-crown"></i> Administrators (${admins.length})</h3>
                <table style="width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 12px;">
                    <thead style="background: #6c5ce7; color: white;">
                        <tr><th style="padding: 8px;">Name</th><th>Email</th><th>Role</th></tr>
                    </thead>
                    <tbody>
                        ${admins.map(admin => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;"><strong>${admin.name}</strong></td>
                                <td style="padding: 8px;">${admin.email}</td>
                                <td style="padding: 8px;"><span style="background: #6c5ce7; color: white; padding: 2px 8px; border-radius: 12px;">System Admin</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // CUSTOMERS SECTION
        staffHTML += `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #2A9D8F;"><i class="fas fa-users"></i> Customers (${customers.length})</h3>
                <table style="width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 12px;">
                    <thead style="background: #2A9D8F; color: white;">
                        <tr><th style="padding: 8px;">Name</th><th>Email</th><th>Points</th></tr>
                    </thead>
                    <tbody>
                        ${customers.map(customer => {
                            const points = getUserPoints(customer.email);
                            return `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 8px;"><strong>${customer.name}</strong></td>
                                    <td style="padding: 8px;">${customer.email}</td>
                                    <td style="padding: 8px;"><span style="background: #FFD166; padding: 2px 8px; border-radius: 12px;">⭐ ${points} pts</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        staffHTML += '</div>';
        
        showModal({
            type: 'info',
            title: 'Staff & Users Directory',
            message: staffHTML,
            showCancelButton: false,
            confirmText: 'Close'
        });
    }
    
    // Function to show modal
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
            <div style="background: white; border-radius: 25px; padding: 2rem; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
                ${options.type === 'confirm' ? '<i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #E63946; margin-bottom: 1rem;"></i>' : '<i class="fas fa-users" style="font-size: 3rem; color: #E63946; margin-bottom: 1rem;"></i>'}
                <h3 style="margin-bottom: 1rem;">${options.title}</h3>
                <div style="color: #666; margin-bottom: 1.5rem;">${options.message}</div>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    ${options.showCancelButton ? '<button id="modalCancelBtn" style="background: #e0e0e0; color: #666; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; cursor: pointer;">Cancel</button>' : ''}
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
    
    // Function to show reports modal 
    function showReportsModal() {
        const allOrders = getAllOrdersForRevenue();
        const activeOrders = getAllOrders();
        const users = initAppData().users;
        const today = new Date().toDateString();
        
        const todayOrders = allOrders.filter(order => new Date(order.timestamp).toDateString() === today);
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
        const totalCustomers = users.filter(u => u.type === 'customer').length;
        
        const statusCounts = {
            1: allOrders.filter(o => o.status === 1 && !o.isDeleted).length,
            2: allOrders.filter(o => o.status === 2 && !o.isDeleted).length,
            3: allOrders.filter(o => o.status === 3 && !o.isDeleted).length,
            4: allOrders.filter(o => o.status === 4 && !o.isDeleted).length,
            5: allOrders.filter(o => o.status === 5 && !o.isDeleted).length
        };
        
        const modal = document.createElement('div');
        modal.className = 'reports-modal';
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
            z-index: 10001;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 24px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: #E63946; margin-bottom: 1rem;"><i class="fas fa-chart-line"></i> Sales Reports</h2>
                
                <div style="margin-bottom: 2rem; padding: 1rem; background: #F8F9FA; border-radius: 16px;">
                    <h3>Summary</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div style="text-align: center; padding: 0.8rem; background: white; border-radius: 12px;">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #E63946;">${activeOrders.length}</div>
                            <div style="font-size: 0.8rem;">Active Orders</div>
                        </div>
                        <div style="text-align: center; padding: 0.8rem; background: white; border-radius: 12px;">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #E63946;">${formatPrice(totalRevenue)}</div>
                            <div style="font-size: 0.8rem;">Total Revenue</div>
                        </div>
                        <div style="text-align: center; padding: 0.8rem; background: white; border-radius: 12px;">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #E63946;">${todayOrders.length}</div>
                            <div style="font-size: 0.8rem;">Today's Orders</div>
                        </div>
                        <div style="text-align: center; padding: 0.8rem; background: white; border-radius: 12px;">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #E63946;">${formatPrice(todayRevenue)}</div>
                            <div style="font-size: 0.8rem;">Today's Revenue</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem; padding: 1rem; background: #F8F9FA; border-radius: 16px;">
                    <h3>Orders by Status</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                        <div><strong>Ordered:</strong> ${statusCounts[1]}</div>
                        <div><strong>Preparing:</strong> ${statusCounts[2]}</div>
                        <div><strong>Baking:</strong> ${statusCounts[3]}</div>
                        <div><strong>Out for Delivery:</strong> ${statusCounts[4]}</div>
                        <div><strong>Delivered:</strong> ${statusCounts[5]}</div>
                    </div>
                </div>
                
                <button id="closeReportsBtn" style="background: #E63946; color: white; border: none; padding: 0.8rem; border-radius: 12px; cursor: pointer; width: 100%;">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('closeReportsBtn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    // Load and display orders with full styling
    function loadOrders() {
        const activeOrders = getAllOrders();
        const allOrdersForRevenue = getAllOrdersForRevenue();
        const users = initAppData().users;
        const today = new Date().toDateString();
        
        const todayOrders = allOrdersForRevenue.filter(order => new Date(order.timestamp).toDateString() === today);
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const totalRevenue = allOrdersForRevenue.reduce((sum, order) => sum + order.total, 0);
        const totalCustomers = users.filter(u => u.type === 'customer').length;
        
        if (todayOrdersElement) todayOrdersElement.textContent = todayOrders.length;
        if (todayRevenueElement) todayRevenueElement.textContent = formatPrice(todayRevenue);
        if (totalCustomersElement) totalCustomersElement.textContent = totalCustomers;
        if (totalRevenueElement) totalRevenueElement.textContent = formatPrice(totalRevenue);
        
        if (!ordersContainer) return;
        
        if (activeOrders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="no-orders" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-clipboard-list fa-3x" style="color: #ccc; margin-bottom: 20px;"></i>
                    <h3 style="color: #666;">No active orders</h3>
                    <p style="color: #999;">Delivered orders can be deleted to remove them from this list.</p>
                </div>
            `;
            return;
        }
        
        let ordersHTML = '';
        activeOrders.slice().reverse().forEach(order => {
            const statusClass = getStatusClass(order.status);
            const statusText = getStatusText(order.status);
            const orderDate = new Date(order.timestamp).toLocaleString();
            const showDeleteButton = order.status === 5;
            
            ordersHTML += `
                <div class="order-card" style="background: white; padding: 1rem; border-radius: 15px; margin-bottom: 1rem; border-left: 4px solid #E63946;">
                    <div class="order-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div>
                            <h3 style="margin: 0;">Order #${order.id}</h3>
                            <p style="font-size: 0.85rem; color: #888; margin-top: 5px;">${orderDate}</p>
                            <p style="font-size: 0.85rem; color: #666;"><strong>Customer Email:</strong> ${order.userEmail || 'N/A'}</p>
                        </div>
                        <span class="order-total" style="font-weight: bold; color: #E63946; font-size: 1.2rem;">${formatPrice(order.total)}</span>
                    </div>
                    <div class="order-customer" style="background: #f8f9fa; padding: 0.8rem; border-radius: 8px; margin: 0.5rem 0;">
                        <p><i class="fas fa-user"></i> ${order.customerName}</p>
                        <p><i class="fas fa-phone"></i> ${order.phone || 'No phone'}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${order.address || 'No address'}</p>
                    </div>
                    <div class="order-items" style="margin: 0.5rem 0; padding: 0.5rem 0; color: #555; font-size: 0.9rem;">
                        <strong>Items:</strong> ${order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </div>
                    <div class="order-status-badge" style="margin: 0.5rem 0;">
                        <span class="status status-${statusClass}" style="display: inline-block; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: ${getStatusColor(order.status)}; color: white;">${statusText}</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <button class="btn-update" data-order="${order.id}" style="background: linear-gradient(135deg, #6a11cb, #2575fc); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-sync-alt"></i> Update Status
                        </button>
                        ${showDeleteButton ? `<button class="btn-delete" data-order="${order.id}" style="background: #E63946; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-trash-alt"></i> Delete Order
                        </button>` : ''}
                    </div>
                </div>
            `;
        });
        
        ordersContainer.innerHTML = ordersHTML;
        
        document.querySelectorAll('.btn-update').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = parseInt(this.getAttribute('data-order'));
                updateOrderStatusPopup(orderId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = parseInt(this.getAttribute('data-order'));
                confirmDeleteOrder(orderId);
            });
        });
    }
    
    function getStatusColor(status) {
        const colors = { 1: '#6c5ce7', 2: '#fdcb6e', 3: '#e17055', 4: '#00b894', 5: '#0984e3' };
        return colors[status] || '#6c5ce7';
    }
    
    function getStatusClass(status) {
        const classes = { 1: 'ordered', 2: 'preparing', 3: 'baking', 4: 'delivering', 5: 'delivered' };
        return classes[status] || 'ordered';
    }
    
    function confirmDeleteOrder(orderId) {
        const order = getOrder(orderId);
        if (!order) return;
        
        showModal({
            type: 'confirm',
            title: 'Delete Order?',
            message: `Are you sure you want to delete Order #${orderId} for ${order.customerName}? This will remove it from the active orders list but will NOT affect revenue reports.`,
            showCancelButton: true,
            confirmText: 'Yes, Delete Order',
            onConfirm: function() {
                const result = deleteOrder(orderId);
                if (result.success) {
                    showModal({
                        type: 'success',
                        title: 'Order Deleted',
                        message: result.message,
                        showCancelButton: false,
                        confirmText: 'OK',
                        onConfirm: function() { loadOrders(); }
                    });
                } else {
                    showModal({
                        type: 'confirm',
                        title: 'Cannot Delete',
                        message: result.message,
                        showCancelButton: false,
                        confirmText: 'OK'
                    });
                }
            }
        });
    }
    
    function updateOrderStatusPopup(orderId) {
        const order = getOrder(orderId);
        if (!order) return;
        
        const newStatus = prompt(
            `Update status for Order #${orderId}\n\nCustomer: ${order.customerName}\nTotal: ${formatPrice(order.total)}\nCurrent Status: ${getStatusText(order.status)}\n\n1=Ordered, 2=Preparing, 3=Baking, 4=Out for Delivery, 5=Delivered`,
            order.status
        );
        
        if (newStatus !== null) {
            const statusNum = parseInt(newStatus);
            if (statusNum >= 1 && statusNum <= 5 && statusNum !== order.status) {
                if (updateOrderStatus(orderId, statusNum)) {
                    alert(`Order #${orderId} status updated to: ${getStatusText(statusNum)}`);
                    loadOrders();
                }
            } else if (statusNum === order.status) {
                alert('Order is already at this status.');
            }
        }
    }
    
    // Initialize
    initStaffData();
    
    // Event listeners
    document.getElementById('navReports')?.addEventListener('click', (e) => { e.preventDefault(); showReportsModal(); });
    document.getElementById('reportsBtn')?.addEventListener('click', () => { showReportsModal(); });
    document.getElementById('manageStaffBtn')?.addEventListener('click', () => { showStaffList(); });
    document.getElementById('viewAnalyticsBtn')?.addEventListener('click', () => { showAnalyticsModal(); });
    
    const adminLogout = document.getElementById('adminLogout');
    if (adminLogout) {
        adminLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
            window.location.href = 'index.html';
        });
    }
    
    loadOrders();
});