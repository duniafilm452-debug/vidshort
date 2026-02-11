// ============================================
// admin.js - Admin Panel JavaScript
// VERSI FIXED - TIDAK ADA ERROR
// ============================================

// ===== SUPABASE CONFIGURATION =====
const SUPABASE_CONFIG = {
    url: "https://diwjkvrzcewnhoybruum.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU"
};

// ===== BASE URL =====
const BASE_URL = window.location.origin + '/redirect.html?id=';

// ===== GLOBAL VARIABLES =====
let supabaseClient = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Admin panel starting...');
    
    try {
        // Initialize Supabase Client
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client initialized');
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        await Promise.all([
            loadLinks(),
            loadStats()
        ]);
        
        console.log('✅ Admin panel ready');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showNotification('Gagal menginisialisasi aplikasi', 'error');
    }
});

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // 1. Navigasi Halaman
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            if (pageId) {
                switchPage(pageId);
            }
        });
    });

    // 2. FORM BUAT LINK - PERBAIKAN: ID Sesuai HTML
    const createBtn = document.getElementById('createLinkBtn');
    if (createBtn) {
        createBtn.addEventListener('click', handleCreateLink);
        console.log('✅ Tombol create ditemukan');
    } else {
        console.error('❌ Tombol create TIDAK ditemukan!');
    }

    // 3. SEARCH INPUT - PERBAIKAN: ID Sesuai HTML
    const searchInput = document.getElementById('searchLinksInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            loadLinks(e.target.value);
        }, 500));
        console.log('✅ Search input ditemukan');
    }

    // 4. ENTER KEY pada input
    const urlInput = document.getElementById('destinationUrlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateLink();
            }
        });
    }
}

// ============================================
// PAGE NAVIGATION
// ============================================
function switchPage(pageId) {
    // Sembunyikan semua page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Non-aktifkan semua nav link
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    // Aktifkan page yang dipilih
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Aktifkan nav link yang dipilih
    const targetNav = document.querySelector(`[data-page="${pageId}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }
    
    // Refresh data jika pindah ke halaman links
    if (pageId === 'links') {
        loadLinks();
    }
}

// ============================================
// CREATE LINK - CORE FUNCTION
// ============================================
async function handleCreateLink() {
    console.log('🔨 handleCreateLink dipanggil');
    
    // PERBAIKAN: Gunakan ID yang benar
    const urlInput = document.getElementById('destinationUrlInput');
    
    if (!urlInput) {
        console.error('❌ Input URL tidak ditemukan!');
        showNotification('Error: Elemen input tidak ditemukan', 'error');
        return;
    }
    
    const destinationUrl = urlInput.value.trim();
    
    // Validasi URL
    if (!destinationUrl) {
        urlInput.classList.add('error');
        showNotification('Silakan masukkan URL tujuan!', 'error');
        setTimeout(() => urlInput.classList.remove('error'), 1000);
        return;
    }
    
    // Validasi format URL
    try {
        new URL(destinationUrl);
    } catch (e) {
        urlInput.classList.add('error');
        showNotification('Format URL tidak valid! Harus diawali http:// atau https://', 'error');
        setTimeout(() => urlInput.classList.remove('error'), 1000);
        return;
    }
    
    // Disable button selama proses
    const createBtn = document.getElementById('createLinkBtn');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Membuat...';
    }

    try {
        // Generate ID unik 6 karakter
        const id = generateId();
        console.log('📝 Generating ID:', id);
        
        // Insert ke Supabase
        const { error } = await supabaseClient
            .from('short_links')
            .insert([
                { 
                    id: id, 
                    destination_url: destinationUrl, 
                    views: 0,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        // Success!
        urlInput.value = '';
        showNotification(`✅ Link berhasil dibuat!\nID: ${id}`, 'success');
        
        // Refresh data
        await Promise.all([
            loadLinks(),
            loadStats()
        ]);
        
        // Pindah ke halaman daftar link
        switchPage('links');
        
    } catch (error) {
        console.error('❌ Error creating link:', error);
        
        // Handle duplicate ID (very rare)
        if (error.code === '23505') { // Unique violation
            showNotification('ID sudah digunakan, coba lagi', 'error');
        } else {
            showNotification('❌ Gagal membuat link: ' + error.message, 'error');
        }
    } finally {
        // Enable button kembali
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.innerHTML = '<i class="fas fa-magic"></i> Buat Link';
        }
    }
}

// ============================================
// LOAD LINKS - dengan class CSS yang konsisten
// ============================================
async function loadLinks(query = '') {
    const linksGrid = document.getElementById('linksGrid');
    
    if (!linksGrid) {
        console.error('❌ linksGrid tidak ditemukan!');
        return;
    }
    
    try {
        // Tampilkan loading
        linksGrid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Memuat daftar link...</p>
            </div>
        `;

        let dbQuery = supabaseClient
            .from('short_links')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter jika ada query pencarian
        if (query && query.trim() !== '') {
            dbQuery = dbQuery.ilike('destination_url', `%${query}%`);
        }

        const { data, error } = await dbQuery;

        if (error) throw error;

        // Empty state
        if (!data || data.length === 0) {
            linksGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>${query ? 'Tidak ada link yang cocok' : 'Belum ada link yang dibuat'}</p>
                </div>
            `;
            return;
        }

        // Render links - PERBAIKAN: Gunakan class 'link-item' sesuai CSS
        linksGrid.innerHTML = data.map(link => `
            <div class="link-item">
                <div class="link-id">
                    <i class="fas fa-hashtag"></i>
                    ${link.id}
                </div>
                <div class="link-url" title="${link.destination_url}">
                    ${truncateUrl(link.destination_url)}
                </div>
                <div class="link-meta">
                    <span>
                        <i class="fas fa-eye"></i> 
                        ${formatNumber(link.views || 0)} klik
                    </span>
                    <span>
                        <i class="fas fa-calendar-alt"></i> 
                        ${formatDate(link.created_at)}
                    </span>
                    <span>
                        <i class="fas fa-link"></i> 
                        ${BASE_URL}${link.id}
                    </span>
                </div>
                <div class="link-actions">
                    <button class="btn-copy" onclick="copyLink('${link.id}')" title="Salin Link">
                        <i class="fas fa-copy"></i> Salin
                    </button>
                    <button class="btn-delete" onclick="deleteLink('${link.id}')" title="Hapus">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('❌ Load error:', error);
        linksGrid.innerHTML = `
            <div class="empty-state" style="color: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading data: ${error.message}</p>
                <button onclick="loadLinks()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; border: none; border-radius: 8px; color: white; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// ============================================
// LOAD STATISTICS
// ============================================
async function loadStats() {
    try {
        const { data, error } = await supabaseClient
            .from('short_links')
            .select('views');
            
        if (error) throw error;

        const totalLinks = data.length;
        const totalViews = data.reduce((sum, item) => sum + (item.views || 0), 0);

        // Update UI
        const totalLinksEl = document.getElementById('totalLinks');
        const totalViewsEl = document.getElementById('totalViews');
        
        if (totalLinksEl) totalLinksEl.textContent = formatNumber(totalLinks);
        if (totalViewsEl) totalViewsEl.textContent = formatNumber(totalViews);
        
    } catch (error) {
        console.error('❌ Stats error:', error);
    }
}

// ============================================
// DELETE LINK - Global Function
// ============================================
window.deleteLink = async function(id) {
    if (!confirm('⚠️ Hapus link ini?\nID: ' + id)) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('short_links')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('✅ Link berhasil dihapus', 'success');
        
        // Refresh data
        await Promise.all([
            loadLinks(document.getElementById('searchLinksInput')?.value || ''),
            loadStats()
        ]);
        
    } catch (error) {
        console.error('❌ Delete error:', error);
        showNotification('❌ Gagal menghapus link', 'error');
    }
};

// ============================================
// COPY LINK - Global Function
// ============================================
window.copyLink = function(id) {
    const fullUrl = BASE_URL + id;
    
    navigator.clipboard.writeText(fullUrl).then(() => {
        showNotification('✅ Link disalin ke clipboard!\n' + fullUrl, 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        showNotification('✅ Link disalin (fallback)', 'success');
    });
};

// ============================================
// UTILITIES
// ============================================

// Generate ID 6 karakter
function generateId() {
    return Math.random().toString(36).substring(2, 8).toLowerCase();
}

// Truncate URL untuk display
function truncateUrl(url, maxLength = 60) {
    if (!url) return '';
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
}

// Format tanggal Indonesia
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

// Format angka dengan separator ribuan
function formatNumber(num) {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') || '0';
}

// Debounce function untuk search
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

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions ke global scope
window.loadLinks = loadLinks;
window.loadStats = loadStats;