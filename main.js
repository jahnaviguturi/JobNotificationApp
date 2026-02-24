/**
 * Job Notification Tracker - SPA Router & Job Logic
 */
import { jobs } from './data.js';

let savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
let userPrefs = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || null;

const calculateMatchScore = (job) => {
    if (!userPrefs) return 0;

    let score = 0;
    const roleKeywords = userPrefs.roleKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    const userSkills = userPrefs.skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);

    // 1. Role Keywords in title (+25)
    if (roleKeywords.some(k => job.title.toLowerCase().includes(k))) score += 25;

    // 2. Role Keywords in description (+15)
    if (roleKeywords.some(k => job.description.toLowerCase().includes(k))) score += 15;

    // 3. Location match (+15)
    if (userPrefs.preferredLocations.includes(job.location)) score += 15;

    // 4. Mode match (+10)
    if (userPrefs.preferredMode.includes(job.mode)) score += 10;

    // 5. Experience match (+10)
    if (job.experience === userPrefs.experienceLevel) score += 10;

    // 6. Skills overlap (+15)
    if (userSkills.some(s => job.skills.some(js => js.toLowerCase().includes(s)))) score += 15;

    // 7. Recent posting (+5)
    if (job.postedDaysAgo <= 2) score += 5;

    // 8. Source LinkedIn (+5)
    if (job.source === 'LinkedIn') score += 5;

    return Math.min(100, score);
};

const getScoreColor = (score) => {
    if (score >= 80) return 'score-high'; // Green
    if (score >= 60) return 'score-medium'; // Amber
    if (score >= 40) return 'score-low'; // Neutral
    return 'score-none'; // Grey
};


const routes = {
    '/': {
        render: () => `
            <section class="landing-hero container">
                <h1 class="hero-headline">Stop Missing The Right Jobs.</h1>
                <p class="hero-subtext">Precision-matched job discovery delivered daily at 9AM.</p>
                <div class="hero-actions">
                    <a href="/settings" class="btn btn-primary" data-link>Start Tracking</a>
                </div>
            </section>
        `
    },
    '/dashboard': {
        render: () => {
            return `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Dashboard</h1>
                    <p class="subtext">Your career overview and active tracking status.</p>
                </div>
            </section>

            ${!userPrefs ? `
            <div class="container" style="margin-bottom: 24px;">
                <div class="banner">
                    <p>Set your preferences to activate intelligent matching.</p>
                    <a href="/settings" class="btn btn-secondary btn-sm" data-link>Open Settings</a>
                </div>
            </div>
            ` : ''}

            <div class="filter-bar">
                <div class="container">
                    <div class="filter-grid">
                        <input type="text" id="filter-search" placeholder="Search roles or companies..." class="input-base search-input">
                        <select id="filter-location" class="input-base filter-group">
                            <option value="">All Locations</option>
                            <option value="Bengaluru">Bengaluru</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Hyderabad">Hyderabad</option>
                            <option value="Chennai">Chennai</option>
                            <option value="Pune">Pune</option>
                            <option value="Gurugram">Gurugram</option>
                            <option value="Noida">Noida</option>
                            <option value="Remote">Remote</option>
                        </select>
                        <select id="filter-mode" class="input-base filter-group">
                            <option value="">All Modes</option>
                            <option value="Remote">Remote</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Onsite">Onsite</option>
                        </select>
                        <select id="filter-exp" class="input-base filter-group">
                            <option value="">All Experience</option>
                            <option value="Fresher">Fresher</option>
                            <option value="0-1">0-1 Year</option>
                            <option value="1-3">1-3 Years</option>
                            <option value="3-5">3-5 Years</option>
                        </select>
                        <select id="filter-source" class="input-base filter-group">
                            <option value="">All Sources</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Naukri">Naukri</option>
                            <option value="Indeed">Indeed</option>
                        </select>
                        <select id="filter-sort" class="input-base filter-group">
                            <option value="latest">Sort: Latest</option>
                            <option value="score">Sort: Match Score</option>
                            <option value="salary">Sort: Salary</option>
                        </select>
                        
                        <div class="toggle-group filter-group" style="min-width: 200px;">
                            <label class="toggle-switch">
                                <input type="checkbox" id="match-threshold-toggle">
                                <span class="slider"></span>
                            </label>
                            <span class="toggle-label">Show only jobs above my threshold</span>
                        </div>
                    </div>
                </div>
            </div>
            <main class="container">
                <div id="job-list" class="job-grid"></div>
            </main>
            `;

        },
        afterRender: () => {
            renderJobs(jobs);

            const search = document.getElementById('filter-search');
            const loc = document.getElementById('filter-location');
            const mode = document.getElementById('filter-mode');
            const exp = document.getElementById('filter-exp');
            const source = document.getElementById('filter-source');
            const sort = document.getElementById('filter-sort');
            const thresholdToggle = document.getElementById('match-threshold-toggle');

            const handleFilter = () => {
                const query = search.value.toLowerCase();
                const locVal = loc.value;
                const modeVal = mode.value;
                const expVal = exp.value;
                const sourceVal = source.value;
                const sortVal = sort.value;
                const onlyMatches = thresholdToggle ? thresholdToggle.checked : false;

                let filtered = jobs.filter(job => {
                    const matchesSearch = job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query);
                    const matchesLoc = !locVal || job.location === locVal;
                    const matchesMode = !modeVal || job.mode === modeVal;
                    const matchesExp = !expVal || job.experience === expVal;
                    const matchesSource = !sourceVal || job.source === sourceVal;

                    const score = calculateMatchScore(job);
                    const matchesThreshold = !onlyMatches || (userPrefs && score >= userPrefs.minMatchScore);

                    return matchesSearch && matchesLoc && matchesMode && matchesExp && matchesSource && matchesThreshold;
                });

                // Sorting logic
                if (sortVal === 'latest') {
                    filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
                } else if (sortVal === 'score') {
                    filtered.sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));
                } else if (sortVal === 'salary') {
                    const extractSalary = (sh) => {
                        const match = sh.match(/(\d+)–(\d+) LPA/);
                        if (match) return parseInt(match[2]);
                        const intmatch = sh.match(/₹(\d+)k/);
                        if (intmatch) return parseInt(intmatch[1]) / 12;
                        return 0;
                    };
                    filtered.sort((a, b) => extractSalary(b.salaryRange) - extractSalary(a.salaryRange));
                }

                renderJobs(filtered);
            };

            [search, loc, mode, exp, source, sort, thresholdToggle].forEach(el => {
                if (el) el.addEventListener('change', handleFilter);
            });
            if (search) search.addEventListener('input', handleFilter);
        }
    },

    '/settings': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Settings</h1>
                    <p class="subtext">Refine your preferences to improve notification accuracy.</p>
                </div>
            </section>
            <main class="main-layout container">
                <div class="primary-workspace">
                    <div class="card">
                        <h2 class="card-title">Search Preferences</h2>
                        <div class="settings-form" id="settings-form">
                            <div class="form-group">
                                <label for="pref-role-keywords">Role Keywords (comma-separated)</label>
                                <input type="text" id="pref-role-keywords" placeholder="e.g. SDE, Frontend, React" class="input-base" value="${userPrefs?.roleKeywords || ''}">
                            </div>
                            <div class="form-group">
                                <label for="pref-locations">Preferred Locations (multiple select)</label>
                                <select id="pref-locations" class="input-base" multiple style="height: 120px; padding: 10px;">
                                    <option value="Bengaluru" ${userPrefs?.preferredLocations.includes('Bengaluru') ? 'selected' : ''}>Bengaluru</option>
                                    <option value="Mumbai" ${userPrefs?.preferredLocations.includes('Mumbai') ? 'selected' : ''}>Mumbai</option>
                                    <option value="Hyderabad" ${userPrefs?.preferredLocations.includes('Hyderabad') ? 'selected' : ''}>Hyderabad</option>
                                    <option value="Chennai" ${userPrefs?.preferredLocations.includes('Chennai') ? 'selected' : ''}>Chennai</option>
                                    <option value="Pune" ${userPrefs?.preferredLocations.includes('Pune') ? 'selected' : ''}>Pune</option>
                                    <option value="Gurugram" ${userPrefs?.preferredLocations.includes('Gurugram') ? 'selected' : ''}>Gurugram</option>
                                    <option value="Noida" ${userPrefs?.preferredLocations.includes('Noida') ? 'selected' : ''}>Noida</option>
                                    <option value="Remote" ${userPrefs?.preferredLocations.includes('Remote') ? 'selected' : ''}>Remote</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Preferred Mode</label>
                                <div class="checkbox-group" style="display: flex; gap: var(--space-3); margin-top: 8px;">
                                    <label><input type="checkbox" name="pref-mode" value="Remote" ${userPrefs?.preferredMode.includes('Remote') ? 'checked' : ''}> Remote</label>
                                    <label><input type="checkbox" name="pref-mode" value="Hybrid" ${userPrefs?.preferredMode.includes('Hybrid') ? 'checked' : ''}> Hybrid</label>
                                    <label><input type="checkbox" name="pref-mode" value="Onsite" ${userPrefs?.preferredMode.includes('Onsite') ? 'checked' : ''}> Onsite</label>
                                </div>
                            </div>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="pref-exp-level">Experience Level</label>
                                    <select id="pref-exp-level" class="input-base">
                                        <option value="">Select level...</option>
                                        <option value="Fresher" ${userPrefs?.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                                        <option value="0-1" ${userPrefs?.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Year</option>
                                        <option value="1-3" ${userPrefs?.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                                        <option value="3-5" ${userPrefs?.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="pref-skills">Skills (comma-separated)</label>
                                    <input type="text" id="pref-skills" placeholder="e.g. React, Node, SQL" class="input-base" value="${userPrefs?.skills || ''}">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="pref-threshold">Minimum Match Score: <span id="threshold-display">${userPrefs?.minMatchScore || 40}</span>%</label>
                                <input type="range" id="pref-threshold" min="0" max="100" value="${userPrefs?.minMatchScore || 40}" class="slider-input">
                            </div>

                            <div style="margin-top: 24px;">
                                <button class="btn btn-primary" id="save-prefs-btn">Save Preferences</button>
                            </div>
                        </div>

                    </div>
                </div>
                <aside class="secondary-panel">
                    <div class="panel-section">
                        <h3 class="panel-title">Why this matters?</h3>
                        <p class="panel-text">Our matching algorithm uses these parameters to filter through thousands of global job postings daily.</p>
                    </div>
                </aside>
            </main>
        `
    },
    '/saved': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Saved Jobs</h1>
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
                    <h1 class="headline">Daily Digest</h1>
                    <p class="subtext">A curated summary of the best matches found in the last 24 hours.</p>
                </div>
            </section>
            <main class="container">
                <div class="empty-state">
                    <div class="empty-state-content">
                        <h2 class="card-title">The engine is warming up.</h2>
                        <p class="card-description">Your first daily summary will be generated once the data engine is active. Look forward to high-signal alerts every morning at 9AM.</p>
                    </div>
                </div>
            </main>
        `
    },
    '/proof': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Validation Proof</h1>
                    <p class="subtext">This section will be built in the next step.</p>
                </div>
            </section>
        `
    }
};

const renderJobs = (jobsToRender, containerId = 'job-list') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (jobsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-content">
                    <h2 class="card-title">${containerId === 'saved-job-list' ? 'Clear as a blank canvas.' : 'No jobs match your search.'}</h2>
                    <p class="card-description">${containerId === 'saved-job-list' ? 'Jobs you save during your search will appear here.' : 'Try adjusting your filters.'}</p>
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
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div class="job-source-badge">${job.source}</div>
                    ${userPrefs ? `<div class="match-badge ${scoreClass}">${score}% Match</div>` : ''}
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
                <button class="btn btn-secondary btn-sm" onclick="viewJob('${job.id}')">View</button>
                <button class="btn btn-secondary btn-sm btn-save ${savedJobs.includes(job.id) ? 'saved' : ''}" id="save-${job.id}" onclick="toggleSave('${job.id}')">
                    ${savedJobs.includes(job.id) ? 'Saved' : 'Save'}
                </button>
                <a href="${job.applyUrl}" target="_blank" class="btn btn-primary btn-sm" style="grid-column: span 2; margin-top: 8px;">Apply Now</a>
            </div>
        </article>
    `;
    }).join('');
};


// Filters are now handled within the dashboard route's afterRender for better element targeting



window.viewJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = document.getElementById('job-modal');
    const body = document.getElementById('modal-body');

    body.innerHTML = `
        <div class="modal-source">${job.source}</div>
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
        
        <div class="modal-actions" style="margin-top: 32px; display: flex; gap: 16px;">
            <a href="${job.applyUrl}" target="_blank" class="btn btn-primary" style="flex: 2;">Apply Externally</a>
            <button class="btn btn-secondary" style="flex: 1;" onclick="window.toggleSave('${job.id}')">
                ${savedJobs.includes(job.id) ? 'Remove' : 'Save'}
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

    const path = window.location.pathname;
    if (path === '/dashboard') {
        renderJobs(jobs); // Re-render to update badges
    } else if (path === '/saved') {
        const filteredSaved = jobs.filter(j => savedJobs.includes(j.id));
        renderJobs(filteredSaved, 'saved-job-list');
    }

    // Close modal if toggle happened inside it
    if (document.getElementById('job-modal').style.display === 'flex') {
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
                <h1 class="headline">Page Not Found</h1>
                <p class="subtext">The page you are looking for does not exist.</p>
                <div style="margin-top: 40px;">
                    <a href="/" class="btn btn-primary" data-link>Return Home</a>
                </div>
            </section>
        `
    };

    const container = document.getElementById('page-content');
    container.innerHTML = route.render ? route.render() : '';

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
            document.getElementById('top-nav').classList.remove('active');
            document.getElementById('menu-toggle').classList.remove('active');
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
    document.getElementById('modal-close').onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    window.addEventListener('popstate', router);
    router();
});
