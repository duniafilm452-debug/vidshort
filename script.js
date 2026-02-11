// ======================
// FILE: script.js (FIXED COUNTDOWN)
// ======================

const SUPABASE_URL = 'https://diwjkvrzcewnhoybruum.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU';
const SMARTLINK_URL = 'https://www.effectivegatecpm.com/p43fdinys?key=7af8f475f3eda53e4d37ccfeaad8be18';

// Debug function
function debugCountdown() {
    console.log('=== DEBUG COUNTDOWN ===');
    console.log('Countdown section:', document.getElementById('countdownSection'));
    console.log('Countdown number:', document.getElementById('countdownNumber'));
    console.log('Progress bar:', document.getElementById('progressBar'));
    console.log('Interval:', appState.countdownInterval);
    console.log('Is running:', appState.isCountdownRunning);
    console.log('=======================');
}

// Panggil debug setelah DOM loaded
setTimeout(debugCountdown, 1000);

let supabase;
let appState = {
    videoData: null,
    countdownInterval: null,
    isCountdownRunning: false
};

// ======================
// MAIN EXECUTION
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video Access Page Loading...');
    
    // 1. Cek Parameter URL
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    console.log('Video ID from URL:', videoId);

    if (!videoId) {
        showFatalError('Link Tidak Valid', 'URL tidak memiliki ID video. Pastikan Anda menyalin link dengan benar dari Admin Panel.');
        return;
    }

    // 2. Inisialisasi Supabase
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('⚠️ Supabase library not loaded');
        showToast('Mode Demo - Library tidak terdeteksi');
    }

    // 3. Mulai Countdown SEBELUM ambil data
    console.log('🚀 Starting countdown...');
    startCountdown();
    
    // 4. Ambil data video di background
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

            if (error || !data) {
                console.error('❌ Video fetch error:', error);
                showToast('Video mungkin tidak tersedia atau telah dihapus.');
                appState.videoData = null;
            } else {
                console.log('✅ Video data loaded:', data.title);
                appState.videoData = data;
                updateVideoUI(data);
                
                // Update view count
                try {
                    await supabase
                        .from('videos')
                        .update({ views: (data.views || 0) + 1 })
                        .eq('id', videoId);
                } catch (viewError) {
                    console.log('View count update skipped:', viewError);
                }
            }
        }
    } catch (e) {
        console.error('❌ App Error:', e);
    }

    setupEventListeners();
    setupScrollDetection();
});

// ======================
// FUNGSI COUNTDOWN (PERBAIKI)
// ======================
function startCountdown() {
    console.log('⏳ Countdown starting...');
    
    // Reset state
    if (appState.countdownInterval) {
        clearInterval(appState.countdownInterval);
        appState.countdownInterval = null;
    }
    
    let countdown = 15; // Waktu countdown
    const numberEl = document.getElementById('countdownNumber');
    const barEl = document.getElementById('progressBar');
    
    // Pastikan elemen ada
    if (!numberEl || !barEl) {
        console.error('❌ Countdown elements not found!');
        return;
    }
    
    // Reset UI
    numberEl.textContent = countdown;
    barEl.style.width = '0%';
    barEl.style.transition = 'width 1s linear';
    
    // Tampilkan section countdown
    const countdownSection = document.getElementById('countdownSection');
    if (countdownSection) {
        countdownSection.style.display = 'flex';
    }
    
    // Sembunyikan section lain
    ['instructionSection', 'nextSection', 'adPage', 'videoSection', 'videoPlayerSection'].forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.style.display = 'none';
    });
    
    appState.isCountdownRunning = true;
    
    // Mulai interval
    appState.countdownInterval = setInterval(() => {
        countdown--;
        console.log('Countdown:', countdown);
        
        // Update UI
        numberEl.textContent = countdown;
        const progressPercent = ((15 - countdown) / 15) * 100;
        barEl.style.width = `${progressPercent}%`;
        
        // Efek visual saat hitungan rendah
        if (countdown <= 5) {
            numberEl.style.color = '#ef4444';
            numberEl.style.animation = 'pulse 0.5s infinite';
        }
        
        // Countdown selesai
        if (countdown <= 0) {
            clearInterval(appState.countdownInterval);
            appState.isCountdownRunning = false;
            
            console.log('✅ Countdown finished, showing instruction');
            
            // Sembunyikan countdown
            if (countdownSection) {
                countdownSection.style.display = 'none';
            }
            
            // Tampilkan instruction
            showSection('instructionSection');
            
            // Auto scroll untuk hint user
            setTimeout(() => {
                window.scrollTo({
                    top: window.innerHeight,
                    behavior: 'smooth'
                });
            }, 500);
        }
    }, 1000); // 1 detik
    
    console.log('✅ Countdown timer started');
}

// ======================
// FUNGSI TAMPILKAN SECTION
// ======================
function showSection(id) {
    console.log('Showing section:', id);
    
    // Semua section utama
    const sections = [
        'countdownSection', 
        'instructionSection', 
        'nextSection', 
        'adPage', 
        'videoSection', 
        'videoPlayerSection'
    ];
    
    // Sembunyikan semua
    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if (el) {
            el.style.display = 'none';
        }
    });
    
    // Tampilkan section yang dipilih
    const target = document.getElementById(id);
    if (target) {
        if (id === 'adPage' || id === 'videoPlayerSection') {
            target.style.display = 'flex';
        } else if (id === 'nextSection' || id === 'videoSection') {
            target.style.display = 'flex';
        } else {
            target.style.display = 'block';
        }
        
        // Scroll ke section
        setTimeout(() => {
            target.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }
}

// ======================
// EVENT LISTENERS (PERBAIKI)
// ======================
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Scroll Detection
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
                showSection('nextSection');
                scrollProcessed = false;
            }, 500);
        }
    });
    
    // Touch scroll untuk mobile
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    window.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const instruction = document.getElementById('instructionSection');
        
        if (instruction && 
            instruction.style.display !== 'none' &&
            touchStartY - touchEndY > 50) { // Scroll down
            
            console.log('📱 Mobile scroll detected');
            showSection('nextSection');
        }
    });

    // Tombol Next -> Ke Iklan
    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log('➡️ Next button clicked');
            showSection('adPage');
            startReturnTimer();
        });
    }

    // Tombol Visit Sponsor
    const visitSponsorBtn = document.getElementById('visitSponsor');
    if (visitSponsorBtn) {
        visitSponsorBtn.addEventListener('click', () => {
            console.log('🔗 Visiting sponsor');
            window.open(SMARTLINK_URL, '_blank');
        });
    }

    // Tombol Back di Iklan
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            console.log('🔙 Back from ad');
            showSection('nextSection');
        });
    }

    // Tombol Tonton Video
    const watchButton = document.getElementById('watchButton');
    if (watchButton) {
        watchButton.addEventListener('click', () => {
            console.log('🎥 Watch button clicked');
            if (!appState.videoData) {
                showFatalError('Video Tidak Ditemukan', 'Data video gagal dimuat. Coba refresh halaman atau cek kembali link Anda.');
                return;
            }
            playVideo();
        });
    }

    // Player Controls
    const video = document.getElementById('videoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const backToVideoBtn = document.getElementById('backToVideoButton');
    
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
    
    if (backToVideoBtn && video) {
        backToVideoBtn.addEventListener('click', () => {
            video.pause();
            showSection('videoSection');
        });
    }
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            const playerWrapper = document.getElementById('playerWrapper');
            if (playerWrapper.requestFullscreen) {
                playerWrapper.requestFullscreen();
            }
        });
    }
    
    console.log('✅ Event listeners setup complete');
}

// ======================
// TIMER FUNCTIONS
// ======================
function startReturnTimer() {
    console.log('⏰ Starting return timer...');
    
    let timer = 10;
    const timerEls = [
        document.getElementById('returnTimer'), 
        document.getElementById('adTimer')
    ];
    
    // Update initial display
    timerEls.forEach(el => {
        if (el) el.textContent = timer;
    });

    const interval = setInterval(() => {
        timer--;
        console.log('Ad timer:', timer);
        
        // Update display
        timerEls.forEach(el => {
            if (el) el.textContent = timer;
        });

        // Timer habis
        if (timer <= 0) {
            clearInterval(interval);
            console.log('🔄 Returning to video section');
            showSection('videoSection');
        }
    }, 1000);
}

// ======================
// VIDEO PLAYER
// ======================
function playVideo() {
    console.log('🎬 Playing video...');
    
    const video = document.getElementById('videoPlayer');
    if (video && appState.videoData) {
        video.src = appState.videoData.video_url;
        video.poster = ''; // Optional: tambahkan thumbnail jika ada
        
        // Tampilkan video player
        showSection('videoPlayerSection');
        
        // Coba play video
        video.play().then(() => {
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
    console.log('Updating UI with video data:', data.title);
    
    const titleEl = document.getElementById('videoTitle');
    const descEl = document.getElementById('videoDescription');
    const dateEl = document.getElementById('videoDate');

    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.description || 'Tidak ada deskripsi';
    if (dateEl) {
        const date = new Date(data.created_at);
        dateEl.textContent = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// ======================
// SCROLL DETECTION
// ======================
function setupScrollDetection() {
    console.log('Setting up scroll detection...');
    
    let isProcessing = false;
    
    window.addEventListener('scroll', () => {
        const instruction = document.getElementById('instructionSection');
        
        if (instruction && 
            instruction.style.display !== 'none' && 
            !isProcessing) {
            
            const rect = instruction.getBoundingClientRect();
            
            // Jika user scroll melewati section instruksi
            if (rect.top < -50) {
                isProcessing = true;
                console.log('📜 Scroll past instruction detected');
                
                setTimeout(() => {
                    showSection('nextSection');
                    isProcessing = false;
                }, 300);
            }
        }
    });
}

// ======================
// ERROR HANDLING
// ======================
function showFatalError(title, message) {
    console.error('❌ Fatal Error:', title, message);
    
    document.body.innerHTML = `
        <div style="
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            text-align: center;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
            <div style="
                width: 80px;
                height: 80px;
                background: #ef4444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 25px;
                font-size: 2.5rem;
            ">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            
            <h1 style="
                margin-bottom: 15px;
                font-size: 1.8rem;
                color: white;
            ">${title}</h1>
            
            <p style="
                color: #94a3b8;
                max-width: 500px;
                margin-bottom: 30px;
                line-height: 1.5;
            ">${message}</p>
            
            <div style="display: flex; gap: 15px; margin-top: 20px;">
                <button onclick="location.reload()" style="
                    padding: 12px 25px;
                    background: #3b82f6;
                    border: none;
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <i class="fas fa-redo"></i> Refresh Halaman
                </button>
                
                <button onclick="history.back()" style="
                    padding: 12px 25px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid #475569;
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
            </div>
        </div>
    `;
}

function showToast(msg) {
    console.log('Toast:', msg);
    
    const toast = document.createElement('div');
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(59, 130, 246, 0.95);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        z-index: 9999;
        font-size: 0.95rem;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: fadeInOut 4s ease;
        border: 1px solid rgba(255,255,255,0.2);
    `;
    
    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            10% { opacity: 1; transform: translateX(-50%) translateY(0); }
            90% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

console.log('✅ script.js loaded successfully');