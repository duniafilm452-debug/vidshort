document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       SUPABASE CONFIG
    ========================== */
    const SUPABASE_URL = "https://diwjkvrzcewnhoybruum.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU";

    const supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    /* =========================
       ELEMENT REFERENCES
    ========================== */
    const loadingScreen = document.getElementById("loadingScreen");

    const countdownNumber = document.getElementById("countdownNumber");
    const progressBar = document.getElementById("progressBar");
    const countdownSection = document.getElementById("countdownSection");

    const instructionSection = document.getElementById("instructionSection");
    const nextSection = document.getElementById("nextSection");
    const adPage = document.getElementById("adPage");
    const videoSection = document.getElementById("videoSection");
    const videoPlayerSection = document.getElementById("videoPlayerSection");

    const nextButton = document.getElementById("nextButton");
    const backButton = document.getElementById("backButton");
    const watchButton = document.getElementById("watchButton");
    const backToVideoButton = document.getElementById("backToVideoButton");

    const videoPlayer = document.getElementById("videoPlayer");

    const videoTitle = document.getElementById("videoTitle");
    const videoDescription = document.getElementById("videoDescription");
    const videoViews = document.getElementById("videoViews");
    const videoDate = document.getElementById("videoDate");

    /* =========================
       HIDE LOADING FIX
    ========================== */
    window.addEventListener("load", function () {
        if (loadingScreen) {
            loadingScreen.style.display = "none";
        }
        document.body.classList.add("loaded");
    });

    /* =========================
       GET VIDEO ID FROM URL
    ========================== */
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");

    if (!videoId) {
        showToast("Video tidak ditemukan. ID tidak valid.");
        return;
    }

    /* =========================
       FETCH VIDEO FROM SUPABASE
    ========================== */
    async function loadVideo() {
        try {
            const { data, error } = await supabaseClient
                .from("videos")
                .select("*")
                .eq("id", videoId)
                .single();

            if (error) {
                console.error(error);
                showToast("Gagal memuat video.");
                return;
            }

            if (data) {
                if (videoTitle) videoTitle.textContent = data.title || "Judul Tidak Tersedia";
                if (videoDescription) videoDescription.textContent = data.description || "Tidak ada deskripsi.";
                if (videoViews) videoViews.textContent = data.views || 0;
                if (videoDate) videoDate.textContent = data.created_at ? new Date(data.created_at).toLocaleDateString('id-ID') : '-';

                if (videoPlayer && data.video_url) {
                    videoPlayer.src = data.video_url;
                }
            }
        } catch (err) {
            console.error(err);
            showToast("Terjadi kesalahan saat memuat video.");
        }
    }

    loadVideo();

    /* =========================
       COUNTDOWN - FIXED!
    ========================== */
    let timeLeft = 15;
    let countdownActive = true;

    const countdownInterval = setInterval(function () {
        if (!countdownActive) return;
        
        timeLeft--;

        if (countdownNumber) {
            countdownNumber.textContent = timeLeft;
        }

        if (progressBar) {
            const progress = ((15 - timeLeft) / 15) * 100;
            progressBar.style.width = progress + "%";
        }

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            countdownActive = false;
            
            // FIX: Tampilkan instruction section dengan display flex
            if (instructionSection) {
                instructionSection.style.display = "flex";
                instructionSection.scrollIntoView({ behavior: "smooth" });
            }
            
            // Sembunyikan countdown section
            if (countdownSection) {
                countdownSection.style.display = "none";
            }
        }

    }, 1000);

    /* =========================
       SCROLL DETECT - FIXED!
    ========================== */
    window.addEventListener("scroll", function () {
        if (!instructionSection || !nextSection) return;
        
        // Hanya proses jika instruction section sedang ditampilkan
        if (instructionSection.style.display !== "flex") return;

        const triggerPoint = instructionSection.offsetTop;
        const scrollPosition = window.scrollY + window.innerHeight / 2;

        if (scrollPosition > triggerPoint) {
            // FIX: Tampilkan next section dengan display flex
            nextSection.style.display = "flex";
            nextSection.classList.add("show");
        }
    });

    /* =========================
       SPONSOR FLOW - FIXED!
    ========================== */
    if (nextButton) {
        nextButton.addEventListener("click", function () {
            
            // Sembunyikan next section
            if (nextSection) {
                nextSection.style.display = "none";
            }
            
            // Tampilkan ad page
            if (adPage) {
                adPage.style.display = "flex";
                adPage.scrollIntoView({ behavior: "smooth" });
            }

            let adTime = 10;
            const adTimer = document.getElementById("adTimer");

            const adInterval = setInterval(function () {
                adTime--;

                if (adTimer) {
                    adTimer.textContent = adTime;
                }

                if (adTime <= 0) {
                    clearInterval(adInterval);

                    // Sembunyikan ad page
                    if (adPage) adPage.style.display = "none";

                    // Tampilkan video section
                    if (videoSection) {
                        videoSection.style.display = "flex";
                        videoSection.scrollIntoView({ behavior: "smooth" });
                    }
                    
                    showToast("✅ Akses video telah dibuka!");
                }

            }, 1000);
        });
    }

    if (backButton) {
        backButton.addEventListener("click", function () {
            if (adPage) adPage.style.display = "none";
            if (nextSection) {
                nextSection.style.display = "flex";
                nextSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    }

    /* =========================
       WATCH VIDEO - FIXED!
    ========================== */
    if (watchButton) {
        watchButton.addEventListener("click", function () {

            // Sembunyikan video section
            if (videoSection) {
                videoSection.style.display = "none";
            }

            // Tampilkan video player section
            if (videoPlayerSection) {
                videoPlayerSection.style.display = "flex";
                videoPlayerSection.scrollIntoView({ behavior: "smooth" });
            }

            // Putar video
            if (videoPlayer) {
                videoPlayer.play().catch(e => {
                    console.log("Autoplay diblokir:", e);
                });
            }
        });
    }

    if (backToVideoButton) {
        backToVideoButton.addEventListener("click", function () {

            if (videoPlayer) videoPlayer.pause();
            
            // Sembunyikan video player section
            if (videoPlayerSection) videoPlayerSection.style.display = "none";
            
            // Tampilkan video section
            if (videoSection) {
                videoSection.style.display = "flex";
                videoSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    }

    /* =========================
       UTILITY: SHOW TOAST
    ========================== */
    function showToast(message, duration = 4000) {
        const toast = document.createElement("div");
        toast.className = "toast-message";
        toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    /* =========================
       INITIAL STATE - FIXED!
    ========================== */
    // Set initial display states
    if (countdownSection) countdownSection.style.display = "flex";
    if (instructionSection) instructionSection.style.display = "none";
    if (nextSection) nextSection.style.display = "none";
    if (adPage) adPage.style.display = "none";
    if (videoSection) videoSection.style.display = "none";
    if (videoPlayerSection) videoPlayerSection.style.display = "none";

});