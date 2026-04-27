/**
 * RED COMUNITARIA DE HIP HOP — Authentication DISABLED
 * ═══════════════════════════════════════════════════════
 * Login screen bypassed — dashboard loads directly.
 */

// ─── AUTO-SHOW DASHBOARD ON LOAD ─────────────────────────────
function showDashboard() {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard-content');

    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) {
        dashboard.classList.remove('dashboard-hidden');
        dashboard.classList.add('dashboard-visible');
    }
}

// ─── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    showDashboard();
});

// ─── LOGOUT (no-op, kept for compatibility) ────────────────────
function logout() {
    location.reload();
}
