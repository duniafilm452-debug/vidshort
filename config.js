// ======================
// KONFIGURASI SISTEM
// ======================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// SUPABASE CONFIGURATION
const SUPABASE_CONFIG = {
    url: "https://diwjkvrzcewnhoybruum.supabase.co", // GANTI dengan URL Supabase Anda
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd2prdnJ6Y2V3bmhveWJydXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDIxMjAsImV4cCI6MjA4NjMxODEyMH0.UbWDW4b0d28nHRg_15fKEHZS6Ly4lAG667xhtkYUftU" // GANTI dengan anon key Anda
};

// SMARTLINK CONFIGURATION
const SMARTLINK_CONFIG = {
    url: 'https://example.com/sponsor', // GANTI dengan URL smartlink Anda
    timer: 10, // Waktu timer di halaman sponsor (detik)
    enabled: true // Aktifkan smartlink
};

// APP CONFIGURATION
const APP_CONFIG = {
    countdownTime: 15, // Waktu countdown awal (detik)
    baseUrl: window.location.origin + '/', // Base URL untuk link
    debugMode: false // Mode debug
};

// VALIDATION CONFIGURATION
const VALIDATION_CONFIG = {
    allowedDomains: ['r2.dev', 'cloudflare.com', 'cloudflarestream.com'],
    allowedExtensions: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'],
    maxTitleLength: 200,
    maxDescriptionLength: 1000
};

// ======================
// EKSPORT KONFIGURASI
// ======================

// Untuk penggunaan di script.js
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
const SMARTLINK_URL = SMARTLINK_CONFIG.url;

// Helper function untuk validasi URL
function isValidVideoUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // Cek ekstensi video
        const extension = urlObj.pathname.split('.').pop().toLowerCase();
        const hasValidExtension = VALIDATION_CONFIG.allowedExtensions.includes(extension);
        
        // Cek domain (opsional, bisa di-comment jika ingin menerima semua domain)
        // const hasValidDomain = VALIDATION_CONFIG.allowedDomains.some(domain => 
        //     urlObj.hostname.includes(domain)
        // );
        
        return hasValidExtension; // || hasValidDomain;
        
    } catch (error) {
        console.error('URL validation error:', error);
        return false;
    }
}

// Helper function untuk generate ID
function generateVideoId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}`.substring(0, 20);
}

// Helper function untuk mendapatkan base URL
function getBaseUrl() {
    if (window.location.href.includes('admin.html')) {
        return window.location.origin.replace('/admin.html', '') + '/?v=';
    }
    return window.location.origin + '/?v=';
}

// ======================
// DEBUG FUNCTIONS
// ======================

if (APP_CONFIG.debugMode) {
    console.log('=== SYSTEM CONFIGURATION ===');
    console.log('Supabase URL:', SUPABASE_CONFIG.url ? '✓ Configured' : '✗ Not configured');
    console.log('Smartlink URL:', SMARTLINK_CONFIG.url);
    console.log('Base URL:', getBaseUrl());
    console.log('Debug Mode:', APP_CONFIG.debugMode);
    console.log('==========================');
}

// Ekspor untuk penggunaan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        SMARTLINK_CONFIG,
        APP_CONFIG,
        VALIDATION_CONFIG,
        isValidVideoUrl,
        generateVideoId,
        getBaseUrl
    };
}