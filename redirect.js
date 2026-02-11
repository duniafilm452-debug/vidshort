// ======================
// redirect.js
// Smart Link Redirect with Multi Ads & Content Type Detection
// ======================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Redirect script initialized');

    // ======================
    // SUPABASE CONFIG
    // ======================
    const SUPABASE_URL = "https://diwjkvrzcewnhoybruum.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU";
    
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ======================
    // ELEMENTS
    // ======================
    const elements = {
        loadingScreen: document.getElementById('loadingScreen'),
        contentWrapper: document.getElementById('contentWrapper'),
        countdownSection: document.getElementById('countdownSection'),
        instructionSection: document.getElementById('instructionSection'),
        adsMultiSection: document.getElementById('adsMultiSection'),
        contentPreviewSection: document.getElementById('contentPreviewSection'),
        redirectSection: document.getElementById('redirectSection'),
        countdownNumber: document.getElementById('countdownNumber'),
        progressBar: document.getElementById('progressBar'),
        accessButton: document.getElementById('accessButton'),
        accessTimer: document.getElementById('accessTimer'),
        redirectNowBtn: document.getElementById('redirectNowBtn'),
        copyRedirectUrl: document.getElementById('copyRedirectUrl'),
        redirectTimer: document.getElementById('redirectTimer'),
        destinationUrl: document.getElementById('destinationUrl'),
        contentTypeIcon: document.getElementById('contentTypeIcon'),
        contentTitle: document.getElementById('contentTitle'),
        contentDescription: document.getElementById('contentDescription'),
        previewLargeIcon: document.getElementById('previewLargeIcon'),
        fileTypeBadge: document.getElementById('fileTypeBadge'),
        fileTypeText: document.getElementById('fileTypeText'),
        fileSize: document.getElementById('fileSize'),
        contentDate: document.getElementById('contentDate'),
        destinationIcon: document.getElementById('destinationIcon')
    };

    // ======================
    // STATE
    // ======================
    let state = {
        linkId: null,
        linkData: null,
        currentAdIndex: 0,
        adsCompleted: 0,
        totalAds: 2, // Default 2 ads
        countdownTime: 15,
        adTimer: 10,
        scrollRequired: true,
        destinationUrl: null,
        contentType: 'website',
        contentMetadata: {}
    };

    // ======================
    // INITIALIZATION
    // ======================
    async function init() {
        try {
            // Get link ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            state.linkId = urlParams.get('id') || urlParams.get('v');
            
            if (!state.linkId) {
                showError('Link tidak valid', 'ID tidak ditemukan');
                return;
            }
            
            console.log('📌 Link ID:', state.linkId);
            
            // Fetch link data from Supabase
            await fetchLinkData();
            
            // Hide loading screen
            setTimeout(() => {
                if (elements.loadingScreen) elements.loadingScreen.style.display = 'none';
                if (elements.contentWrapper) elements.contentWrapper.style.display = 'block';
            }, 500);
            
            // Update UI with link data
            updateUI();
            
            // Start the flow
            startCountdown();
            
        } catch (error) {
            console.error('❌ Init error:', error);
            showError('Gagal memuat', error.message);
        }
    }

    // ======================
    // FETCH LINK DATA
    // ======================
    async function fetchLinkData() {
        try {
            // Fetch from short_links table
            const { data, error } = await supabase
                .from('short_links')
                .select('*')
                .eq('id', state.linkId)
                .single();
                
            if (error) {
                // Try fallback to videos table
                const { data: videoData, error: videoError } = await supabase
                    .from('videos')
                    .select('*')
                    .eq('id', state.linkId)
                    .single();
                    
                if (videoError) throw videoError;
                
                state.linkData = {
                    id: videoData.id,
                    title: videoData.title || 'Video',
                    description: videoData.description || 'Konten video',
                    destination_url: videoData.video_url,
                    content_type: 'video',
                    ad_timer: 10,
                    ad_count: 2,
                    scroll_required: true,
                    created_at: videoData.created_at,
                    views: videoData.views || 0
                };
            } else {
                state.linkData = data;
            }
            
            // Set state from link data
            state.destinationUrl = state.linkData.destination_url || state.linkData.video_url;
            state.contentType = state.linkData.content_type || detectContentType(state.destinationUrl);
            state.totalAds = state.linkData.ad_count || 2;
            state.adTimer = state.linkData.ad_timer || 10;
            state.countdownTime = state.linkData.countdown_time || 15;
            state.scrollRequired = state.linkData.scroll_required !== false;
            
            // Increment views
            await incrementViews();
            
            console.log('✅ Link loaded:', state.linkData);
            console.log('📊 Content type:', state.contentType);
            console.log('🎯 Destination:', state.destinationUrl);
            
        } catch (error) {
            console.error('❌ Fetch error:', error);
            throw error;
        }
    }

    // ======================
    // DETECT CONTENT TYPE
    // ======================
    function detectContentType(url) {
        try {
            const urlLower = url.toLowerCase();
            
            // Video extensions
            if (urlLower.match(/\.(mp4|webm|ogg|mov|avi|mkv|m4v|3gp|flv)$/)) {
                return 'video';
            }
            
            // Image extensions
            if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|heic|heif)$/)) {
                return 'image';
            }
            
            // File/Document extensions
            if (urlLower.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z|tar|gz)$/)) {
                return 'file';
            }
            
            // Social media
            if (urlLower.includes('facebook.com') || urlLower.includes('fb.com') ||
                urlLower.includes('twitter.com') || urlLower.includes('x.com') ||
                urlLower.includes('instagram.com') || urlLower.includes('tiktok.com') ||
                urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
                return 'social';
            }
            
            return 'website';
            
        } catch (error) {
            return 'website';
        }
    }

    // ======================
    // INCREMENT VIEWS
    // ======================
    async function incrementViews() {
        try {
            const { error } = await supabase
                .from('short_links')
                .update({ 
                    views: (state.linkData.views || 0) + 1,
                    last_click: new Date().toISOString()
                })
                .eq('id', state.linkId);
                
            if (error) console.error('Failed to increment views:', error);
            
        } catch (error) {
            console.error('View increment error:', error);
        }
    }

    // ======================
    // UPDATE UI
    // ======================
    function updateUI() {
        // Set title and description
        if (elements.contentTitle) {
            elements.contentTitle.textContent = state.linkData.title || 'Smart Link';
        }
        
        if (elements.contentDescription) {
            elements.contentDescription.textContent = state.linkData.description || 'Klik untuk mengakses konten';
        }
        
        // Set destination URL display
        if (elements.destinationUrl) {
            elements.destinationUrl.textContent = state.destinationUrl || 'Tidak ada URL';
        }
        
        // Update icons based on content type
        updateContentTypeUI();
        
        // Generate ads
        generateAds();
    }

    // ======================
    // UPDATE CONTENT TYPE UI
    // ======================
    function updateContentTypeUI() {
        const icons = {
            website: { icon: 'fa-globe', color: 'gradient-blue', label: 'Website' },
            video: { icon: 'fa-video', color: 'gradient-orange', label: 'Video' },
            image: { icon: 'fa-image', color: 'gradient-green', label: 'Gambar' },
            file: { icon: 'fa-file', color: 'gradient-purple', label: 'Dokumen' },
            social: { icon: 'fa-share-alt', color: 'gradient-blue', label: 'Media Sosial' },
            other: { icon: 'fa-link', color: 'gradient-gray', label: 'Link' }
        };
        
        const typeConfig = icons[state.contentType] || icons.other;
        
        // Update icons
        if (elements.contentTypeIcon) {
            elements.contentTypeIcon.innerHTML = `<i class="fas ${typeConfig.icon}"></i>`;
            elements.contentTypeIcon.className = `smart-icon ${typeConfig.color}`;
        }
        
        if (elements.previewLargeIcon) {
            elements.previewLargeIcon.innerHTML = `<i class="fas ${typeConfig.icon}"></i>`;
        }
        
        if (elements.destinationIcon) {
            elements.destinationIcon.innerHTML = `<i class="fas ${typeConfig.icon}"></i>`;
        }
        
        // Update file type badge
        if (elements.fileTypeText) {
            elements.fileTypeText.textContent = typeConfig.label;
        }
        
        if (elements.fileTypeBadge) {
            elements.fileTypeBadge.innerHTML = `
                <i class="fas ${typeConfig.icon}"></i>
                <span>${typeConfig.label}</span>
            `;
        }
        
        // Simulate file size for file type
        if (state.contentType === 'file' && elements.fileSize) {
            const sizes = ['1.2 MB', '2.5 MB', '5.1 MB', '8.7 MB', '12.4 MB'];
            elements.fileSize.textContent = `Ukuran: ${sizes[Math.floor(Math.random() * sizes.length)]}`;
        } else if (elements.fileSize) {
            elements.fileSize.textContent = 'Ukuran: --';
        }
        
        // Set date
        if (elements.contentDate && state.linkData.created_at) {
            const date = new Date(state.linkData.created_at);
            elements.contentDate.textContent = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    }

    // ======================
    // GENERATE ADS
    // ======================
    function generateAds() {
        if (!elements.adsMultiSection) return;
        
        const ads = [];
        const adNetworks = [
            {
                name: 'Premium Sponsor',
                description: 'Dukung creator dengan klik sponsor',
                icon: 'fa-crown',
                color: 'gradient-orange',
                url: 'https://www.effectivegatecpm.com/p43fdinys?key=7af8f475f3eda53e4d37ccfeaad8be18'
            },
            {
                name: 'Partner Link',
                description: 'Kunjungi partner kami',
                icon: 'fa-handshake',
                color: 'gradient-blue',
                url: 'https://www.effectivegatecpm.com/p43fdinys?key=7af8f475f3eda53e4d37ccfeaad8be18'
            },
            {
                name: 'Sponsored Content',
                description: 'Konten sponsor premium',
                icon: 'fa-star',
                color: 'gradient-green',
                url: 'https://www.effectivegatecpm.com/p43fdinys?key=7af8f475f3eda53e4d37ccfeaad8be18'
            }
        ];
        
        for (let i = 0; i < state.totalAds; i++) {
            const ad = adNetworks[i % adNetworks.length];
            ads.push(`
                <div class="ad-card" data-ad-index="${i}">
                    <div class="ad-icon ${ad.color}">
                        <i class="fas ${ad.icon}"></i>
                    </div>
                    <div class="ad-content">
                        <h4>${ad.name} ${i + 1}</h4>
                        <p>${ad.description}</p>
                        <span class="ad-timer">
                            <i class="fas fa-hourglass-half"></i>
                            <span class="ad-timer-value" id="adTimer${i}">${state.adTimer}</span> detik
                        </span>
                    </div>
                    <button class="ad-button small" onclick="window.open('${ad.url}', '_blank')" disabled id="adButton${i}">
                        <i class="fas fa-external-link-alt"></i>
                        Kunjungi
                    </button>
                </div>
            `);
        }
        
        elements.adsMultiSection.innerHTML = ads.join('');
        
        // Initially hide ads section
        elements.adsMultiSection.style.display = 'none';
        if (elements.instructionSection) elements.instructionSection.style.display = 'none';
        if (elements.contentPreviewSection) elements.contentPreviewSection.style.display = 'none';
        if (elements.redirectSection) elements.redirectSection.style.display = 'none';
    }

    // ======================
    // COUNTDOWN FLOW
    // ======================
    function startCountdown() {
        let timeLeft = state.countdownTime;
        
        const countdownInterval = setInterval(() => {
            timeLeft--;
            
            if (elements.countdownNumber) {
                elements.countdownNumber.textContent = timeLeft;
            }
            
            if (elements.progressBar) {
                const progress = ((state.countdownTime - timeLeft) / state.countdownTime) * 100;
                elements.progressBar.style.width = progress + '%';
            }
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                onCountdownComplete();
            }
        }, 1000);
    }

    // ======================
    // COUNTDOWN COMPLETE
    // ======================
    function onCountdownComplete() {
        console.log('✅ Countdown complete');
        
        // Hide countdown section
        if (elements.countdownSection) {
            elements.countdownSection.style.display = 'none';
        }
        
        if (state.scrollRequired) {
            // Show instruction section (scroll required)
            if (elements.instructionSection) {
                elements.instructionSection.style.display = 'block';
                setupScrollDetection();
            }
        } else {
            // Skip scroll, go directly to ads
            startAdsSequence();
        }
    }

    // ======================
    // SCROLL DETECTION
    // ======================
    function setupScrollDetection() {
        let scrolled = false;
        
        const scrollHandler = () => {
            if (!scrolled && elements.instructionSection) {
                const rect = elements.instructionSection.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                
                // Check if instruction section is scrolled past
                if (rect.top < windowHeight * 0.3) {
                    scrolled = true;
                    window.removeEventListener('scroll', scrollHandler);
                    startAdsSequence();
                }
            }
        };
        
        window.addEventListener('scroll', scrollHandler);
        
        // Also add click handler for arrow
        if (elements.instructionSection) {
            elements.instructionSection.addEventListener('click', () => {
                if (!scrolled) {
                    scrolled = true;
                    window.removeEventListener('scroll', scrollHandler);
                    startAdsSequence();
                }
            });
        }
    }

    // ======================
    // ADS SEQUENCE
    // ======================
    function startAdsSequence() {
        console.log('📢 Starting ads sequence');
        
        // Hide instruction section
        if (elements.instructionSection) {
            elements.instructionSection.style.display = 'none';
        }
        
        // Show ads section
        if (elements.adsMultiSection) {
            elements.adsMultiSection.style.display = 'flex';
            elements.adsMultiSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Show content preview
        if (elements.contentPreviewSection) {
            elements.contentPreviewSection.style.display = 'block';
        }
        
        // Start first ad timer
        startAdTimer(0);
        
        // Disable access button initially
        if (elements.accessButton) {
            elements.accessButton.disabled = true;
        }
    }

    // ======================
    // AD TIMER
    // ======================
    function startAdTimer(adIndex) {
        if (adIndex >= state.totalAds) {
            // All ads completed
            enableAccess();
            return;
        }
        
        state.currentAdIndex = adIndex;
        let timeLeft = state.adTimer;
        
        // Enable ad button after 3 seconds
        setTimeout(() => {
            const adButton = document.getElementById(`adButton${adIndex}`);
            if (adButton) {
                adButton.disabled = false;
                adButton.classList.add('pulse');
            }
        }, 3000);
        
        const timerElement = document.getElementById(`adTimer${adIndex}`);
        
        const adInterval = setInterval(() => {
            timeLeft--;
            
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(adInterval);
                
                // Mark ad as completed
                state.adsCompleted++;
                
                // Move to next ad
                startAdTimer(adIndex + 1);
            }
        }, 1000);
    }

    // ======================
    // ENABLE ACCESS
    // ======================
    function enableAccess() {
        console.log('🔓 Access enabled');
        
        // Enable access button
        if (elements.accessButton) {
            elements.accessButton.disabled = false;
            elements.accessButton.innerHTML = `
                <i class="fas fa-external-link-alt"></i>
                Akses Konten Sekarang
            `;
            
            // Add click handler
            elements.accessButton.onclick = showRedirect;
        }
        
        // Update access timer display
        if (elements.accessTimer) {
            elements.accessTimer.textContent = '0';
        }
        
        // Show toast notification
        showToast('✅ Akses dibuka! Klik tombol untuk melanjutkan');
    }

    // ======================
    // SHOW REDIRECT
    // ======================
    function showRedirect() {
        console.log('🔄 Showing redirect');
        
        // Hide ads and preview sections
        if (elements.adsMultiSection) {
            elements.adsMultiSection.style.display = 'none';
        }
        
        if (elements.contentPreviewSection) {
            elements.contentPreviewSection.style.display = 'none';
        }
        
        // Show redirect section
        if (elements.redirectSection) {
            elements.redirectSection.style.display = 'block';
            elements.redirectSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Set redirect button href
        if (elements.redirectNowBtn && state.destinationUrl) {
            elements.redirectNowBtn.href = state.destinationUrl;
            elements.redirectNowBtn.setAttribute('target', '_blank');
            elements.redirectNowBtn.setAttribute('rel', 'noopener noreferrer');
        }
        
        // Start redirect timer
        startRedirectTimer();
    }

    // ======================
    // REDIRECT TIMER
    // ======================
    function startRedirectTimer() {
        let timeLeft = 5;
        const timerElement = elements.redirectTimer;
        
        const redirectInterval = setInterval(() => {
            timeLeft--;
            
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(redirectInterval);
                
                // Auto redirect
                if (state.destinationUrl) {
                    window.open(state.destinationUrl, '_blank');
                    showToast('🔗 Mengalihkan ke tautan tujuan...');
                }
            }
        }, 1000);
    }

    // ======================
    // COPY URL HANDLER
    // ======================
    if (elements.copyRedirectUrl) {
        elements.copyRedirectUrl.addEventListener('click', async () => {
            if (state.destinationUrl) {
                try {
                    await navigator.clipboard.writeText(state.destinationUrl);
                    showToast('📋 Tautan disalin!');
                } catch (err) {
                    console.error('Copy failed:', err);
                    showToast('❌ Gagal menyalin tautan', 'error');
                }
            }
        });
    }

    // ======================
    // UTILITIES
    // ======================
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function showError(title, message) {
        if (elements.loadingScreen) {
            elements.loadingScreen.innerHTML = `
                <div style="text-align: center; max-width: 400px; padding: 30px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"></i>
                    <h2 style="color: white; margin-bottom: 15px;">${title}</h2>
                    <p style="color: #94a3b8; margin-bottom: 25px;">${message}</p>
                    <button onclick="window.location.reload()" style="padding: 12px 25px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
    }

    // ======================
    // START
    // ======================
    init();
});