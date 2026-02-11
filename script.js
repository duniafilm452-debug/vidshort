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
    });

    /* =========================
       GET VIDEO ID FROM URL
    ========================== */
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");

    if (!videoId) {
        alert("Video tidak ditemukan.");
        return;
    }

    /* =========================
       FETCH VIDEO FROM SUPABASE
    ========================== */
    async function loadVideo() {
        const { data, error } = await supabaseClient
            .from("videos") // ganti jika nama tabel berbeda
            .select("*")
            .eq("id", videoId)
            .single();

        if (error) {
            console.error(error);
            alert("Gagal memuat video.");
            return;
        }

        if (data) {
            if (videoTitle) videoTitle.textContent = data.title;
            if (videoDescription) videoDescription.textContent = data.description;
            if (videoViews) videoViews.textContent = data.views || 0;
            if (videoDate) videoDate.textContent = new Date(data.created_at).toLocaleDateString();

            if (videoPlayer && data.video_url) {
                videoPlayer.src = data.video_url;
            }
        }
    }

    loadVideo();

    /* =========================
       COUNTDOWN
    ========================== */
    let timeLeft = 15;

    const countdownInterval = setInterval(function () {
        timeLeft--;

        if (countdownNumber) {
            countdownNumber.textContent = timeLeft;
        }

        if (progressBar) {
            progressBar.style.width = ((15 - timeLeft) / 15) * 100 + "%";
        }

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            if (instructionSection) {
                instructionSection.scrollIntoView({ behavior: "smooth" });
            }
        }

    }, 1000);

    /* =========================
       SCROLL DETECT
    ========================== */
    window.addEventListener("scroll", function () {
        if (!instructionSection || !nextSection) return;

        const triggerPoint = instructionSection.offsetTop;

        if (window.scrollY > triggerPoint - 200) {
            nextSection.classList.add("show");
        }
    });

    /* =========================
       SPONSOR FLOW
    ========================== */
    if (nextButton) {
        nextButton.addEventListener("click", function () {

            if (adPage) {
                adPage.style.display = "block";
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

                    if (adPage) adPage.style.display = "none";

                    if (videoSection) {
                        videoSection.style.display = "block";
                        videoSection.scrollIntoView({ behavior: "smooth" });
                    }
                }

            }, 1000);
        });
    }

    if (backButton) {
        backButton.addEventListener("click", function () {
            if (adPage) adPage.style.display = "none";
            if (nextSection) nextSection.scrollIntoView({ behavior: "smooth" });
        });
    }

    /* =========================
       WATCH VIDEO
    ========================== */
    if (watchButton) {
        watchButton.addEventListener("click", function () {

            if (videoPlayerSection) {
                videoPlayerSection.style.display = "block";
                videoPlayerSection.scrollIntoView({ behavior: "smooth" });
            }

            if (videoPlayer) {
                videoPlayer.play();
            }
        });
    }

    if (backToVideoButton) {
        backToVideoButton.addEventListener("click", function () {

            if (videoPlayer) videoPlayer.pause();
            if (videoPlayerSection) videoPlayerSection.style.display = "none";
            if (videoSection) videoSection.scrollIntoView({ behavior: "smooth" });
        });
    }

});