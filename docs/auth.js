/**
 * RED COMUNITARIA DE HIP HOP — Authentication
 * ═══════════════════════════════════════════════
 * Client-side SHA-256 hashed password authentication.
 * Passwords are never stored in plain text.
 */

// ─── AUTHORIZED USERS (SHA-256 of "username:password") ─────────
const AUTHORIZED_HASHES = {
    'mercy':         '7b0b7e4bc00851d93cc9294e632683fd2189d18e9f5757613b7777cedb6e2d3f',
    'donatello':     'c43c51c688633b6e1f16b26c466abecabb02418cd631f9646ca29d528a28c7ad',
    'monica':        'fd177059e99c9230f0b3c37b273fc7fee270556560b2fab0a767f48029f311ed',
    'yully':         '83d579bdec3fc9643304b0367e879e2cd7aee3a8b041ddf24bfd726ef58551ad',
    'felipecotero':  'a8d68a23bc5e552649dcf7b9b0eeec9a974f7ff936a9d0bb4cc4b7c7e050ca38'
};

// ─── SHA-256 HASH FUNCTION ─────────────────────────────────────
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── CHECK SESSION ─────────────────────────────────────────────
function checkSession() {
    const session = sessionStorage.getItem('hiphop_auth');
    if (session === 'authenticated') {
        showDashboard();
        return true;
    }
    return false;
}

// ─── SHOW DASHBOARD ────────────────────────────────────────────
function showDashboard() {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard-content');

    loginScreen.classList.add('login-exit');
    setTimeout(() => {
        loginScreen.style.display = 'none';
        dashboard.classList.remove('dashboard-hidden');
        dashboard.classList.add('dashboard-visible');
    }, 500);
}

// ─── LOGIN HANDLER ─────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-user').value.trim().toLowerCase().replace(/\s+/g, '');
    const password = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    // Clear previous errors
    errorEl.textContent = '';
    errorEl.classList.remove('visible');

    // Validate
    if (!username || !password) {
        errorEl.textContent = 'INGRESA USUARIO Y CONTRASEÑA';
        errorEl.classList.add('visible');
        return;
    }

    // Check if username exists
    if (!AUTHORIZED_HASHES[username]) {
        errorEl.textContent = 'USUARIO NO AUTORIZADO';
        errorEl.classList.add('visible');
        shakeForm();
        return;
    }

    // Hash and compare
    btn.textContent = 'VERIFICANDO...';
    btn.disabled = true;

    const hash = await sha256(username + ':' + password);

    if (hash === AUTHORIZED_HASHES[username]) {
        // Success
        sessionStorage.setItem('hiphop_auth', 'authenticated');
        sessionStorage.setItem('hiphop_user', username);
        errorEl.textContent = '';
        btn.textContent = '¡ACCESO CONCEDIDO!';
        btn.classList.add('login-success');

        setTimeout(() => {
            showDashboard();
        }, 600);
    } else {
        // Failed
        errorEl.textContent = 'CONTRASEÑA INCORRECTA';
        errorEl.classList.add('visible');
        btn.textContent = 'ENTRAR';
        btn.disabled = false;
        shakeForm();
    }
}

// ─── SHAKE ANIMATION ON ERROR ──────────────────────────────────
function shakeForm() {
    const container = document.querySelector('.login-container');
    container.classList.add('shake');
    setTimeout(() => container.classList.remove('shake'), 600);
}

// ─── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Check existing session
    if (!checkSession()) {
        // Show login
        document.getElementById('login-screen').style.display = 'flex';
    }

    // Bind form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Enter key on password field
    document.getElementById('login-pass').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin(e);
    });

    // Toggle password visibility
    document.getElementById('toggle-pass').addEventListener('click', () => {
        const passInput = document.getElementById('login-pass');
        const btn = document.getElementById('toggle-pass');
        if (passInput.type === 'password') {
            passInput.type = 'text';
            btn.textContent = '🙈';
            btn.title = 'Ocultar contraseña';
        } else {
            passInput.type = 'password';
            btn.textContent = '👁';
            btn.title = 'Ver contraseña';
        }
    });
});

// ─── LOGOUT ────────────────────────────────────────────────────
function logout() {
    sessionStorage.removeItem('hiphop_auth');
    sessionStorage.removeItem('hiphop_user');
    location.reload();
}
