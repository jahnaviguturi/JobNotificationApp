/**
 * Job Notification Tracker - Intelli-Match Engine & Router
 */
import { jobs } from './data.js';

// --- INITIALIZATION ---
let savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
let preferences = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || null;
let showOnlyMatches = false;

// --- MATCH ENGINE ---
const calculateMatchScore = (job) => {
    if (!preferences) return 0;

    let score = 0;

    // 1. Role Keywords (+25 title, +15 description)
    if (preferences.roleKeywords) {
        const keywords = preferences.roleKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
        const title = job.title.toLowerCase();
        const desc = job.description.toLowerCase();

        const titleMatch = keywords.some(k => title.includes(k));
        const descMatch = keywords.some(k => desc.includes(k));

        if (titleMatch) score += 25;
        if (descMatch) score += 15;
    }

    // 2. Preferred Locations (+15)
    if (preferences.preferredLocations && preferences.preferredLocations.length > 0) {
        if (preferences.preferredLocations.includes(job.location)) {
            score += 15;
        }
    }

    // 3. Preferred Mode (+10)
    if (preferences.preferredMode && preferences.preferredMode.length > 0) {
        if (preferences.preferredMode.includes(job.mode)) {
            score += 10;
        }
    }

    // 4. Experience Level (+10)
    if (preferences.experienceLevel && job.experience === preferences.experienceLevel) {
        score += 10;
    }

    // 5. Skills Overlap (+15)
    if (preferences.skills && job.skills) {
        const userSkills = preferences.skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        const jobSkills = job.skills.map(s => s.toLowerCase());
        const hasOverlap = userSkills.some(s => jobSkills.includes(s));
        if (hasOverlap) score += 15;
    }

    // 6. Recent Posting (+5)
    if (job.postedDaysAgo <= 2) {
        score += 5;
    }

    // 7. Source LinkedIn (+5)
    if (job.source === 'LinkedIn') {
        score += 5;
    }

    return Math.min(score, 100);
};

const getScoreColor = (score) => {
    if (score >= 80) return 'score-high'; // Green
    if (score >= 60) return 'score-med';  // Amber
    if (score >= 40) return 'score-low';  // Neutral
    return 'score-none';                 // Grey
};

// --- SALARY EXTRACTION ---
const extractSalary = (salaryStr) => {
    if (!salaryStr) return 0;
    // Extract first number
    const match = salaryStr.match(/(\d+(\.\d+)?)/);
    if (!match) return 0;
    let val = parseFloat(match[0]);

    if (salaryStr.toLowerCase().includes('month')) {
        // Convert to LPA (roughly)
        return (val * 12) / 100;
    }
    return val;
};

// --- ROUTER & RENDERING ---
const routes = {
    '/': {
        render: () => `
            <section class="landing-hero container">
                <h1 class="hero-headline serif">Stop Missing The Right Jobs.</h1>
                <p class="hero-subtext">Precision-matched job discovery delivered daily at 9AM.</p>
                <div class="hero-actions">
                    <a href="/settings" class="btn btn-primary" data-link>Start Tracking</a>
                </div>
            </section>
        `
    },
    '/dashboard': {
        render: () => {
            const banner = !preferences ? `
                <div class="preferences-banner container">
                    <div class="banner-content">
                        <span>Set your preferences to activate intelligent matching.</span>
                        <a href="/settings" class="btn btn-secondary btn-sm" data-link>Configure Now</a>
                    </div>
                </div>
            ` : '';

            return `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline serif">Dashboard</h1>
                    <p class="subtext">Your career overview and active tracking status.</p>
                </div>
            </section>
            ${banner}
            <div class="filter-bar">
                <div class="container">
                    <div class="filter-grid">
                        <input type="text" id="filter-search" placeholder="Search roles or companies..." class="input-base search-input">
                        
                        <div class="toggle-container">
                            <label class="switch">
                                <input type="checkbox" id="match-threshold-toggle" ${showOnlyMatches ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                            <span class="toggle-label">Matches Only</span>
                        </div>

                        <select id="filter-location" class="input-base filter-group">
                            <option value="">All Locations</option>
                            <option value="Bengaluru">Bengaluru</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Hyderabad">Hyderabad</option>
                            <option value="Chennai">Chennai</option>
                            <option value="Pune">Pune</option>
                            <option value="Gurugram">Gurugram</option>
                            <option value="Noida">Noida</option>
                        </select>
                        <select id="filter-mode" class="input-base filter-group">
                            <option value="">All Modes</option>
                            <option value="Remote">Remote</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Onsite">Onsite</option>
                        </select>
                        <select id="filter-source" class="input-base filter-group">
                            <option value="">All Sources</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Naukri">Naukri</option>
                            <option value="Indeed">Indeed</option>
                        </select>
                        <select id="filter-sort" class="input-base filter-group">
                            <option value="latest">Latest</option>
                            <option value="score">Match Score</option>
                            <option value="salary">Salary (High)</option>
                        </select>
                    </div>
                </div>
            </div>
            <main class="container">
                <div id="job-list" class="job-grid"></div>
            </main>
            `;
        },
        afterRender: () => {
            handleFiltering();
            setupDashboardEvents();
        }
    },
    '/settings': {
        render: () => {
            const p = preferences || {};
            return `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline serif">Settings</h1>
                    <p class="subtext">Refine your preferences to improve notification accuracy.</p>
                </div>
            </section>
            <main class="main-layout container">
                <div class="primary-workspace">
                    <div class="card">
                        <h2 class="card-title serif">Intelli-Match Preferences</h2>
                        <form id="preferences-form" class="settings-form">
                            <div class="form-group">
                                <label for="roleKeywords">Role Keywords</label>
                                <input type="text" id="roleKeywords" value="${p.roleKeywords || ''}" placeholder="e.g. SDE, Frontend, React" class="input-base">
                                <small class="input-hint">Comma-separated</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="preferredLocations">Preferred Locations</label>
                                <select id="preferredLocations" multiple class="input-base" style="height: 120px;">
                                    <option value="Bengaluru" ${p.preferredLocations?.includes('Bengaluru') ? 'selected' : ''}>Bengaluru</option>
                                    <option value="Mumbai" ${p.preferredLocations?.includes('Mumbai') ? 'selected' : ''}>Mumbai</option>
                                    <option value="Hyderabad" ${p.preferredLocations?.includes('Hyderabad') ? 'selected' : ''}>Hyderabad</option>
                                    <option value="Chennai" ${p.preferredLocations?.includes('Chennai') ? 'selected' : ''}>Chennai</option>
                                    <option value="Pune" ${p.preferredLocations?.includes('Pune') ? 'selected' : ''}>Pune</option>
                                    <option value="Gurugram" ${p.preferredLocations?.includes('Gurugram') ? 'selected' : ''}>Gurugram</option>
                                    <option value="Noida" ${p.preferredLocations?.includes('Noida') ? 'selected' : ''}>Noida</option>
                                    <option value="Remote" ${p.preferredLocations?.includes('Remote') ? 'selected' : ''}>Remote</option>
                                </select>
                                <small class="input-hint">Hold Ctrl/Cmd to select multiple</small>
                            </div>

                            <div class="form-group">
                                <label>Preferred Mode</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-container">Remote
                                        <input type="checkbox" name="preferredMode" value="Remote" ${p.preferredMode?.includes('Remote') ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                    </label>
                                    <label class="checkbox-container">Hybrid
                                        <input type="checkbox" name="preferredMode" value="Hybrid" ${p.preferredMode?.includes('Hybrid') ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                    </label>
                                    <label class="checkbox-container">Onsite
                                        <input type="checkbox" name="preferredMode" value="Onsite" ${p.preferredMode?.includes('Onsite') ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                    </label>
                                </div>
                            </div>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="experienceLevel">Experience Level</label>
                                    <select id="experienceLevel" class="input-base">
                                        <option value="Fresher" ${p.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                                        <option value="0-1" ${p.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Year</option>
                                        <option value="1-3" ${p.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                                        <option value="3-5" ${p.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="minMatchScore">Min Match Score: <span id="score-val">${p.minMatchScore || 40}</span>%</label>
                                    <input type="range" id="minMatchScore" min="0" max="100" value="${p.minMatchScore || 40}" class="slider-input">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="skills">Desired Skills</label>
                                <input type="text" id="skills" value="${p.skills || ''}" placeholder="e.g. JavaScript, Python, SQL" class="input-base">
                                <small class="input-hint">Comma-separated</small>
                            </div>

                            <div style="margin-top: 32px;">
                                <button type="submit" class="btn btn-primary">Save Preferences</button>
                                <span id="save-status" class="status-msg"></span>
                            </div>
                        </form>
                    </div>
                </div>
                <aside class="secondary-panel">
                    <div class="panel-section">
                        <h3 class="panel-title">Scoring Logic</h3>
                        <p class="panel-text">Our engine rewards relevant titles (+25), description matches (+15), and location/mode alignment. Setting precise skills boosts accuracy by 15 points.</p>
                    </div>
                </aside>
            </main>
            `;
        },
        afterRender: () => {
            setupSettingsEvents();
        }
    },
    '/saved': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline serif">Saved Jobs</h1>
                    <p class="subtext">Your shortlist of potential opportunities.</p>
                </div>
            </section>
            <main class="container">
                <div id="saved-job-list" class="job-grid"></div>
            </main>
        `,
        afterRender: () => {
            const filteredSaved = jobs.filter(j => savedJobs.includes(j.id));
            renderJobs(filteredSaved, 'saved-job-list');
        }
    },
    '/digest': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline serif">Daily Digest</h1>
                    <p class="subtext">A curated summary of the best matches found in the last 24 hours.</p>
                </div>
            </section>
            <main class="container">
                <div class="empty-state">
                    <div class="empty-state-content">
                        <h2 class="card-title serif">Awaiting active tracking...</h2>
                        <p class="card-description">Daily digests are generated based on your match scores. Set your preferences to enable high-signal alerts every morning at 9AM.</p>
                    </div>
                </div>
            </main>
        `
    },
    '/proof': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline serif">Validation Proof</h1>
                    <p class="subtext">Artifacts and system logs for implementation verification.</p>
                </div>
            </section>
        `
    }
};

// --- CORE JOB RENDERING ---
const renderJobs = (jobsToRender, containerId = 'job-list') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (jobsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-content">
                    <h2 class="card-title serif">No roles match your criteria.</h2>
                    <p class="card-description">Try adjusting your filters or lowering your match threshold.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = jobsToRender.map(job => {
        const score = calculateMatchScore(job);
        const scoreClass = getScoreColor(score);

        return `
        <article class="job-card">
            <div class="job-card-header">
                <div class="job-header-top">
                    <div class="job-source-badge">${job.source}</div>
                    ${preferences ? `<div class="match-badge ${scoreClass}">${score}% Match</div>` : ''}
                </div>
                <h3 class="job-title serif">${job.title}</h3>
                <div class="job-company">${job.company}</div>
            </div>
            <div class="job-meta">
                <span class="meta-item">${job.location}</span>
                <span class="meta-item">${job.mode}</span>
                <span class="meta-item">${job.experience} Exp</span>
            </div>
            <div class="job-details">
                <div class="job-salary">${job.salaryRange}</div>
                <div class="job-posted">${job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo + ' days ago'}</div>
            </div>
            <div class="job-actions">
                <button class="btn btn-secondary btn-sm" onclick="window.viewJob('${job.id}')">View</button>
                <button class="btn btn-secondary btn-sm btn-save ${savedJobs.includes(job.id) ? 'saved' : ''}" id="save-${job.id}" onclick="window.toggleSave('${job.id}')">
                    ${savedJobs.includes(job.id) ? 'Saved' : 'Save'}
                </button>
                <a href="${job.applyUrl}" target="_blank" class="btn btn-primary btn-sm" style="grid-column: span 2; margin-top: 8px;">Apply Now</a>
            </div>
        </article>
    `}).join('');
};

// --- DASHBOARD LOGIC ---
const handleFiltering = () => {
    const search = document.getElementById('filter-search');
    const loc = document.getElementById('filter-location');
    const mode = document.getElementById('filter-mode');
    const source = document.getElementById('filter-source');
    const sort = document.getElementById('filter-sort');
    const toggle = document.getElementById('match-threshold-toggle');

    if (!search) return;

    const query = search.value.toLowerCase();
    const locVal = loc.value;
    const modeVal = mode.value;
    const sourceVal = source.value;
    const sortVal = sort.value;
    const matchesOnly = toggle ? toggle.checked : false;

    let filtered = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query);
        const matchesLoc = !locVal || job.location === locVal;
        const matchesMode = !modeVal || job.mode === modeVal;
        const matchesSource = !sourceVal || job.source === sourceVal;

        const score = calculateMatchScore(job);
        const meetsThreshold = !matchesOnly || !preferences || score >= (preferences.minMatchScore || 0);

        return matchesSearch && matchesLoc && matchesMode && matchesSource && meetsThreshold;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortVal === 'latest') return a.postedDaysAgo - b.postedDaysAgo;
        if (sortVal === 'score') return calculateMatchScore(b) - calculateMatchScore(a);
        if (sortVal === 'salary') return extractSalary(b.salaryRange) - extractSalary(a.salaryRange);
        return 0;
    });

    renderJobs(filtered);
};

const setupDashboardEvents = () => {
    const inputs = ['filter-search', 'filter-location', 'filter-mode', 'filter-source', 'filter-sort', 'match-threshold-toggle'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {
            if (id === 'match-threshold-toggle') showOnlyMatches = el.checked;
            handleFiltering();
        });
    });
};

// --- SETTINGS LOGIC ---
const setupSettingsEvents = () => {
    const form = document.getElementById('preferences-form');
    const slider = document.getElementById('minMatchScore');
    const scoreVal = document.getElementById('score-val');

    if (slider) {
        slider.addEventListener('input', () => scoreVal.textContent = slider.value);
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const selectedLocations = Array.from(document.getElementById('preferredLocations').selectedOptions).map(o => o.value);
            const selectedModes = Array.from(form.querySelectorAll('input[name="preferredMode"]:checked')).map(cb => cb.value);

            const newPrefs = {
                roleKeywords: document.getElementById('roleKeywords').value,
                preferredLocations: selectedLocations,
                preferredMode: selectedModes,
                experienceLevel: document.getElementById('experienceLevel').value,
                minMatchScore: parseInt(document.getElementById('minMatchScore').value),
                skills: document.getElementById('skills').value
            };

            preferences = newPrefs;
            localStorage.setItem('jobTrackerPreferences', JSON.stringify(newPrefs));

            const status = document.getElementById('save-status');
            status.textContent = 'Preferences saved successfully.';
            status.style.color = 'var(--color-success)';
            setTimeout(() => status.textContent = '', 3000);
        });
    }
};

// --- GLOBAL ACTIONS ---
window.viewJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = document.getElementById('job-modal');
    const body = document.getElementById('modal-body');
    const score = calculateMatchScore(job);
    const scoreClass = getScoreColor(score);

    body.innerHTML = `
        <div class="modal-header-nav">
            <div class="job-source-badge">${job.source}</div>
            ${preferences ? `<div class="match-badge ${scoreClass}">${score}% Compatibility Score</div>` : ''}
        </div>
        <h2 class="modal-headline serif">${job.title}</h2>
        <div class="modal-subheadline">${job.company} &bull; ${job.location} &bull; ${job.salaryRange}</div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Description</h3>
            <p>${job.description}</p>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Skills Required</h3>
            <div class="skill-tags">
                ${job.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
        </div>
        
        <div class="modal-actions">
            <a href="${job.applyUrl}" target="_blank" class="btn btn-primary" style="flex: 2;">Apply Externally</a>
            <button class="btn btn-secondary" style="flex: 1;" onclick="window.toggleSave('${job.id}')">
                ${savedJobs.includes(job.id) ? 'Remove' : 'Save opportunity'}
            </button>
        </div>
    `;

    modal.style.display = 'flex';
};

window.toggleSave = (jobId) => {
    if (savedJobs.includes(jobId)) {
        savedJobs = savedJobs.filter(id => id !== jobId);
    } else {
        savedJobs.push(jobId);
    }
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
    router();

    // Refresh modal if open
    const modal = document.getElementById('job-modal');
    if (modal.style.display === 'flex') {
        window.viewJob(jobId);
    }
};

const navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const path = window.location.pathname;
    const route = routes[path] || {
        render: () => `
            <section class="error-page container">
                <h1 class="headline serif">Page Not Found</h1>
                <p class="subtext">The path you followed does not exist in the current application shell.</p>
                <div style="margin-top: 40px;">
                    <a href="/" class="btn btn-primary" data-link>Return to Discovery</a>
                </div>
            </section>
        `
    };

    const container = document.getElementById('page-content');
    container.innerHTML = route.render();

    if (route.afterRender) route.afterRender();

    updateActiveLinks();
    window.scrollTo(0, 0);
};

const updateActiveLinks = () => {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]') || e.target.closest('[data-link]')) {
            const link = e.target.matches('[data-link]') ? e.target : e.target.closest('[data-link]');
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
            document.getElementById('top-nav')?.classList.remove('active');
            document.getElementById('menu-toggle')?.classList.remove('active');
        }
    });

    const menuToggle = document.getElementById('menu-toggle');
    const topNav = document.getElementById('top-nav');
    if (menuToggle && topNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            topNav.classList.toggle('active');
        });
    }

    const modal = document.getElementById('job-modal');
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    window.addEventListener('popstate', router);
    router();
});
