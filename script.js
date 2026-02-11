// ======================
// FILE: script.js (FINAL FIXED VERSION)
// ======================

const SUPABASE_URL = 'https://diwjkvrzcewnhoybruum.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU';
const SMARTLINK_URL = 'https://www.effectivegatecpm.com/p43fdinys?key=7af8f475f3eda53e4d37ccfeaad8be18';

let supabase;
let appState = {
    videoData: null,
    countdownInterval: null,
    adTimerInterval: null,
    isCountdownRunning: false,
    currentSection: 'countdown'
};

// ======================
// ACCESS VALIDATION
// ======================
function validateAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    
    // Jika tidak ada parameter v=id, redirect ke halaman admin utama
    if (!videoId) {
        console.log('❌ No video ID detected, redirecting to admin...');
        window.location.href = window.location.origin + '/';
        return false;
    }
    
    return true;
}

// ======================
// MAIN EXECUTION
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video Access Page Loading...');
    
    // 1. Validasi akses
    if (!validateAccess()) {
        return;
    }
    
    // 2. Pastikan hanya countdown yang tampil pertama kali
    hideAllSections();
    showSection('countdown', false);
    
    // 3. Mulai countdown SEKARANG JUGA
    startCountdown();
    
    // 4. Inisialisasi Supabase
    try {
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized');
            
            // 5. Ambil video ID dari URL
            const urlParams = new URLSearchParams(window.location.search);
            const videoId = urlParams.get('v');
            
            if (videoId) {
                console.log('🎯 Video ID found:', videoId);
                await loadVideoData(videoId);
            } else {
                console.warn('⚠️ No video ID in URL');
                showToast('Error: Tidak ada ID video dalam URL');
            }
        } else {
            console.error('❌ Supabase library not loaded');
            showToast('Error: Supabase library tidak ditemukan');
        }
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('Error inisialisasi: ' + error.message);
    }
    
    // 6. Setup event listeners
    setupEventListeners();
    console.log('✅ Page initialization complete');
});

// ======================
// FUNGSI COUNTDOWN - FIXED
// ======================
function startCountdown() {
    console.log('⏳ STARTING COUNTDOWN...');
    
    // Stop existing interval jika ada
    if (appState.countdownInterval) {
        clearInterval(appState.countdownInterval);
        appState.countdownInterval = null;
    }
    
    let countdown = 15;
    const numberEl = document.getElementById('countdownNumber');
    const barEl = document.getElementById('progressBar');
    
    if (!numberEl) {
        console.error('❌ countdownNumber element not found!');
        return;
    }
    if (!barEl) {
        console.error('❌ progressBar element not found!');
        return;
    }
    
    console.log('✅ Countdown elements found');
    
    // Reset UI
    numberEl.textContent = countdown;
    numberEl.style.color = '#10b981';
    numberEl.style.animation = 'pulse 2s infinite';
    barEl.style.width = '0%';
    barEl.style.transition = 'width 1s linear';
    
    // Mulai interval
    appState.countdownInterval = setInterval(() => {
        countdown--;
        console.log('⏱️ Countdown:', countdown);
        
        // Update UI
        numberEl.textContent = countdown;
        const progressPercent = ((15 - countdown) / 15) * 100;
        barEl.style.width = `${progressPercent}%`;
        
        // Efek visual saat hitungan rendah
        if (countdown <= 5) {
            numberEl.style.color = '#ef4444';
            numberEl.style.animation = 'pulseRed 0.5s infinite';
        }
        
        // Countdown selesai
        if (countdown <= 0) {
            console.log('✅ Countdown finished!');
            clearInterval(appState.countdownInterval);
            appState.isCountdownRunning = false;
            appState.countdownInterval = null;
            
            // Tampilkan instruction
            showSection('instruction');
            
            // Auto scroll untuk hint user
            setTimeout(() => {
                window.scrollTo({
                    top: window.innerHeight,
                    behavior: 'smooth'
                });
            }, 500);
        }
    }, 1000);
    
    appState.isCountdownRunning = true;
    console.log('✅ Countdown timer started');
}

// ======================
// FUNGSI LOAD VIDEO DATA
// ======================
async function loadVideoData(videoId) {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', videoId)
            .single();

        if (error) {
            console.error('❌ Video load error:', error);
            showToast('Video tidak ditemukan atau ID tidak valid');
            return;
        }

        if (data) {
            console.log('✅ Video data loaded:', data.title);
            appState.videoData = data;
            updateVideoUI(data);
            
            // Update view count
            try {
                await supabase
                    .from('videos')
                    .update({ views: (data.views || 0) + 1 })
                    .eq('id', videoId);
                console.log('📈 View count updated');
            } catch (e) {
                console.log('⚠️ View count update skipped:', e);
            }
        }
    } catch (e) {
        console.error('❌ Video fetch error:', e);
        showToast('Gagal memuat data video');
    }
}

// ======================
// FUNGSI TAMPILKAN SECTION
// ======================
function showSection(sectionName, scrollTo = true) {
    console.log('📄 Showing section:', sectionName);
    
    // Semua section ID
    const sections = ['countdown', 'instruction', 'next', 'ad', 'video', 'videoPlayer'];
    
    // Sembunyikan semua
    sections.forEach(section => {
        const el = document.getElementById(section + 'Section');
        if (el) {
            el.style.display = 'none';
        }
    });
    
    // Tampilkan section yang dipilih
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.style.display = 'flex';
        
        if (scrollTo) {
            setTimeout(() => {
                targetSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }
    
    appState.currentSection = sectionName;
}

// ======================
// FUNGSI SEMBUNYIKAN SEMUA SECTION
// ======================
function hideAllSections() {
    console.log('🙈 Hiding all sections...');
    
    const sections = ['countdown', 'instruction', 'next', 'ad', 'video', 'videoPlayer'];
    sections.forEach(section => {
        const el = document.getElementById(section + 'Section');
        if (el) {
            el.style.display = 'none';
        }
    });
}

// ======================
// TIMER FUNGSI IKLAN
// ======================
function startReturnTimer() {
    console.log('⏰ Starting return timer...');
    
    // Stop existing timer jika ada
    if (appState.adTimerInterval) {
        clearInterval(appState.adTimerInterval);
        appState.adTimerInterval = null;
    }
    
    let timer = 10;
    const returnTimerEl = document.getElementById('returnTimer');
    const adTimerEl = document.getElementById('adTimer');
    
    // Update initial display
    if (returnTimerEl) returnTimerEl.textContent = timer;
    if (adTimerEl) adTimerEl.textContent = timer;

    appState.adTimerInterval = setInterval(() => {
        timer--;
        console.log('⏱️ Ad timer:', timer);
        
        // Update display
        if (returnTimerEl) returnTimerEl.textContent = timer;
        if (adTimerEl) adTimerEl.textContent = timer;

        // Timer habis
        if (timer <= 0) {
            clearInterval(appState.adTimerInterval);
            appState.adTimerInterval = null;
            console.log('🔄 Returning to video section');
            showSection('video');
        }
    }, 1000);
}

// ======================
// VIDEO PLAYER FUNCTIONS
// ======================
function playVideo() {
    console.log('🎬 Playing video...');
    
    const video = document.getElementById('videoPlayer');
    if (!video) {
        console.error('❌ Video player element not found');
        return;
    }
    
    if (appState.videoData && appState.videoData.video_url) {
        video.src = appState.videoData.video_url;
        console.log('🎥 Video URL set:', appState.videoData.video_url);
    } else {
        // Demo video jika tidak ada data
        video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        console.log('🎥 Using demo video');
    }
    
    // Tampilkan video player
    showSection('videoPlayer');
    
    // Coba play video
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('✅ Video playing');
        }).catch(e => {
            console.log('⚠️ Autoplay prevented, user must click play');
            showToast('Klik tombol play untuk menonton video');
        });
    }
}

// ======================
// UI UPDATE FUNCTIONS
// ======================
function updateVideoUI(data) {
    console.log('🎨 Updating UI with video data');
    
    const titleEl = document.getElementById('videoTitle');
    const descEl = document.getElementById('videoDescription');
    const viewsEl = document.getElementById('videoViews');
    const dateEl = document.getElementById('videoDate');

    if (titleEl) {
        titleEl.textContent = data.title || 'Video Tanpa Judul';
        console.log('📝 Title updated:', data.title);
    }
    
    if (descEl) {
        descEl.textContent = data.description || 'Tidak ada deskripsi';
    }
    
    if (viewsEl) {
        viewsEl.textContent = data.views || 0;
    }
    
    if (dateEl) {
        try {
            const date = new Date(data.created_at || new Date());
            dateEl.textContent = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            dateEl.textContent = 'Tanggal tidak tersedia';
        }
    }
}

// ======================
// EVENT LISTENERS SETUP
// ======================
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Scroll Detection untuk pindah dari instruction ke next
    let scrollProcessed = false;
    window.addEventListener('wheel', (e) => {
        const instruction = document.getElementById('instructionSection');
        if (instruction && 
            instruction.style.display !== 'none' && 
            !scrollProcessed && 
            e.deltaY > 0) {
            
            scrollProcessed = true;
            console.log('📜 User scrolled, moving to next section');
            
            setTimeout(() => {
                showSection('next');
                scrollProcessed = false;
            }, 500);
        }
    });
    
    // Tombol Next -> Ke Iklan
    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log('➡️ Next button clicked');
            showSection('ad');
            startReturnTimer();
        });
    }

    // Tombol Visit Sponsor
    const visitSponsorBtn = document.getElementById('visitSponsor');
    if (visitSponsorBtn) {
        visitSponsorBtn.addEventListener('click', () => {
            console.log('🔗 Visiting sponsor');
            window.open(SMARTLINK_URL, '_blank', 'noopener,noreferrer');
        });
    }

    // Tombol Back di Iklan
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            console.log('🔙 Back from ad');
            
            // Stop timer iklan
            if (appState.adTimerInterval) {
                clearInterval(appState.adTimerInterval);
                appState.adTimerInterval = null;
            }
            
            showSection('next');
        });
    }

    // Tombol Tonton Video
    const watchButton = document.getElementById('watchButton');
    if (watchButton) {
        watchButton.addEventListener('click', () => {
            console.log('🎥 Watch button clicked');
            playVideo();
        });
    }

    // Player Controls
    const video = document.getElementById('videoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const replayBtn = document.getElementById('replayBtn');
    const backToVideoBtn = document.getElementById('backToVideoButton');
    
    // Play/Pause Button
    if (playPauseBtn && video) {
        playPauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Jeda';
            } else {
                video.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Putar';
            }
        });
    }
    
    // Fullscreen Button
    if (fullscreenBtn && video) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                } else if (video.msRequestFullscreen) {
                    video.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        });
    }
    
    // Replay Button
    if (replayBtn && video) {
        replayBtn.addEventListener('click', () => {
            video.currentTime = 0;
            video.play();
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Jeda';
            }
        });
    }
    
    // Back to Video Button
    if (backToVideoBtn) {
        backToVideoBtn.addEventListener('click', () => {
            if (video) {
                video.pause();
            }
            showSection('video');
        });
    }
    
    // Video events untuk update play/pause button
    if (video && playPauseBtn) {
        video.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Jeda';
        });
        
        video.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Putar';
        });
    }
    
    console.log('✅ Event listeners setup complete');
}

// ======================
// HELPER FUNCTIONS
// ======================
function showToast(msg) {
    console.log('💬 Toast:', msg);
    
    // Hapus toast lama jika ada
    const oldToast = document.querySelector('.toast-message');
    if (oldToast) oldToast.remove();
    
    // Buat toast baru
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    
    document.body.appendChild(toast);
    
    // Hapus toast setelah 4 detik
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

// ======================
// ESCAPE HTML FUNCTION
// ======================
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ======================
// FORMAT DATE FUNCTION
// ======================
function formatDate(dateString, withTime = false) {
    try {
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
    } catch (e) {
        return 'Tanggal tidak valid';
    }
}

// ======================
// INITIALIZATION SCRIPT
// ======================
// Pastikan CSS animations sudah ditambahkan
if (!document.querySelector('#animation-styles')) {
    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
        @keyframes pulseRed {
            0%, 100% { 
                transform: scale(1); 
                color: #ef4444;
            }
            50% { 
                transform: scale(1.1); 
                color: #f87171;
            }
        }
    `;
    document.head.appendChild(style);
}

// ======================
// PAGE LOAD COMPLETION
// ======================
// Pastikan hanya countdown yang tampil saat pertama kali
window.addEventListener('load', () => {
    console.log('🚀 Page fully loaded');
    
    // Tambahkan class loaded ke body
    document.body.classList.add('loaded');
    
    // Double check: Pastikan countdown section tampil
    const countdownSection = document.getElementById('countdownSection');
    if (countdownSection) {
        countdownSection.style.display = 'flex';
    }
    
    // Double check: Sembunyikan section lain
    const otherSections = ['instruction', 'next', 'ad', 'video', 'videoPlayer'];
    otherSections.forEach(section => {
        const el = document.getElementById(section + 'Section');
        if (el) {
            el.style.display = 'none';
        }
    });
    
    // Jika countdown belum berjalan, start lagi
    if (!appState.isCountdownRunning) {
        console.log('🔄 Restarting countdown...');
        startCountdown();
    }
});

// ======================
// ERROR HANDLING
// ======================
window.addEventListener('error', function(e) {
    console.error('🛑 Global error:', e.error);
    console.error('🛑 Error at:', e.filename, 'line:', e.lineno);
});

// ======================
// READY STATE CHECK
// ======================
// Jika document sudah ready sebelum script dimuat
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('⚡ Document already ready, initializing...');
    setTimeout(() => {
        // Cek apakah sudah diinisialisasi
        if (!appState.countdownInterval) {
            hideAllSections();
            showSection('countdown', false);
            startCountdown();
        }
    }, 100);
}

console.log('✅ script.js loaded successfully - VIDEO ACCESS PAGE');