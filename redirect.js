// ============================================
// redirect.js - Versi FIXED
// SmartLink dengan Countdown 15 Detik
// ============================================

const SUPABASE_CONFIG = {
    url: "https://diwjkvrzcewnhoybruum.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU"
};

const SMARTLINK_URL = 'https://www.effectivegatecpm.com/p43fdinys?key=7af8f475f3eda53e4d37ccfeaad8be18';
const COUNTDOWN_TIME = 15; // 15 Detik

let supabaseClient = null;
let destinationUrl = '';
let linkId = null;
let countdownInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Redirect page loaded');
    
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client initialized');
        
        initRedirect();
    } catch (error) {
        console.error('❌ Init error:', error);
        showError('Gagal menginisialisasi aplikasi');
    }
});

async function initRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    linkId = urlParams.get('id');

    console.log('🔍 Link ID:', linkId);

    if (!linkId) {
        showError('ID Link tidak ditemukan dalam URL!');
        return;
    }

    try {
        // Ambil data dari tabel short_links
        const { data, error } = await supabaseClient
            .from('short_links')
            .select('*')
            .eq('id', linkId)
            .single();

        if (error) {
            console.error('❌ Database error:', error);
            
            if (error.code === 'PGRST116') {
                showError('Link tidak ditemukan dalam database');
            } else {
                showError('Error database: ' + error.message);
            }
            return;
        }

        if (!data) {
            showError('Link tidak ditemukan atau sudah dihapus');
            return;
        }

        destinationUrl = data.destination_url;
        console.log('✅ Destination URL:', destinationUrl);

        // Update views di background
        updateViewCount(data.views || 0);

        // Sembunyikan loading, tampilkan countdown
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('countdownScreen').classList.remove('hidden');
        
        // Mulai countdown
        startCountdown();

    } catch (err) {
        console.error('❌ Fatal error:', err);
        showError('Terjadi kesalahan koneksi ke database');
    }
}

async function updateViewCount(currentViews) {
    try {
        await supabaseClient
            .from('short_links')
            .update({ views: (currentViews || 0) + 1 })
            .eq('id', linkId);
        
        console.log('✅ Views updated');
    } catch (error) {
        console.error('❌ Failed to update views:', error);
        // Non-blocking error, tidak perlu ditampilkan ke user
    }
}

function startCountdown() {
    let timeLeft = COUNTDOWN_TIME;
    const countdownNumber = document.getElementById('countdownNumber');
    const progressBar = document.getElementById('progressBar');
    
    // Set initial progress
    updateProgress(progressBar, timeLeft);
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        
        // Update UI
        if (countdownNumber) {
            countdownNumber.textContent = timeLeft;
        }
        
        updateProgress(progressBar, timeLeft);
        
        // Selesai countdown
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            finishCountdown();
        }
    }, 1000);
}

function updateProgress(progressBar, timeLeft) {
    if (progressBar) {
        const progress = ((COUNTDOWN_TIME - timeLeft) / COUNTDOWN_TIME) * 100;
        progressBar.style.width = progress + '%';
    }
}

function finishCountdown() {
    // Sembunyikan countdown
    const countdownScreen = document.getElementById('countdownScreen');
    if (countdownScreen) {
        countdownScreen.classList.add('hidden');
    }
    
    // Tampilkan smartlink
    const smartlinkScreen = document.getElementById('smartlinkScreen');
    if (smartlinkScreen) {
        smartlinkScreen.classList.remove('hidden');
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

// Handler tombol sponsor (Smartlink)
document.addEventListener('DOMContentLoaded', function() {
    const smartlinkBtn = document.getElementById('smartlinkBtn');
    if (smartlinkBtn) {
        smartlinkBtn.addEventListener('click', function() {
            // Buka smartlink di tab baru
            window.open(SMARTLINK_URL, '_blank');
            
            // Sembunyikan smartlink screen
            document.getElementById('smartlinkScreen').classList.add('hidden');
            
            // Tampilkan redirect screen
            const redirectScreen = document.getElementById('redirectScreen');
            redirectScreen.classList.remove('hidden');
            
            // Tampilkan URL tujuan
            const destinationDisplay = document.getElementById('destinationUrlDisplay');
            if (destinationDisplay) {
                destinationDisplay.textContent = destinationUrl || 'URL tidak tersedia';
            }
        });
    }

    // Handler tombol buka tujuan akhir
    const redirectBtn = document.getElementById('redirectBtn');
    if (redirectBtn) {
        redirectBtn.addEventListener('click', function() {
            if (destinationUrl) {
                window.location.href = destinationUrl;
            } else {
                showToast('URL tujuan tidak tersedia');
            }
        });
    }

    // Handler copy link
    const copyBtn = document.getElementById('copyDestinationBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            if (destinationUrl) {
                navigator.clipboard.writeText(destinationUrl).then(() => {
                    showToast('Tautan berhasil disalin!');
                }).catch(() => {
                    // Fallback
                    const textarea = document.createElement('textarea');
                    textarea.value = destinationUrl;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    showToast('Tautan berhasil disalin!');
                });
            }
        });
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showError(message) {
    console.error('❌ Error:', message);
    
    const card = document.querySelector('.card');
    if (card) {
        card.innerHTML = `
            <div class="icon" style="color: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h1 style="color: #ef4444;">Error</h1>
            <div class="message" style="color: #ef4444;">${message}</div>
            <button class="btn btn-primary" onclick="window.location.href='/'">
                <i class="fas fa-home"></i> Kembali ke Beranda
            </button>
        `;
    }
}

function showToast(message) {
    // Hapus toast lama jika ada
    const oldToast = document.querySelector('.toast');
    if (oldToast) oldToast.remove();
    
    // Buat toast baru
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    // Hapus setelah 3 detik
    setTimeout(() => {
        if (toast) {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Cleanup interval saat pindah halaman
window.addEventListener('beforeunload', function() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});