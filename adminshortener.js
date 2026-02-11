// ======================
// admin-shortener.js
// Complete URL Shortener Admin Panel
// ======================

// ======================
// SUPABASE CONFIG
// ======================
const SUPABASE_URL = "https://diwjkvrzcewnhoybruum.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU";

// ======================
// GLOBAL VARIABLES
// ======================
let supabaseClient;
let charts = {};
let currentPage = 'dashboard';

// ======================
// INITIALIZATION
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Admin Shortener Initializing...');
    
    try {
        // Initialize Supabase
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient;
        
        // Test connection
        await testConnection();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize Select2
        initializeSelect2();
        
        // Load initial data
        await loadDashboardData();
        await loadLinks();
        await loadCategories();
        
        console.log('✅ Admin Shortener Ready');
        
    } catch (error) {
        console.error('❌ Init error:', error);
        showMessage('error', 'Gagal inisialisasi sistem', error.message);
    }
});

// ======================
// TEST DATABASE CONNECTION
// ======================
async function testConnection() {
    try {
        // Check if short_links table exists, create if not
        const { error } = await supabaseClient
            .from('short_links')
            .select('id')
            .limit(1);
            
        if (error && error.code === '42P01') {
            console.log('📦 Creating short_links table...');
            await createTables();
        }
        
        console.log('✅ Database connection successful');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
    }
}

// ======================
// CREATE TABLES
// ======================
async function createTables() {
    // Note: This is a placeholder. In production, tables should be created via Supabase Dashboard
    console.log('Please create the following tables in Supabase Dashboard:');
    console.log(`
    1. short_links:
    - id (text, primary key)
    - title (text)
    - description (text)
    - destination_url (text)
    - content_type (text)
    - category (text)
    - ad_timer (int4)
    - ad_count (int4)
    - scroll_required (bool)
    - password (text)
    - expiry_date (timestamp)
    - max_clicks (int4)
    - views (int4)
    - created_at (timestamp)
    - last_click (timestamp)
    - is_active (bool)
    - custom_alias (text)
    
    2. clicks:
    - id (int8, primary key)
    - link_id (text)
    - ip_address (text)
    - user_agent (text)
    - referer (text)
    - country (text)
    - device (text)
    - browser (text)
    - clicked_at (timestamp)
    
    3. categories:
    - id (int8, primary key)
    - name (text)
    - slug (text)
    - color (text)
    - icon (text)
    - created_at (timestamp)
    `);
}

// ======================
// SETUP EVENT LISTENERS
// ======================
function setupEventListeners() {
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
            const page = link.dataset.page;
            showPage(page);
        });
    });
    
    // Content Type Selector
    const typeItems = document.querySelectorAll('.type-item');
    typeItems.forEach(item => {
        item.addEventListener('click', () => {
            typeItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            updateUrlPreview();
        });
    });
    
    // URL Input
    const urlInput = document.getElementById('destinationUrl');
    if (urlInput) {
        urlInput.addEventListener('input', updateUrlPreview);
    }
    
    // Title Input
    const titleInput = document.getElementById('linkTitle');
    if (titleInput) {
        titleInput.addEventListener('input', updateUrlPreview);
    }
    
    // Create Link Button
    const createBtn = document.getElementById('createLinkBtn');
    if (createBtn) {
        createBtn.addEventListener('click', handleCreateLink);
    }
    
    // Test URL Button
    const testBtn = document.getElementById('testUrlBtn');
    if (testBtn) {
        testBtn.addEventListener('click', testDestinationUrl);
    }
    
    // Password Protect Checkbox
    const passwordCheckbox = document.getElementById('passwordProtect');
    const passwordInput = document.getElementById('linkPassword');
    if (passwordCheckbox && passwordInput) {
        passwordCheckbox.addEventListener('change', () => {
            passwordInput.disabled = !passwordCheckbox.checked;
            if (!passwordCheckbox.checked) passwordInput.value = '';
        });
    }
    
    // Expiry Date Checkbox
    const expiryCheckbox = document.getElementById('expiryDate');
    const expiryInput = document.getElementById('linkExpiry');
    if (expiryCheckbox && expiryInput) {
        expiryCheckbox.addEventListener('change', () => {
            expiryInput.disabled = !expiryCheckbox.checked;
            if (!expiryCheckbox.checked) expiryInput.value = '';
        });
    }
    
    // Max Clicks Checkbox
    const maxClicksCheckbox = document.getElementById('maxClicks');
    const maxClicksInput = document.getElementById('maxClicksInput');
    if (maxClicksCheckbox && maxClicksInput) {
        maxClicksCheckbox.addEventListener('change', () => {
            maxClicksInput.disabled = !maxClicksCheckbox.checked;
            if (!maxClicksCheckbox.checked) maxClicksInput.value = '';
        });
    }
    
    // Copy Preview Button
    const copyPreviewBtn = document.getElementById('copyPreviewBtn');
    if (copyPreviewBtn) {
        copyPreviewBtn.addEventListener('click', copyPreviewLink);
    }
    
    // Test Link Button
    const testLinkBtn = document.getElementById('testLinkBtn');
    if (testLinkBtn) {
        testLinkBtn.addEventListener('click', testGeneratedLink);
    }
    
    // Modal Close
    const modalCloseBtns = document.querySelectorAll('.modal-close, #closeModalBtn');
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Copy Generated Link
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyGeneratedLink);
    }
    
    // Test Generated Link
    const testGeneratedBtn = document.getElementById('testGeneratedLink');
    if (testGeneratedBtn) {
        testGeneratedBtn.addEventListener('click', testGeneratedLink);
    }
    
    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            searchLinks(searchInput.value);
        }, 500));
    }
    
    // Filters
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterLinks);
    }
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterLinks);
    }
    
    // Stats Range
    const statsRange = document.getElementById('statsRange');
    if (statsRange) {
        statsRange.addEventListener('change', loadDetailedStats);
    }
    
    // Add Category Button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', showAddCategoryModal);
    }
    
    // Save Ad Settings
    const saveAdSettings = document.getElementById('saveAdSettings');
    if (saveAdSettings) {
        saveAdSettings.addEventListener('click', saveSettings);
    }
}

// ======================
// SELECT2 INITIALIZATION
// ======================
function initializeSelect2() {
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.category-select').select2({
            theme: 'classic',
            width: '100%',
            dropdownCssClass: 'select2-dropdown-dark'
        });
    }
}

// ======================
// PAGE NAVIGATION
// ======================
function showPage(pageName) {
    console.log('📄 Showing page:', pageName);
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const pageElement = document.getElementById(pageName + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
        currentPage = pageName;
        
        // Load page-specific data
        switch(pageName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'links':
                loadLinks();
                break;
            case 'stats':
                loadDetailedStats();
                break;
            case 'categories':
                loadCategories();
                break;
        }
    }
}

// ======================
// CREATE SHORT LINK
// ======================
async function handleCreateLink() {
    console.log('🔗 Creating short link...');
    
    const destinationUrl = document.getElementById('destinationUrl').value.trim();
    const title = document.getElementById('linkTitle').value.trim() || 'Untitled Link';
    const description = document.getElementById('linkDescription').value.trim();
    const customAlias = document.getElementById('customAlias').value.trim();
    const category = document.getElementById('linkCategory').value;
    
    // Get selected content type
    const activeType = document.querySelector('.type-item.active');
    const contentType = activeType ? activeType.dataset.type : 'website';
    
    // Get ad settings
    const adTimer = parseInt(document.getElementById('adTimer').value) || 10;
    const adCount = parseInt(document.getElementById('adCount').value) || 2;
    const scrollRequired = document.getElementById('scrollRequired').checked;
    const skipAd = document.getElementById('skipAd').checked;
    
    // Get security settings
    const password = document.getElementById('passwordProtect').checked ? 
        document.getElementById('linkPassword').value : null;
    const expiryDate = document.getElementById('expiryDate').checked ? 
        document.getElementById('linkExpiry').value : null;
    const maxClicks = document.getElementById('maxClicks').checked ? 
        parseInt(document.getElementById('maxClicksInput').value) : null;
    
    // Validate
    if (!destinationUrl) {
        showMessage('error', 'URL tujuan harus diisi!');
        return;
    }
    
    if (!isValidUrl(destinationUrl)) {
        showMessage('error', 'Format URL tidak valid!');
        return;
    }
    
    // Generate ID
    let linkId;
    if (customAlias) {
        linkId = customAlias.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        // Check if alias exists
        const { data: existing } = await supabaseClient
            .from('short_links')
            .select('id')
            .eq('id', linkId)
            .maybeSingle();
            
        if (existing) {
            showMessage('error', 'Custom alias sudah digunakan!');
            return;
        }
    } else {
        linkId = generateShortId();
    }
    
    // Prepare data
    const linkData = {
        id: linkId,
        title: title,
        description: description || `Akses ${contentType} melalui tautan pintar`,
        destination_url: destinationUrl,
        content_type: contentType,
        category: category || 'uncategorized',
        ad_timer: adTimer,
        ad_count: adCount,
        scroll_required: scrollRequired,
        skip_ad: skipAd,
        password: password,
        expiry_date: expiryDate,
        max_clicks: maxClicks,
        views: 0,
        created_at: new Date().toISOString(),
        is_active: true
    };
    
    // Show loading
    const createBtn = document.getElementById('createLinkBtn');
    const originalText = createBtn.innerHTML;
    createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membuat link...';
    createBtn.disabled = true;
    
    try {
        // Insert to database
        const { data, error } = await supabaseClient
            .from('short_links')
            .insert([linkData])
            .select()
            .single();
            
        if (error) throw error;
        
        console.log('✅ Link created:', data);
        
        // Show success modal
        const generatedLink = document.getElementById('generatedLink');
        const baseUrl = window.location.origin + '/redirect.html?id=';
        
        if (generatedLink) {
            generatedLink.value = baseUrl + linkId;
        }
        
        // Update modal info
        const modalAdTime = document.getElementById('modalAdTime');
        if (modalAdTime) modalAdTime.textContent = adTimer;
        
        const modalSecurity = document.getElementById('modalSecurity');
        if (modalSecurity) {
            modalSecurity.textContent = password ? 'Password Protected' : 'Publik';
        }
        
        // Show modal
        const modal = document.getElementById('successModal');
        if (modal) modal.classList.add('active');
        
        // Show preview container
        const previewContainer = document.getElementById('previewContainer');
        if (previewContainer) {
            previewContainer.style.display = 'block';
            
            const previewCode = document.getElementById('previewCode');
            if (previewCode) previewCode.textContent = baseUrl + linkId;
            
            const previewTitle = document.getElementById('previewTitle');
            if (previewTitle) previewTitle.textContent = title;
            
            const previewAdTime = document.getElementById('previewAdTime');
            if (previewAdTime) previewAdTime.textContent = adTimer;
            
            const previewSecurity = document.getElementById('previewSecurity');
            if (previewSecurity) previewSecurity.textContent = password ? 'Private' : 'Public';
        }
        
        // Reset form
        resetForm();
        
        // Refresh data
        loadLinks();
        loadDashboardData();
        
        showMessage('success', 'Link berhasil dibuat!');
        
    } catch (error) {
        console.error('❌ Create link error:', error);
        showMessage('error', 'Gagal membuat link', error.message);
    } finally {
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
    }
}

// ======================
// GENERATE SHORT ID
// ======================
function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    
    // Generate 6-character ID
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36).slice(-2);
    return id + timestamp;
}

// ======================
// VALIDATE URL
// ======================
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ======================
// UPDATE URL PREVIEW
// ======================
function updateUrlPreview() {
    const urlInput = document.getElementById('destinationUrl');
    const urlPreview = document.getElementById('urlPreview');
    const urlTypeHint = document.getElementById('urlTypeHint');
    const activeType = document.querySelector('.type-item.active');
    const contentType = activeType ? activeType.dataset.type : 'website';
    
    if (urlInput && urlInput.value) {
        if (isValidUrl(urlInput.value)) {
            urlPreview.className = 'url-preview valid';
            urlTypeHint.innerHTML = `<i class="fas fa-check-circle"></i> URL valid (${contentType})`;
            
            // Auto-detect and update content type if not manually selected
            const detectedType = detectUrlType(urlInput.value);
            const typeItems = document.querySelectorAll('.type-item');
            typeItems.forEach(item => {
                if (item.dataset.type === detectedType) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        } else {
            urlPreview.className = 'url-preview invalid';
            urlTypeHint.innerHTML = '<i class="fas fa-exclamation-triangle"></i> URL tidak valid';
        }
    } else {
        urlPreview.className = 'url-preview';
        urlTypeHint.innerHTML = '<i class="fas fa-info-circle"></i> Masukkan URL untuk melihat preview';
    }
}

// ======================
// DETECT URL TYPE
// ======================
function detectUrlType(url) {
    try {
        const urlLower = url.toLowerCase();
        
        if (urlLower.match(/\.(mp4|webm|ogg|mov|avi|mkv|m4v|3gp|flv)$/)) return 'video';
        if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|heic|heif)$/)) return 'image';
        if (urlLower.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z|tar|gz)$/)) return 'file';
        if (urlLower.includes('facebook') || urlLower.includes('twitter') || 
            urlLower.includes('instagram') || urlLower.includes('tiktok') ||
            urlLower.includes('youtube')) return 'social';
        
        return 'website';
    } catch {
        return 'website';
    }
}

// ======================
// TEST DESTINATION URL
// ======================
function testDestinationUrl() {
    const url = document.getElementById('destinationUrl').value.trim();
    if (url && isValidUrl(url)) {
        window.open(url, '_blank');
    } else {
        showMessage('error', 'URL tidak valid!');
    }
}

// ======================
// COPY PREVIEW LINK
// ======================
async function copyPreviewLink() {
    const previewCode = document.getElementById('previewCode');
    if (previewCode && previewCode.textContent) {
        try {
            await navigator.clipboard.writeText(previewCode.textContent);
            showMessage('success', 'Link preview disalin!');
        } catch (err) {
            showMessage('error', 'Gagal menyalin link');
        }
    }
}

// ======================
// TEST GENERATED LINK
// ======================
function testGeneratedLink() {
    const generatedLink = document.getElementById('generatedLink');
    if (generatedLink && generatedLink.value) {
        window.open(generatedLink.value, '_blank');
    } else {
        const previewCode = document.getElementById('previewCode');
        if (previewCode && previewCode.textContent) {
            window.open(previewCode.textContent, '_blank');
        }
    }
}

// ======================
// COPY GENERATED LINK
// ======================
async function copyGeneratedLink() {
    const generatedLink = document.getElementById('generatedLink');
    if (generatedLink && generatedLink.value) {
        try {
            await navigator.clipboard.writeText(generatedLink.value);
            showMessage('success', 'Link berhasil disalin!');
        } catch (err) {
            showMessage('error', 'Gagal menyalin link');
        }
    }
}

// ======================
// CLOSE MODAL
// ======================
function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ======================
// RESET FORM
// ======================
function resetForm() {
    // Only reset specific fields, keep ad settings
    document.getElementById('destinationUrl').value = '';
    document.getElementById('linkTitle').value = '';
    document.getElementById('linkDescription').value = '';
    document.getElementById('customAlias').value = '';
    
    // Reset security checkboxes
    document.getElementById('passwordProtect').checked = false;
    document.getElementById('linkPassword').disabled = true;
    document.getElementById('linkPassword').value = '';
    
    document.getElementById('expiryDate').checked = false;
    document.getElementById('linkExpiry').disabled = true;
    document.getElementById('linkExpiry').value = '';
    
    document.getElementById('maxClicks').checked = false;
    document.getElementById('maxClicksInput').disabled = true;
    document.getElementById('maxClicksInput').value = '';
    
    // Hide preview
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) previewContainer.style.display = 'none';
    
    // Reset URL preview
    updateUrlPreview();
}

// ======================
// LOAD DASHBOARD DATA
// ======================
async function loadDashboardData() {
    try {
        // Total links
        const { count: totalLinks } = await supabaseClient
            .from('short_links')
            .select('*', { count: 'exact', head: true });
            
        if (document.getElementById('totalLinks')) {
            document.getElementById('totalLinks').textContent = totalLinks || 0;
        }
        
        // Total clicks
        const { data: viewsData } = await supabaseClient
            .from('short_links')
            .select('views');
            
        const totalClicks = viewsData?.reduce((sum, link) => sum + (link.views || 0), 0) || 0;
        if (document.getElementById('totalClicks')) {
            document.getElementById('totalClicks').textContent = totalClicks;
        }
        
        // Today clicks
        const today = new Date().toISOString().split('T')[0];
        const { count: todayClicks } = await supabaseClient
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .gte('clicked_at', today);
            
        if (document.getElementById('todayClicks')) {
            document.getElementById('todayClicks').textContent = todayClicks || 0;
        }
        
        // Recent links
        loadRecentLinks();
        
        // Initialize charts
        initCharts();
        
    } catch (error) {
        console.error('❌ Failed to load dashboard:', error);
    }
}

// ======================
// LOAD RECENT LINKS
// ======================
async function loadRecentLinks() {
    const recentLinks = document.getElementById('recentLinks');
    if (!recentLinks) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('short_links')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            recentLinks.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-link"></i>
                    <p>Belum ada link</p>
                    <button onclick="showPage('create')" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> Buat Link
                    </button>
                </div>
            `;
            return;
        }
        
        recentLinks.innerHTML = data.map(link => `
            <div class="activity-item">
                <div class="activity-icon ${link.content_type}">
                    <i class="fas ${getContentTypeIcon(link.content_type)}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">
                        <h4>${escapeHtml(link.title || 'Untitled')}</h4>
                        <span class="badge ${link.content_type}">${link.content_type}</span>
                    </div>
                    <p class="activity-url">${window.location.origin}/redirect.html?id=${link.id}</p>
                    <p class="activity-meta">
                        <span><i class="fas fa-eye"></i> ${link.views || 0}</span>
                        <span><i class="fas fa-clock"></i> ${timeAgo(link.created_at)}</span>
                    </p>
                </div>
                <div class="activity-actions">
                    <button class="btn-icon" onclick="copyLink('${link.id}')" title="Salin Link">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Failed to load recent links:', error);
        recentLinks.innerHTML = '<p class="error">Gagal memuat data</p>';
    }
}

// ======================
// LOAD LINKS
// ======================
async function loadLinks() {
    const linksGrid = document.getElementById('linksGrid');
    if (!linksGrid) return;
    
    linksGrid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Memuat data...</p></div>';
    
    try {
        const { data, error } = await supabaseClient
            .from('short_links')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            linksGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-link"></i>
                    <h3>Belum Ada Link</h3>
                    <p>Buat link pertama Anda untuk mulai berbagi</p>
                    <button onclick="showPage('create')" class="btn btn-primary">
                        <i class="fas fa-plus-circle"></i> Buat Link Baru
                    </button>
                </div>
            `;
            return;
        }
        
        linksGrid.innerHTML = data.map(link => `
            <div class="link-card" data-id="${link.id}">
                <div class="link-card-header">
                    <div class="link-icon ${link.content_type}">
                        <i class="fas ${getContentTypeIcon(link.content_type)}"></i>
                    </div>
                    <div class="link-info">
                        <h3 class="link-title">${escapeHtml(link.title || 'Untitled')}</h3>
                        <p class="link-destination">${truncateUrl(link.destination_url, 50)}</p>
                    </div>
                    <div class="link-status">
                        ${link.is_active ? '<span class="status-badge active">Aktif</span>' : '<span class="status-badge inactive">Nonaktif</span>'}
                    </div>
                </div>
                
                <div class="link-card-body">
                    <div class="link-short">
                        <code>${window.location.origin}/redirect.html?id=${link.id}</code>
                        <button class="btn-icon" onclick="copyLink('${link.id}')" title="Salin Link">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="link-meta">
                        <span><i class="fas fa-eye"></i> ${link.views || 0} views</span>
                        <span><i class="fas fa-clock"></i> ${timeAgo(link.created_at)}</span>
                        ${link.expiry_date ? `<span><i class="fas fa-hourglass-end"></i> ${formatDate(link.expiry_date)}</span>` : ''}
                    </div>
                </div>
                
                <div class="link-card-footer">
                    <div class="link-stats">
                        <div class="stat-item">
                            <span class="stat-label">Iklan</span>
                            <span class="stat-value">${link.ad_timer || 10}s</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Jumlah</span>
                            <span class="stat-value">${link.ad_count || 2}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Scroll</span>
                            <span class="stat-value">${link.scroll_required ? 'Ya' : 'Tidak'}</span>
                        </div>
                    </div>
                    <div class="link-actions">
                        <button class="btn-action" onclick="editLink('${link.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action delete" onclick="deleteLink('${link.id}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Failed to load links:', error);
        linksGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Gagal Memuat Data</h3>
                <p>${error.message}</p>
                <button onclick="loadLinks()" class="btn btn-secondary">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// ======================
// LOAD CATEGORIES
// ======================
async function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    try {
        // Default categories
        const categories = [
            { name: 'Video', slug: 'video', icon: 'fa-video', color: '#ef4444', count: 0 },
            { name: 'Website', slug: 'website', icon: 'fa-globe', color: '#3b82f6', count: 0 },
            { name: 'Gambar', slug: 'image', icon: 'fa-image', color: '#10b981', count: 0 },
            { name: 'Dokumen', slug: 'file', icon: 'fa-file', color: '#f59e0b', count: 0 },
            { name: 'Social Media', slug: 'social', icon: 'fa-share-alt', color: '#8b5cf6', count: 0 },
            { name: 'Download', slug: 'download', icon: 'fa-download', color: '#ec4899', count: 0 },
            { name: 'Tutorial', slug: 'tutorial', icon: 'fa-graduation-cap', color: '#14b8a6', count: 0 },
            { name: 'Lainnya', slug: 'other', icon: 'fa-ellipsis-h', color: '#64748b', count: 0 }
        ];
        
        // Get counts from database
        const { data } = await supabaseClient
            .from('short_links')
            .select('category');
            
        if (data) {
            categories.forEach(cat => {
                cat.count = data.filter(link => link.category === cat.slug).length;
            });
        }
        
        categoriesGrid.innerHTML = categories.map(cat => `
            <div class="category-card" style="border-left-color: ${cat.color}">
                <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                    <i class="fas ${cat.icon}"></i>
                </div>
                <div class="category-info">
                    <h4>${cat.name}</h4>
                    <p>${cat.count} link</p>
                </div>
                <div class="category-actions">
                    <button class="btn-icon" onclick="editCategory('${cat.slug}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="all">Semua Kategori</option>' +
                categories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
        }
        
    } catch (error) {
        console.error('❌ Failed to load categories:', error);
    }
}

// ======================
// LOAD DETAILED STATS
// ======================
async function loadDetailedStats() {
    const range = document.getElementById('statsRange')?.value || 7;
    
    // Load location stats
    await loadLocationStats();
    
    // Load device stats
    await loadDeviceStats();
    
    // Load popular links
    await loadPopularLinks();
}

// ======================
// LOAD LOCATION STATS
// ======================
async function loadLocationStats() {
    const locationEl = document.getElementById('locationStats');
    if (!locationEl) return;
    
    // Simulate location data
    const locations = [
        { country: 'Indonesia', count: 245, flag: 'id' },
        { country: 'United States', count: 89, flag: 'us' },
        { country: 'Malaysia', count: 45, flag: 'my' },
        { country: 'Singapore', count: 34, flag: 'sg' },
        { country: 'Japan', count: 23, flag: 'jp' }
    ];
    
    const total = locations.reduce((sum, loc) => sum + loc.count, 0);
    
    locationEl.innerHTML = locations.map(loc => `
        <div class="location-item">
            <div class="location-info">
                <span class="country-flag">${getFlagEmoji(loc.flag)}</span>
                <span class="country-name">${loc.country}</span>
            </div>
            <div class="location-stats">
                <div class="progress-bar">
                    <div class="progress" style="width: ${(loc.count / total) * 100}%"></div>
                </div>
                <span class="location-count">${loc.count}</span>
            </div>
        </div>
    `).join('');
}

// ======================
// LOAD DEVICE STATS
// ======================
async function loadDeviceStats() {
    const deviceEl = document.getElementById('deviceStats');
    if (!deviceEl) return;
    
    const devices = [
        { name: 'Mobile', count: 312, icon: 'fa-mobile-alt' },
        { name: 'Desktop', count: 98, icon: 'fa-desktop' },
        { name: 'Tablet', count: 26, icon: 'fa-tablet-alt' }
    ];
    
    const total = devices.reduce((sum, dev) => sum + dev.count, 0);
    
    deviceEl.innerHTML = devices.map(dev => `
        <div class="device-item">
            <div class="device-info">
                <i class="fas ${dev.icon}"></i>
                <span>${dev.name}</span>
            </div>
            <div class="device-stats">
                <div class="progress-bar">
                    <div class="progress" style="width: ${(dev.count / total) * 100}%"></div>
                </div>
                <span class="device-count">${dev.count}</span>
                <span class="device-percent">${Math.round((dev.count / total) * 100)}%</span>
            </div>
        </div>
    `).join('');
}

// ======================
// LOAD POPULAR LINKS
// ======================
async function loadPopularLinks() {
    const popularEl = document.getElementById('popularLinks');
    if (!popularEl) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('short_links')
            .select('*')
            .order('views', { ascending: false })
            .limit(5);
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            popularEl.innerHTML = '<p class="empty">Belum ada data</p>';
            return;
        }
        
        popularEl.innerHTML = data.map((link, index) => `
            <div class="popular-item">
                <span class="rank ${index < 3 ? 'top-' + (index + 1) : ''}">#${index + 1}</span>
                <div class="popular-info">
                    <h4>${escapeHtml(link.title || 'Untitled')}</h4>
                    <span class="url">${truncateUrl(link.destination_url, 30)}</span>
                </div>
                <span class="views"><i class="fas fa-eye"></i> ${link.views || 0}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Failed to load popular links:', error);
        popularEl.innerHTML = '<p class="error">Gagal memuat data</p>';
    }
}

// ======================
// INITIALIZE CHARTS
// ======================
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    // Destroy existing charts
    if (charts.clicks) charts.clicks.destroy();
    if (charts.contentType) charts.contentType.destroy();
    
    // Clicks trend chart
    const clicksCtx = document.getElementById('clicksChart')?.getContext('2d');
    if (clicksCtx) {
        charts.clicks = new Chart(clicksCtx, {
            type: 'line',
            data: {
                labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                datasets: [{
                    label: 'Klik',
                    data: [65, 78, 82, 95, 110, 145, 132],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
    
    // Content type chart
    const contentTypeCtx = document.getElementById('contentTypeChart')?.getContext('2d');
    if (contentTypeCtx) {
        charts.contentType = new Chart(contentTypeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Website', 'Video', 'Gambar', 'File', 'Social'],
                datasets: [{
                    data: [45, 25, 15, 10, 5],
                    backgroundColor: [
                        '#3b82f6',
                        '#ef4444',
                        '#10b981',
                        '#f59e0b',
                        '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

// ======================
// SEARCH LINKS
// ======================
async function searchLinks(query) {
    if (!query || query.trim() === '') {
        loadLinks();
        return;
    }
    
    const linksGrid = document.getElementById('linksGrid');
    if (!linksGrid) return;
    
    linksGrid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Mencari...</p></div>';
    
    try {
        const { data, error } = await supabaseClient
            .from('short_links')
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%,destination_url.ilike.%${query}%`)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            linksGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Tidak Ditemukan</h3>
                    <p>Tidak ada link yang cocok dengan pencarian "${escapeHtml(query)}"</p>
                </div>
            `;
            return;
        }
        
        // Reuse loadLinks render logic
        renderLinks(data);
        
    } catch (error) {
        console.error('❌ Search failed:', error);
        linksGrid.innerHTML = '<p class="error">Gagal melakukan pencarian</p>';
    }
}

// ======================
// FILTER LINKS
// ======================
async function filterLinks() {
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    
    let query = supabaseClient.from('short_links').select('*');
    
    if (typeFilter !== 'all') {
        query = query.eq('content_type', typeFilter);
    }
    
    if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
    }
    
    query = query.order('created_at', { ascending: false });
    
    try {
        const { data, error } = await query;
        if (error) throw error;
        
        renderLinks(data || []);
        
    } catch (error) {
        console.error('❌ Filter failed:', error);
    }
}

// ======================
// RENDER LINKS
// ======================
function renderLinks(links) {
    const linksGrid = document.getElementById('linksGrid');
    if (!linksGrid) return;
    
    if (!links || links.length === 0) {
        linksGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-link"></i>
                <h3>Tidak Ada Link</h3>
                <p>Belum ada link yang tersedia</p>
            </div>
        `;
        return;
    }
    
    linksGrid.innerHTML = links.map(link => `
        <div class="link-card" data-id="${link.id}">
            <div class="link-card-header">
                <div class="link-icon ${link.content_type}">
                    <i class="fas ${getContentTypeIcon(link.content_type)}"></i>
                </div>
                <div class="link-info">
                    <h3 class="link-title">${escapeHtml(link.title || 'Untitled')}</h3>
                    <p class="link-destination">${truncateUrl(link.destination_url, 50)}</p>
                </div>
                <div class="link-status">
                    ${link.is_active ? '<span class="status-badge active">Aktif</span>' : '<span class="status-badge inactive">Nonaktif</span>'}
                </div>
            </div>
            
            <div class="link-card-body">
                <div class="link-short">
                    <code>${window.location.origin}/redirect.html?id=${link.id}</code>
                    <button class="btn-icon" onclick="copyLink('${link.id}')" title="Salin Link">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="link-meta">
                    <span><i class="fas fa-eye"></i> ${link.views || 0} views</span>
                    <span><i class="fas fa-clock"></i> ${timeAgo(link.created_at)}</span>
                </div>
            </div>
            
            <div class="link-card-footer">
                <div class="link-stats">
                    <div class="stat-item">
                        <span class="stat-label">Iklan</span>
                        <span class="stat-value">${link.ad_timer || 10}s</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Jumlah</span>
                        <span class="stat-value">${link.ad_count || 2}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Scroll</span>
                        <span class="stat-value">${link.scroll_required ? 'Ya' : 'Tidak'}</span>
                    </div>
                </div>
                <div class="link-actions">
                    <button class="btn-action" onclick="editLink('${link.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action delete" onclick="deleteLink('${link.id}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ======================
// COPY LINK
// ======================
window.copyLink = async function(linkId) {
    const url = window.location.origin + '/redirect.html?id=' + linkId;
    try {
        await navigator.clipboard.writeText(url);
        showMessage('success', 'Link disalin!');
    } catch (err) {
        showMessage('error', 'Gagal menyalin link');
    }
};

// ======================
// DELETE LINK
// ======================
window.deleteLink = async function(linkId) {
    if (!confirm('Yakin ingin menghapus link ini?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('short_links')
            .delete()
            .eq('id', linkId);
            
        if (error) throw error;
        
        showMessage('success', 'Link berhasil dihapus');
        loadLinks();
        loadDashboardData();
        
    } catch (error) {
        console.error('❌ Delete error:', error);
        showMessage('error', 'Gagal menghapus link');
    }
};

// ======================
// EDIT LINK
// ======================
window.editLink = function(linkId) {
    // Switch to create page and populate form
    showPage('create');
    
    // TODO: Implement edit functionality
    showMessage('info', 'Fitur edit akan segera hadir');
};

// ======================
// SHOW ADD CATEGORY MODAL
// ======================
function showAddCategoryModal() {
    showMessage('info', 'Fitur tambah kategori akan segera hadir');
}

// ======================
// EDIT CATEGORY
// ======================
window.editCategory = function(slug) {
    showMessage('info', 'Fitur edit kategori akan segera hadir');
};

// ======================
// SAVE SETTINGS
// ======================
function saveSettings() {
    showMessage('success', 'Pengaturan berhasil disimpan');
}

// ======================
// UTILITY FUNCTIONS
// ======================

// Get content type icon
function getContentTypeIcon(type) {
    const icons = {
        website: 'fa-globe',
        video: 'fa-video',
        image: 'fa-image',
        file: 'fa-file',
        social: 'fa-share-alt',
        download: 'fa-download',
        tutorial: 'fa-graduation-cap',
        other: 'fa-link'
    };
    return icons[type] || 'fa-link';
}

// Truncate URL
function truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Time ago
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds} detik lalu`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    return `${Math.floor(seconds / 86400)} hari lalu`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Get flag emoji
function getFlagEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show message
function showMessage(type, text, details = '') {
    const oldToast = document.querySelector('.message-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'message-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 500px;
        animation: slideIn 0.3s ease;
    `;
    
    const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle';
    toast.innerHTML = `
        <i class="fas fa-${icon}" style="font-size: 1.2rem;"></i>
        <div>
            <div style="font-weight: 600;">${text}</div>
            ${details ? `<div style="font-size: 0.9rem; opacity: 0.9; margin-top: 4px;">${details}</div>` : ''}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .message-toast {
        transition: opacity 0.3s, transform 0.3s;
    }
`;
document.head.appendChild(style);

// ======================
// EXPORT GLOBALS
// ======================
window.showPage = showPage;
window.copyLink = copyLink;
window.deleteLink = deleteLink;
window.editLink = editLink;
window.editCategory = editCategory;

console.log('✅ admin-shortener.js loaded');