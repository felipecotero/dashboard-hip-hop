/**
 * RED COMUNITARIA DE HIP HOP — Dashboard App
 * ═══════════════════════════════════════════
 * Interactive charts with Chart.js, real-time filtering,
 * and dynamic data table.
 */

// ─── GLOBAL STATE ──────────────────────────────────────────────
let DATA = null;
let REGISTROS = [];
let FILTERED = [];
let CHARTS = {};

// ─── NEON PALETTE ──────────────────────────────────────────────
const NEON = {
    green:  '#39FF14',
    pink:   '#FF1493',
    cyan:   '#00F5FF',
    orange: '#FF6B35',
    yellow: '#FFE600',
    purple: '#BF40BF',
    red:    '#FF3131',
    teal:   '#00CED1',
    hotpink:'#FF69B4',
    lime:   '#7FFF00',
    flame:  '#FF4500',
    lavender:'#9370DB'
};

const CHART_COLORS = [
    NEON.pink, NEON.green, NEON.cyan, NEON.orange, NEON.yellow,
    NEON.purple, NEON.red, NEON.teal, NEON.hotpink, NEON.lime,
    NEON.flame, NEON.lavender
];

const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c + '88');

// ─── CHART.JS DEFAULTS ────────────────────────────────────────
Chart.defaults.color = '#AAAACC';
Chart.defaults.borderColor = 'rgba(51,51,51,0.5)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(13,13,13,0.95)';
Chart.defaults.plugins.tooltip.titleFont = { family: "'Permanent Marker', cursive", size: 13 };
Chart.defaults.plugins.tooltip.bodyFont = { family: "'Inter', sans-serif", size: 12 };
Chart.defaults.plugins.tooltip.borderColor = '#39FF14';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 2;
Chart.defaults.plugins.tooltip.padding = 12;

// ─── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Bind logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof logout === 'function') logout();
        });
    }
});

async function loadData() {
    try {
        const resp = await fetch('datos_consolidados.json');
        DATA = await resp.json();
        REGISTROS = DATA.registros;

        // Compute Directo/Indirecto classification
        // Directo = received formation (participated directly in activities)
        // Indirecto = received payment but no formation (staff/contractors)
        //             or did not participate in formation
        REGISTROS.forEach(r => {
            const formacion = (r.RECIBIO_FORMACION || '').toUpperCase().trim();
            const pago = (r.RECIBIO_PAGO || '').toUpperCase().trim();
            if (formacion === 'SI') {
                r.BENEFICIARIO_DIRECTO_INDIRECTO = 'DIRECTO';
            } else if (pago === 'SI') {
                r.BENEFICIARIO_DIRECTO_INDIRECTO = 'INDIRECTO';
            } else {
                r.BENEFICIARIO_DIRECTO_INDIRECTO = 'DIRECTO';
            }
        });

        FILTERED = [...REGISTROS];

        populateFilters();
        updateDashboard();
        bindFilterEvents();

    } catch (err) {
        console.error('Error loading data:', err);
        document.getElementById('stats-cards').innerHTML =
            '<div class="loading">ERROR CARGANDO DATOS</div>';
    }
}

// ─── FILTERS ───────────────────────────────────────────────────

function getUniqueValues(field) {
    const vals = new Set();
    REGISTROS.forEach(r => {
        if (r[field] && r[field] !== 'None' && r[field] !== 'nan') {
            vals.add(r[field]);
        }
    });
    return [...vals].sort();
}

function populateFilters() {
    fillSelect('filter-org', getUniqueValues('ORGANIZACION'));
    fillSelect('filter-depto', getUniqueValues('DEPARTAMENTO'));
    fillSelect('filter-sexo', getUniqueValues('SEXO_AL_NACER'));
    fillSelect('filter-tipo', getUniqueValues('TIPO_DE_BENEFICIARIO'));
    fillSelect('filter-etnia', getUniqueValues('PERTENENCIA_ETNICA'));
    fillSelect('filter-directo', getUniqueValues('BENEFICIARIO_DIRECTO_INDIRECTO'));
    fillSelect('filter-estrato', getUniqueValues('ESTRATO_SOCIOECONOMICO'));
    fillSelect('filter-edad', getUniqueValues('GRUPO_ETARIO'));
    fillSelect('filter-urbano', getUniqueValues('URBANO_RURAL'));
}

function fillSelect(id, values) {
    const sel = document.getElementById(id);
    sel.innerHTML = '';
    values.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
    });
}

function getSelectedValues(id) {
    const sel = document.getElementById(id);
    return [...sel.selectedOptions].map(o => o.value);
}

function applyFilters() {
    const filters = {
        org: getSelectedValues('filter-org'),
        depto: getSelectedValues('filter-depto'),
        sexo: getSelectedValues('filter-sexo'),
        tipo: getSelectedValues('filter-tipo'),
        etnia: getSelectedValues('filter-etnia'),
        directo: getSelectedValues('filter-directo'),
        estrato: getSelectedValues('filter-estrato'),
        edad: getSelectedValues('filter-edad'),
        urbano: getSelectedValues('filter-urbano'),
    };

    FILTERED = REGISTROS.filter(r => {
        if (filters.org.length && !filters.org.includes(r.ORGANIZACION)) return false;
        if (filters.depto.length && !filters.depto.includes(r.DEPARTAMENTO)) return false;
        if (filters.sexo.length && !filters.sexo.includes(r.SEXO_AL_NACER)) return false;
        if (filters.tipo.length && !filters.tipo.includes(r.TIPO_DE_BENEFICIARIO)) return false;
        if (filters.etnia.length && !filters.etnia.includes(r.PERTENENCIA_ETNICA)) return false;
        if (filters.directo.length && !filters.directo.includes(r.BENEFICIARIO_DIRECTO_INDIRECTO)) return false;
        if (filters.estrato.length && !filters.estrato.includes(r.ESTRATO_SOCIOECONOMICO)) return false;
        if (filters.edad.length && !filters.edad.includes(r.GRUPO_ETARIO)) return false;
        if (filters.urbano.length && !filters.urbano.includes(r.URBANO_RURAL)) return false;
        return true;
    });

    updateDashboard();
}

function clearFilters() {
    ['filter-org','filter-depto','filter-sexo','filter-tipo',
     'filter-etnia','filter-directo','filter-estrato','filter-edad','filter-urbano'].forEach(id => {
        const sel = document.getElementById(id);
        [...sel.options].forEach(o => o.selected = false);
    });
    FILTERED = [...REGISTROS];
    updateDashboard();
}

function bindFilterEvents() {
    ['filter-org','filter-depto','filter-sexo','filter-tipo',
     'filter-etnia','filter-directo','filter-estrato','filter-edad','filter-urbano'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyFilters);
    });
    document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
}

// ─── UPDATE DASHBOARD ──────────────────────────────────────────

function updateDashboard() {
    updateStatCards();
    updateCharts();
    updateTable();
}

// ─── STAT CARDS ────────────────────────────────────────────────

function countField(field, value) {
    return FILTERED.filter(r => r[field] === value).length;
}

function countFieldExists(field) {
    const vals = new Set();
    FILTERED.forEach(r => {
        if (r[field] && r[field] !== 'None' && r[field] !== 'nan') vals.add(r[field]);
    });
    return vals.size;
}

function animateNumber(el, target) {
    const duration = 600;
    const start = parseInt(el.textContent) || 0;
    const diff = target - start;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + diff * eased).toLocaleString('es-CO');
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function updateStatCards() {
    animateNumber(document.getElementById('stat-total'), FILTERED.length);
    animateNumber(document.getElementById('stat-orgs'), countFieldExists('ORGANIZACION'));
    animateNumber(document.getElementById('stat-deptos'), countFieldExists('DEPARTAMENTO'));
    animateNumber(document.getElementById('stat-hombres'), countField('SEXO_AL_NACER', 'HOMBRE'));
    animateNumber(document.getElementById('stat-mujeres'), countField('SEXO_AL_NACER', 'MUJER'));
    animateNumber(document.getElementById('stat-urbano'), countField('URBANO_RURAL', 'URBANO'));
}

// ─── CHART HELPERS ─────────────────────────────────────────────

function countByField(field) {
    const counts = {};
    FILTERED.forEach(r => {
        const val = r[field] || 'Sin dato';
        if (val === 'None' || val === 'nan') return;
        counts[val] = (counts[val] || 0) + 1;
    });
    // Sort by count desc
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function normalizeEscolaridad(val) {
    if (!val || val === 'None' || val === 'nan') return 'Sin dato';
    const v = val.toUpperCase().trim();
    if (v.includes('PRESCOLAR') || v.includes('PREESCOL')) return 'PREESCOLAR';
    if (v.includes('PRIMARIA')) return 'PRIMARIA';
    if (v.includes('SECUNDARIA') && !v.includes('BACHILLER')) return 'SECUNDARIA';
    if (v.includes('BACHILLER') || v.includes('BACHILLERATO')) return 'BACHILLERATO';
    if (v.includes('TÉCNIC') || v.includes('TECNIC')) return 'TÉCNICO';
    if (v.includes('TECNÓLOG') || v.includes('TECNOLOG')) return 'TECNÓLOGO';
    if (v.includes('PROFESIONAL')) return 'PROFESIONAL';
    if (v.includes('ESPECIALIZ') || v.includes('ESPECIALISTA')) return 'ESPECIALIZACIÓN';
    if (v.includes('MAGIST') || v.includes('MAESTRÍA')) return 'MAESTRÍA';
    if (v.includes('NINGUN') || v.includes('SIN ESTUD') || v.includes('NO APLICA') || v.includes('NO REGISTRA') || v.includes('SIN INFORM')) return 'SIN ESTUDIOS';
    return val;
}

function countByFieldNormalized(field, normFn) {
    const counts = {};
    FILTERED.forEach(r => {
        const rawVal = r[field];
        if (!rawVal || rawVal === 'None' || rawVal === 'nan') return;
        const val = normFn(rawVal);
        counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function normalizeEtnia(val) {
    if (!val || val === 'None' || val === 'nan' || val === '1') return 'Sin dato';
    const v = val.toUpperCase().trim();
    if (v.includes('NINGÚN') || v.includes('NINGUN')) return 'NINGÚN GRUPO ÉTNICO';
    if (v.includes('AFRODES') || v.includes('AFROCOLOMB') || v.includes('NEGRO') || v.includes('MULATO')) return 'AFRODESCENDIENTE';
    if (v.includes('INDÍGEN') || v.includes('INDIGEN')) return 'INDÍGENA';
    if (v.includes('RAIZAL')) return 'RAIZAL';
    return val;
}

function destroyChart(id) {
    if (CHARTS[id]) {
        CHARTS[id].destroy();
        delete CHARTS[id];
    }
}

// ─── CREATE CHARTS ─────────────────────────────────────────────

function updateCharts() {
    createOrgChart();
    createSexoChart();
    createEscolaridadChart();
    createEstratoChart();
    createDeptosChart();
    createEtniaChart();
    createEdadChart();
    createUrbanoChart();
    createTipoChart();
    createFormacionChart();
}

function createOrgChart() {
    const data = countByField('ORGANIZACION');
    destroyChart('orgs');
    CHARTS.orgs = new Chart(document.getElementById('chart-orgs'), {
        type: 'bar',
        data: {
            labels: data.map(d => d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '99'),
                borderColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderWidth: 2,
                borderRadius: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => {
                            const pct = ((ctx.raw / FILTERED.length) * 100).toFixed(1);
                            return `${pct}% del total`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(51,51,51,0.3)' },
                    ticks: {
                        font: { family: "'Bebas Neue', sans-serif", size: 14 }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Permanent Marker', cursive", size: 11 },
                        color: '#AAAACC'
                    }
                }
            }
        }
    });
}

function createSexoChart() {
    const data = countByField('SEXO_AL_NACER').filter(d => d[0] !== '1');
    destroyChart('sexo');
    CHARTS.sexo = new Chart(document.getElementById('chart-sexo'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: [NEON.orange, NEON.purple, NEON.cyan, NEON.yellow],
                borderColor: '#0D0D0D',
                borderWidth: 3,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'Permanent Marker', cursive", size: 12 },
                        padding: 20,
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => {
                            const total = data.reduce((s, d) => s + d[1], 0);
                            return `${((ctx.raw / total) * 100).toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

function createEscolaridadChart() {
    const data = countByFieldNormalized('NIVEL_DE_ESCOLARIDAD', normalizeEscolaridad);
    const order = ['PREESCOLAR','PRIMARIA','SECUNDARIA','BACHILLERATO','TÉCNICO','TECNÓLOGO','PROFESIONAL','ESPECIALIZACIÓN','MAESTRÍA','SIN ESTUDIOS'];
    const sorted = order.filter(o => data.find(d => d[0] === o))
                        .map(o => data.find(d => d[0] === o));

    destroyChart('escolaridad');
    CHARTS.escolaridad = new Chart(document.getElementById('chart-escolaridad'), {
        type: 'bar',
        data: {
            labels: sorted.map(d => d[0]),
            datasets: [{
                data: sorted.map(d => d[1]),
                backgroundColor: sorted.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '88'),
                borderColor: sorted.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderWidth: 2,
                borderRadius: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Permanent Marker', cursive", size: 10 },
                        maxRotation: 45,
                    }
                },
                y: {
                    grid: { color: 'rgba(51,51,51,0.3)' },
                    ticks: {
                        font: { family: "'Bebas Neue', sans-serif", size: 14 }
                    }
                }
            }
        }
    });
}

function createEstratoChart() {
    const data = countByField('ESTRATO_SOCIOECONOMICO')
                    .filter(d => d[0] !== 'Sin dato' && d[0] !== 'None');
    const estratoColors = [NEON.green, NEON.cyan, NEON.orange, NEON.red, NEON.purple, NEON.yellow];

    destroyChart('estrato');
    CHARTS.estrato = new Chart(document.getElementById('chart-estrato'), {
        type: 'bar',
        data: {
            labels: data.map(d => 'Estrato ' + d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: data.map((_, i) => estratoColors[i] + '88'),
                borderColor: data.map((_, i) => estratoColors[i]),
                borderWidth: 2,
                borderRadius: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Permanent Marker', cursive", size: 12 }
                    }
                },
                y: {
                    grid: { color: 'rgba(51,51,51,0.3)' },
                    ticks: {
                        font: { family: "'Bebas Neue', sans-serif", size: 14 }
                    }
                }
            }
        }
    });
}

function createDeptosChart() {
    const data = countByField('DEPARTAMENTO').filter(d => d[0] !== '1').slice(0, 12);
    destroyChart('deptos');
    CHARTS.deptos = new Chart(document.getElementById('chart-deptos'), {
        type: 'bar',
        data: {
            labels: data.map(d => d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '88'),
                borderColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderWidth: 2,
                borderRadius: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { color: 'rgba(51,51,51,0.3)' },
                    ticks: {
                        font: { family: "'Bebas Neue', sans-serif", size: 14 }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Permanent Marker', cursive", size: 11 },
                        color: '#AAAACC'
                    }
                }
            }
        }
    });
}

function createEtniaChart() {
    const data = countByFieldNormalized('PERTENENCIA_ETNICA', normalizeEtnia)
                    .filter(d => d[0] !== 'Sin dato');
    const etniaColors = [NEON.lime, NEON.orange, NEON.cyan, NEON.pink, NEON.yellow];

    destroyChart('etnia');
    CHARTS.etnia = new Chart(document.getElementById('chart-etnia'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: data.map((_, i) => etniaColors[i % etniaColors.length]),
                borderColor: '#0D0D0D',
                borderWidth: 3,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'Permanent Marker', cursive", size: 11 },
                        padding: 14,
                    }
                }
            }
        }
    });
}

function createEdadChart() {
    const data = countByField('GRUPO_ETARIO');
    const order = ['Niñez (0-13)', 'Adolescencia (14-17)', 'Juventud (18-28)', 'Adultez (29-59)', 'Adulto mayor (60+)', 'Sin dato'];
    const sorted = order.filter(o => data.find(d => d[0] === o))
                        .map(o => data.find(d => d[0] === o));
    const edadColors = [NEON.cyan, NEON.green, NEON.pink, NEON.orange, NEON.red, NEON.lavender];

    destroyChart('edad');
    CHARTS.edad = new Chart(document.getElementById('chart-edad'), {
        type: 'bar',
        data: {
            labels: sorted.map(d => d[0]),
            datasets: [{
                data: sorted.map(d => d[1]),
                backgroundColor: sorted.map((_, i) => edadColors[i] + '88'),
                borderColor: sorted.map((_, i) => edadColors[i]),
                borderWidth: 2,
                borderRadius: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Permanent Marker', cursive", size: 10 },
                        maxRotation: 30,
                    }
                },
                y: {
                    grid: { color: 'rgba(51,51,51,0.3)' },
                    ticks: {
                        font: { family: "'Bebas Neue', sans-serif", size: 14 }
                    }
                }
            }
        }
    });
}

function createUrbanoChart() {
    const data = countByField('URBANO_RURAL').filter(d => d[0] !== '1');
    const urbColors = [NEON.cyan, NEON.green];

    destroyChart('urbano');
    CHARTS.urbano = new Chart(document.getElementById('chart-urbano'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: urbColors,
                borderColor: '#0D0D0D',
                borderWidth: 3,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'Permanent Marker', cursive", size: 13 },
                        padding: 20,
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => {
                            const total = data.reduce((s, d) => s + d[1], 0);
                            return `${((ctx.raw / total) * 100).toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

function createTipoChart() {
    const data = countByField('TIPO_DE_BENEFICIARIO').filter(d => d[0] !== '1');
    const tipoColors = [NEON.green, NEON.pink, NEON.orange, NEON.cyan];

    destroyChart('tipo');
    CHARTS.tipo = new Chart(document.getElementById('chart-tipo'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: tipoColors,
                borderColor: '#0D0D0D',
                borderWidth: 3,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'Permanent Marker', cursive", size: 12 },
                        padding: 16,
                    }
                }
            }
        }
    });
}

function createFormacionChart() {
    const data = countByField('RECIBIO_FORMACION').filter(d => d[0] !== 'None' && d[0] !== 'nan');
    const formColors = [NEON.green, NEON.red, NEON.yellow, NEON.cyan];

    destroyChart('formacion');
    CHARTS.formacion = new Chart(document.getElementById('chart-formacion'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: formColors,
                borderColor: '#0D0D0D',
                borderWidth: 3,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'Permanent Marker', cursive", size: 12 },
                        padding: 16,
                    }
                }
            }
        }
    });
}

// ─── DATA TABLE ────────────────────────────────────────────────

function updateTable() {
    const tbody = document.getElementById('table-body');
    const countEl = document.getElementById('table-count');
    
    // Show max 200 rows for performance
    const display = FILTERED.slice(0, 200);
    countEl.textContent = `${FILTERED.length.toLocaleString('es-CO')} registros${FILTERED.length > 200 ? ' (mostrando primeros 200)' : ''}`;

    tbody.innerHTML = display.map((r, i) => {
        const nombre = [r.PRIMER_NOMBRE, r.SEGUNDO_NOMBRE, r.PRIMER_APELLIDO, r.SEGUNDO_APELLIDO]
            .filter(v => v && v !== 'None')
            .join(' ');
        return `<tr>
            <td>${i + 1}</td>
            <td>${r.ORGANIZACION || '—'}</td>
            <td>${nombre || '—'}</td>
            <td>${r.DEPARTAMENTO || '—'}</td>
            <td>${r.TIPO_DE_BENEFICIARIO || '—'}</td>
            <td>${r.SEXO_AL_NACER || '—'}</td>
            <td>${r.EDAD || '—'}</td>
            <td>${normalizeEscolaridad(r.NIVEL_DE_ESCOLARIDAD)}</td>
            <td>${r.ESTRATO_SOCIOECONOMICO || '—'}</td>
            <td>${r.URBANO_RURAL || '—'}</td>
        </tr>`;
    }).join('');
}
