// ======================
// FILE: admin.js (FINAL VERSION)
// ======================

// KONFIGURASI SUPABASE
const SUPABASE_URL = "https://diwjkvrzcewnhoybruum.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU";

// BASE URL untuk video.html (halaman akses video)
const BASE_URL = window.location.origin + '/video.html?v=';

// ======================
// INISIALISASI
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Admin Panel Initializing...');
    
    try {
        // Inisialisasi Supabase Client
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
        console.log('📌 Base URL untuk video:', BASE_URL);
        
        // Test koneksi ke database
        const { data, error } = await window.supabaseClient
            .from('videos')
            .select('id')
            .limit(1)
            .maybeSingle();
            
        if (error) {
            console.error('❌ Database connection error:', error);
            if (error.code === '42P01') {
                showMessage('error', 'Tabel "videos" belum dibuat di database!', 'Silakan buat tabel terlebih dahulu di Supabase.');
            } else {
                showMessage('error', 'Koneksi database gagal', error.message);
            }
        } else {
            console.log('✅ Database connection successful');
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Load data awal
        loadVideos();
        loadStats();
        
    } catch (err) {
        console.error('❌ Initialization error:', err);
        showMessage('error', 'Gagal inisialisasi sistem', err.message);
    }
});

// ======================
// HELPER FUNCTION untuk mendapatkan client
// ======================
function getSupabase() {
    return window.supabaseClient || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ======================
// UPLOAD HANDLER
// ======================
async function handleUpload() {
    console.log('📤 Upload button clicked...');
    
    const title = document.getElementById('videoTitle').value.trim();
    const url = document.getElementById('videoUrl').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const uploadBtn = document.getElementById('uploadBtn');

    // Validasi input
    if (!title) {
        showMessage('error', 'Judul video harus diisi!');
        return;
    }
    
    if (!url) {
        showMessage('error', 'URL video harus diisi!');
        return;
    }
    
    if (!url.startsWith('http')) {
        showMessage('error', 'URL harus dimulai dengan http:// atau https://');
        return;
    }

    // Tampilkan loading state
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengupload...';
    uploadBtn.disabled = true;

    try {
        // Generate ID unik
        const videoId = generateRandomId();
        console.log('Generated video ID:', videoId);
        console.log('Generated link:', BASE_URL + videoId);
        
        // Data untuk disimpan
        const videoData = {
            id: videoId,
            title: title,
            video_url: url,
            description: description || '',
            created_at: new Date().toISOString(),
            views: 0
        };
        
        console.log('💾 Saving video data:', videoData);

        // DAPATKAN CLIENT DARI FUNGSI HELPER
        const supabase = getSupabase();
        
        // Simpan ke database
        const { data, error } = await supabase
            .from('videos')
            .insert([videoData])
            .select()
            .single();

        if (error) {
            console.error('❌ Save error:', error);
            throw error;
        }

        console.log('✅ Video saved successfully:', data);
        
        // Tampilkan modal sukses
        const generatedLink = document.getElementById('generatedLink');
        const successModal = document.getElementById('successModal');
        
        if (generatedLink) {
            generatedLink.value = BASE_URL + videoId;
            console.log('🔗 Link generated:', BASE_URL + videoId);
        }
        
        if (successModal) {
            successModal.classList.add('active');
        }

        // Reset form
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoUrl').value = '';
        document.getElementById('videoDescription').value = '';
        
        const previewContainer = document.getElementById('previewContainer');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }

        // Refresh data
        loadVideos();
        loadStats();
        
        showMessage('success', 'Video berhasil diupload dan link telah dibuat!');

    } catch (error) {
        console.error('❌ Upload failed:', error);
        
        // Tampilkan error spesifik
        let errorMessage = 'Gagal mengupload video';
        if (error.message) {
            errorMessage += ': ' + error.message;
        }
        if (error.code === '23505') {
            errorMessage = 'ID video sudah ada, coba upload ulang';
        }
        
        showMessage('error', errorMessage);
    } finally {
        // Reset button state
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
    }
}

// ======================
// DATA LOADING FUNCTIONS
// ======================
async function loadVideos() {
    const videosGrid = document.getElementById('videosGrid');
    if (!videosGrid) return;
    
    console.log('📥 Loading videos...');
    
    videosGrid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Memuat daftar video...</p></div>';

    try {
        // DAPATKAN CLIENT DARI FUNGSI HELPER
        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Load videos error:', error);
            throw error;
        }

        console.log(`✅ Loaded ${data?.length || 0} videos`);
        
        if (!data || data.length === 0) {
            videosGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px; color: #94a3b8;">
                    <i class="fas fa-video-slash" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3 style="margin-bottom: 10px;">Belum ada video</h3>
                    <p>Upload video pertama Anda di halaman Upload Video</p>
                </div>`;
            return;
        }

        // Render video cards
        videosGrid.innerHTML = data.map(video => `
            <div class="video-card">
                <div class="video-thumb">
                    <i class="fas fa-film"></i>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${escapeHtml(video.title)}</h3>
                    <div class="video-meta">
                        <span><i class="fas fa-eye"></i> ${video.views || 0} views</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(video.created_at)}</span>
                    </div>
                    <div class="video-actions">
                        <button class="video-action-btn copy" onclick="copyVideoLink('${video.id}')">
                            <i class="fas fa-copy"></i> Salin Link
                        </button>
                        <button class="video-action-btn delete" onclick="deleteVideo('${video.id}', '${escapeHtml(video.title)}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('❌ Failed to load videos:', error);
        videosGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <h3>Gagal memuat data video</h3>
                <p>${error.message || 'Terjadi kesalahan saat memuat data'}</p>
                <button onclick="loadVideos()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>`;
    }
}

async function loadStats() {
    console.log('📊 Loading statistics...');
    
    try {
        // DAPATKAN CLIENT DARI FUNGSI HELPER
        const supabase = getSupabase();
        
        // Total Videos
        const { count: totalVideos, error: countError } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true });
            
        if (!countError && document.getElementById('totalVideos')) {
            document.getElementById('totalVideos').textContent = totalVideos || 0;
        }

        // Total Views
        const { data: viewsData, error: viewsError } = await supabase
            .from('videos')
            .select('views');
            
        if (!viewsError && viewsData) {
            const totalViews = viewsData.reduce((sum, video) => sum + (video.views || 0), 0);
            if (document.getElementById('totalViews')) {
                document.getElementById('totalViews').textContent = totalViews;
            }
        }

        // Active Links
        if (document.getElementById('activeLinks')) {
            document.getElementById('activeLinks').textContent = totalVideos || 0;
        }

        // Today's Views
        if (document.getElementById('todayViews')) {
            document.getElementById('todayViews').textContent = '0';
        }

        // Load recent activity
        loadRecentActivity();

    } catch (error) {
        console.error('❌ Failed to load stats:', error);
    }
}

async function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    try {
        // DAPATKAN CLIENT DARI FUNGSI HELPER
        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from('videos')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;
        
        if (!data || data.length === 0) {
            activityList.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #94a3b8;">
                    <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>Belum ada aktivitas</p>
                </div>`;
            return;
        }

        activityList.innerHTML = data.map(video => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-video"></i>
                </div>
                <div class="activity-details">
                    <h4>Video baru diupload</h4>
                    <p>"${escapeHtml(video.title)}" - ${formatDate(video.created_at, true)}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('❌ Failed to load activity:', error);
        activityList.innerHTML = '<p style="color: #64748b; text-align: center;">Gagal memuat aktivitas</p>';
    }
}

// ======================
// UTILITY FUNCTIONS
// ======================
function showPage(pageName) {
    console.log('📄 Showing page:', pageName);
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const pageElement = document.getElementById(pageName + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
        
        // Load data jika diperlukan
        if (pageName === 'videos') {
            loadVideos();
        } else if (pageName === 'stats') {
            loadStats();
        }
    }
}

function generateRandomId() {
    // Versi 1: Menggunakan timestamp dan random string
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const timestamp = Date.now().toString(36);
    return randomPart + timestamp;
    
    // Atau gunakan versi alternatif:
    // return 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString, withTime = false) {
    const date = new Date(dateString);
    if (withTime) {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return date.toLocaleDateString('id-ID');
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 500px;
        animation: fadeIn 0.3s ease;
        border-left: 4px solid ${type === 'error' ? '#dc2626' : '#059669'};
    `;
    
    const icon = type === 'error' ? 'exclamation-circle' : 'check-circle';
    toast.innerHTML = `
        <i class="fas fa-${icon}" style="font-size: 1.2rem;"></i>
        <div>
            <div style="font-weight: 600; font-size: 1rem;">${text}</div>
            ${details ? `<div style="font-size: 0.9rem; opacity: 0.9; margin-top: 4px;">${details}</div>` : ''}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// ======================
// GLOBAL FUNCTIONS
// ======================
window.copyVideoLink = async function(videoId) {
    const link = BASE_URL + videoId;
    try {
        await navigator.clipboard.writeText(link);
        showMessage('success', 'Link berhasil disalin!', link);
        console.log('📋 Copied link:', link);
    } catch (err) {
        console.error('Copy failed:', err);
        showMessage('error', 'Gagal menyalin link', err.message);
    }
};

window.deleteVideo = async function(videoId, videoTitle = '') {
    const confirmMessage = videoTitle 
        ? `Yakin menghapus video "${videoTitle}"?`
        : 'Yakin menghapus video ini?';
    
    if (!confirm(confirmMessage)) return;
    
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', videoId);
            
        if (error) throw error;
        
        showMessage('success', 'Video berhasil dihapus');
        
        loadVideos();
        loadStats();
        
    } catch (error) {
        console.error('❌ Delete failed:', error);
        showMessage('error', 'Gagal menghapus video', error.message);
    }
};

// ======================
// SEARCH FUNCTIONALITY
// ======================
async function searchVideos(searchTerm) {
    const videosGrid = document.getElementById('videosGrid');
    if (!videosGrid) return;
    
    if (!searchTerm || searchTerm.trim() === '') {
        loadVideos();
        return;
    }
    
    videosGrid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Mencari video...</p></div>';
    
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            videosGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px; color: #94a3b8;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3 style="margin-bottom: 10px;">Video tidak ditemukan</h3>
                    <p>Tidak ada video yang cocok dengan pencarian "${escapeHtml(searchTerm)}"</p>
                </div>`;
            return;
        }
        
        videosGrid.innerHTML = data.map(video => `
            <div class="video-card">
                <div class="video-thumb">
                    <i class="fas fa-film"></i>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${escapeHtml(video.title)}</h3>
                    <div class="video-meta">
                        <span><i class="fas fa-eye"></i> ${video.views || 0} views</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(video.created_at)}</span>
                    </div>
                    <div class="video-actions">
                        <button class="video-action-btn copy" onclick="copyVideoLink('${video.id}')">
                            <i class="fas fa-copy"></i> Salin Link
                        </button>
                        <button class="video-action-btn delete" onclick="deleteVideo('${video.id}', '${escapeHtml(video.title)}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Search failed:', error);
        videosGrid.innerHTML = '<p style="color: #ef4444; text-align: center;">Gagal melakukan pencarian</p>';
    }
}

// ======================
// SETUP EVENT LISTENERS
// ======================
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
            const page = link.dataset.page;
            showPage(page);
        });
    });

    // Preview Button
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const title = document.getElementById('videoTitle').value.trim();
            const url = document.getElementById('videoUrl').value.trim();
            
            if (!title || !url) {
                showMessage('error', 'Judul dan URL wajib diisi untuk preview!');
                return;
            }
            
            const previewId = generateRandomId();
            const previewIdElement = document.getElementById('previewId');
            const previewContainer = document.getElementById('previewContainer');
            
            if (previewIdElement) {
                previewIdElement.textContent = previewId;
            }
            if (previewContainer) {
                previewContainer.style.display = 'block';
            }
            
            console.log('👁️ Preview link generated:', BASE_URL + previewId);
        });
    }

    // Upload Button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleUpload);
    }

    // Copy Preview Button
    const copyPreviewBtn = document.getElementById('copyPreviewBtn');
    if (copyPreviewBtn) {
        copyPreviewBtn.addEventListener('click', () => {
            const previewIdElement = document.getElementById('previewId');
            if (previewIdElement) {
                const link = BASE_URL + previewIdElement.textContent;
                navigator.clipboard.writeText(link).then(() => {
                    showMessage('success', 'Link preview disalin!');
                }).catch(err => {
                    showMessage('error', 'Gagal menyalin link', err.message);
                });
            }
        });
    }

    // Modal Buttons
    const modalCloseBtns = document.querySelectorAll('.modal-close, #closeModalBtn');
    modalCloseBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                const successModal = document.getElementById('successModal');
                if (successModal) {
                    successModal.classList.remove('active');
                }
            });
        }
    });

    // Copy Generated Link Button
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            const generatedLink = document.getElementById('generatedLink');
            if (generatedLink && generatedLink.value) {
                navigator.clipboard.writeText(generatedLink.value).then(() => {
                    showMessage('success', 'Link berhasil disalin!');
                });
            }
        });
    }

    // Test Link Button
    const testLinkBtn = document.getElementById('testLinkBtn');
    if (testLinkBtn) {
        testLinkBtn.addEventListener('click', () => {
            const generatedLink = document.getElementById('generatedLink');
            if (generatedLink && generatedLink.value) {
                window.open(generatedLink.value, '_blank');
            }
        });
    }

    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchVideos(e.target.value);
        });
    }
    
    console.log('✅ Event listeners setup complete');
}

// ======================
// FUNGSI GENERATE ID ALTERNATIF
// ======================
// Fungsi alternatif untuk generate ID (tidak digunakan, hanya sebagai referensi)
function generateSimpleId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// ======================
// Tambahkan CSS untuk animation
// ======================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

console.log('✅ admin.js loaded successfully');