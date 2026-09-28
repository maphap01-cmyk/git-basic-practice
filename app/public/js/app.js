document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const recipeGrid = document.getElementById('recipeGrid');
    const categoryChips = document.getElementById('categoryChips');
    const ingredientFilter = document.getElementById('ingredientFilter');
    const searchInput = document.getElementById('searchInput');
    const btnSearch = document.getElementById('btnSearch');
    
    // Stats Elements
    const statRecipes = document.getElementById('statRecipes');
    const statCategories = document.getElementById('statCategories');
    const statIngredients = document.getElementById('statIngredients');
    const statReviews = document.getElementById('statReviews');

    // Modals
    const detailModal = document.getElementById('detailModal');
    const detailModalBody = document.getElementById('detailModalBody');
    const btnCloseDetail = document.getElementById('btnCloseDetail');

    const addModal = document.getElementById('addModal');
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnCloseAdd = document.getElementById('btnCloseAdd');
    const btnCancelAdd = document.getElementById('btnCancelAdd');
    const addRecipeForm = document.getElementById('addRecipeForm');
    const addCategorySelect = document.getElementById('addCategorySelect');

    const adminModal = document.getElementById('adminModal');
    const btnAdminLinks = document.getElementById('btnAdminLinks');
    const btnCloseAdmin = document.getElementById('btnCloseAdmin');

    let currentCategoryId = '';
    let currentIngredientId = '';
    let currentSearchTerm = '';

    // Initialize App
    init();

    async function init() {
        await fetchStats();
        await fetchCategories();
        await fetchIngredients();
        await fetchRecipes();

        setupEventListeners();
    }

    // 1. Fetch Stats Overview
    async function fetchStats() {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            statRecipes.textContent = data.recipes || 0;
            statCategories.textContent = data.categories || 0;
            statIngredients.textContent = data.ingredients || 0;
            statReviews.textContent = data.reviews || 0;
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }

    // 2. Fetch Categories for Chips & Select
    async function fetchCategories() {
        try {
            const res = await fetch('/api/categories');
            const categories = await res.json();

            // Render category chips
            categoryChips.innerHTML = `
                <button class="chip ${currentCategoryId === '' ? 'active' : ''}" data-id="">Tất Cả Món</button>
                ${categories.map(c => `
                    <button class="chip ${currentCategoryId == c.id ? 'active' : ''}" data-id="${c.id}">
                        <i class="fa-solid fa-${c.icon || 'utensils'}"></i> ${c.name}
                    </button>
                `).join('')}
            `;

            // Render select in add modal
            addCategorySelect.innerHTML = categories.map(c => `
                <option value="${c.id}">${c.name}</option>
            `).join('');

        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }

    // 3. Fetch Ingredients for Filter Dropdown
    async function fetchIngredients() {
        try {
            const res = await fetch('/api/ingredients');
            const ingredients = await res.json();
            ingredientFilter.innerHTML = `
                <option value="">Lọc theo tất cả nguyên liệu...</option>
                ${ingredients.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
            `;
        } catch (err) {
            console.error('Error fetching ingredients:', err);
        }
    }

    // 4. Fetch Recipes based on active filters
    async function fetchRecipes() {
        try {
            recipeGrid.innerHTML = `
                <div class="card-skeleton"></div>
                <div class="card-skeleton"></div>
                <div class="card-skeleton"></div>
            `;

            const queryParams = new URLSearchParams();
            if (currentCategoryId) queryParams.append('category_id', currentCategoryId);
            if (currentIngredientId) queryParams.append('ingredient_id', currentIngredientId);
            if (currentSearchTerm) queryParams.append('search', currentSearchTerm);

            const res = await fetch(`/api/recipes?${queryParams.toString()}`);
            const recipes = await res.json();

            renderRecipes(recipes);
        } catch (err) {
            console.error('Error fetching recipes:', err);
            recipeGrid.innerHTML = `<p class="error-msg">Không thể tải danh sách công thức. Vui lòng thử lại sau.</p>`;
        }
    }

    // Render Recipe Cards
    function renderRecipes(recipes) {
        if (!recipes || recipes.length === 0) {
            recipeGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <i class="fa-solid fa-cookie-bite" style="font-size: 3rem; color: #64748b; margin-bottom: 16px;"></i>
                    <h3 style="font-size: 1.4rem;">Chưa tìm thấy công thức nào!</h3>
                    <p style="color: #94a3b8; margin-top: 8px;">Thử thay đổi từ khóa hoặc bộ lọc danh mục xem sao.</p>
                </div>
            `;
            return;
        }

        recipeGrid.innerHTML = recipes.map(r => `
            <div class="recipe-card">
                <div class="recipe-card-img">
                    <img src="${r.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}" alt="${r.title}">
                    <span class="category-tag"><i class="fa-solid fa-${r.category_icon || 'utensils'}"></i> ${r.category_name || 'Khác'}</span>
                    <span class="rating-tag"><i class="fa-solid fa-star"></i> ${parseFloat(r.avg_rating || 5).toFixed(1)} (${r.review_count || 0})</span>
                </div>
                <div class="recipe-card-body">
                    <h3 class="recipe-card-title">${r.title}</h3>
                    <p class="recipe-card-desc">${r.description || 'Công thức thơm ngon độc đáo cho bữa ăn gia đình.'}</p>
                    <div class="recipe-meta">
                        <span class="recipe-meta-item"><i class="fa-regular fa-clock"></i> Nấu: ${r.cook_time || 30}m</span>
                        <span class="recipe-meta-item"><i class="fa-solid fa-fire"></i> ${r.calories || 350} kcal</span>
                        <span class="recipe-meta-item"><i class="fa-solid fa-signal"></i> ${r.difficulty || 'Dễ'}</span>
                    </div>
                </div>
                <div class="recipe-card-footer">
                    <button class="btn btn-outline btn-delete" data-id="${r.id}" title="Xóa món ăn" style="padding: 10px 14px;">
                        <i class="fa-solid fa-trash-can" style="color: #ef4444;"></i>
                    </button>
                    <button class="btn btn-primary btn-view-recipe" data-id="${r.id}" style="flex: 1; justify-content: center;">
                        <i class="fa-solid fa-book-open"></i> Xem Công Thức
                    </button>
                </div>
            </div>
        `).join('');

        // Attach Card Click Handlers
        document.querySelectorAll('.btn-view-recipe').forEach(btn => {
            btn.addEventListener('click', () => openRecipeDetail(btn.getAttribute('data-id')));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRecipe(btn.getAttribute('data-id'));
            });
        });
    }

    // 5. Open Detailed Recipe Modal
    async function openRecipeDetail(id) {
        try {
            detailModalBody.innerHTML = `<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
            detailModal.classList.add('active');

            const res = await fetch(`/api/recipes/${id}`);
            const recipe = await res.json();

            detailModalBody.innerHTML = `
                <img src="${recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}" class="detail-hero-img" alt="${recipe.title}">
                
                <h2 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; margin-bottom: 12px;">${recipe.title}</h2>
                
                <div class="detail-header-badges">
                    <span class="detail-badge"><i class="fa-solid fa-layer-group"></i> ${recipe.category_name}</span>
                    <span class="detail-badge"><i class="fa-regular fa-clock"></i> Chuẩn bị: ${recipe.prep_time}m</span>
                    <span class="detail-badge"><i class="fa-solid fa-stopwatch"></i> Nấu: ${recipe.cook_time}m</span>
                    <span class="detail-badge"><i class="fa-solid fa-users"></i> ${recipe.servings} người</span>
                    <span class="detail-badge"><i class="fa-solid fa-fire"></i> ${recipe.calories} kcal</span>
                    <span class="detail-badge"><i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${parseFloat(recipe.avg_rating || 5).toFixed(1)} / 5 (${recipe.review_count} đánh giá)</span>
                </div>

                <p style="color: #94a3b8; margin-bottom: 24px; font-size: 1rem;">${recipe.description}</p>

                <h3 style="font-size: 1.3rem; margin-bottom: 12px;"><i class="fa-solid fa-basket-shopping" style="color: #f97316;"></i> Nguyên Liệu Cần Thuyết</h3>
                <div class="detail-ingredients-grid">
                    ${recipe.ingredients && recipe.ingredients.length > 0 ? recipe.ingredients.map(ing => `
                        <div class="ingredient-item">
                            <i class="fa-solid fa-${ing.icon || 'leaf'}" style="color: #10b981;"></i>
                            <span><strong>${ing.quantity} ${ing.unit || ''}</strong> ${ing.ingredient_name}</span>
                        </div>
                    `).join('') : '<p style="color: #94a3b8;">Chưa cập nhật chi tiết định lượng nguyên liệu.</p>'}
                </div>

                <h3 style="font-size: 1.3rem; margin-bottom: 12px;"><i class="fa-solid fa-list-ol" style="color: #f97316;"></i> Hướng Dẫn Thực Hiện</h3>
                <div class="instructions-list">
                    ${recipe.instructions}
                </div>

                <!-- Reviews Section -->
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; margin-top: 24px;">
                    <h3 style="font-size: 1.3rem; margin-bottom: 16px;"><i class="fa-solid fa-comments" style="color: #f97316;"></i> Bình Luận & Đánh Giá</h3>
                    
                    <!-- Add Review Form -->
                    <form id="addReviewForm" style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: var(--glass-border); margin-bottom: 20px;">
                        <div class="form-row" style="margin-bottom: 10px;">
                            <input type="text" id="reviewAuthor" placeholder="Tên của bạn..." required style="flex:1;">
                            <select id="reviewRating" style="width: 140px;">
                                <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                                <option value="3">⭐⭐⭐ (3/5)</option>
                            </select>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <input type="text" id="reviewComment" placeholder="Viết nhận xét của bạn về món ăn này..." required style="flex:1;">
                            <button type="submit" class="btn btn-primary" style="white-space:nowrap;">Gửi</button>
                        </div>
                    </form>

                    <!-- Reviews List -->
                    <div class="reviews-list">
                        ${recipe.reviews && recipe.reviews.length > 0 ? recipe.reviews.map(rev => `
                            <div style="background: rgba(255,255,255,0.03); border: var(--glass-border); padding: 12px 16px; border-radius: 10px; margin-bottom: 10px;">
                                <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                                    <strong>${rev.author}</strong>
                                    <span style="color:#f59e0b;">${'⭐'.repeat(rev.rating)}</span>
                                </div>
                                <p style="color:#cbd5e1; font-size:0.9rem;">${rev.comment}</p>
                            </div>
                        `).join('') : '<p style="color: #94a3b8;">Chưa có bình luận nào. Hãy là người đầu tiên thưởng thức và để lại nhận xét!</p>'}
                    </div>
                </div>
            `;

            // Attach Review Submit Listener
            document.getElementById('addReviewForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const author = document.getElementById('reviewAuthor').value;
                const rating = document.getElementById('reviewRating').value;
                const comment = document.getElementById('reviewComment').value;

                try {
                    await fetch(`/api/recipes/${id}/reviews`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ author, rating, comment })
                    });
                    openRecipeDetail(id); // Reload detail modal
                    fetchStats(); // Update stats
                } catch (err) {
                    alert('Lỗi gửi bình luận: ' + err.message);
                }
            });

        } catch (err) {
            console.error('Error loading recipe detail:', err);
            detailModalBody.innerHTML = `<p class="error-msg">Không thể tải thông tin chi tiết món ăn.</p>`;
        }
    }

    // 6. Delete Recipe
    async function deleteRecipe(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa công thức món ăn này?')) return;
        try {
            const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRecipes();
                fetchStats();
            } else {
                alert('Không thể xóa món ăn này.');
            }
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    }

    // 7. Event Listeners Setup
    function setupEventListeners() {
        // Search Click & Enter Key
        btnSearch.addEventListener('click', () => {
            currentSearchTerm = searchInput.value.trim();
            fetchRecipes();
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                currentSearchTerm = searchInput.value.trim();
                fetchRecipes();
            }
        });

        // Category Chips Click
        categoryChips.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            currentCategoryId = chip.getAttribute('data-id');
            fetchRecipes();
        });

        // Ingredient Filter Select
        ingredientFilter.addEventListener('change', (e) => {
            currentIngredientId = e.target.value;
            fetchRecipes();
        });

        // Add Recipe Form Submit
        addRecipeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addRecipeForm);
            const payload = Object.fromEntries(formData.entries());

            try {
                const res = await fetch('/api/recipes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    addModal.classList.remove('active');
                    addRecipeForm.reset();
                    fetchRecipes();
                    fetchStats();
                    alert(' Đã thêm công thức món ăn thành công!');
                } else {
                    const data = await res.json();
                    alert(' Lỗi: ' + (data.message || 'Không thể thêm công thức.'));
                }
            } catch (err) {
                alert(' Lỗi kết nối: ' + err.message);
            }
        });

        // Modal Open/Close Controls
        btnOpenAddModal.addEventListener('click', () => addModal.classList.add('active'));
        btnCloseAdd.addEventListener('click', () => addModal.classList.remove('active'));
        btnCancelAdd.addEventListener('click', () => addModal.classList.remove('active'));

        btnCloseDetail.addEventListener('click', () => detailModal.classList.remove('active'));

        btnAdminLinks.addEventListener('click', () => adminModal.classList.add('active'));
        btnCloseAdmin.addEventListener('click', () => adminModal.classList.remove('active'));

        // Close when clicking overlay
        [detailModal, addModal, adminModal].forEach(modal => {
            modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.remove('active'));
        });
    }
});
