/**
 * Job Notification Tracker - SPA Router, Preferences & Match Engine
 */
import { jobs } from './data.js';

let savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
let userPrefs = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || null;
let showOnlyMatches = false;

const calculateMatchScore = (job) => {
    if (!userPrefs) return 0;

    let score = 0;
    const titleMatch = userPrefs.roleKeywords.some(kw => job.title.toLowerCase().includes(kw.toLowerCase()));
    const descMatch = userPrefs.roleKeywords.some(kw => job.description.toLowerCase().includes(kw.toLowerCase()));
    const locMatch = userPrefs.preferredLocations.includes(job.location);
    const modeMatch = userPrefs.preferredMode.includes(job.mode);
    const expMatch = job.experience === userPrefs.experienceLevel;
    const skillsMatch = job.skills.some(skill => userPrefs.skills.includes(skill.toLowerCase()));

    if (titleMatch) score += 25;
    if (descMatch) score += 15;
    if (locMatch) score += 15;
    if (modeMatch) score += 10;
    if (expMatch) score += 10;
    if (skillsMatch) score += 15;
    if (job.postedDaysAgo <= 2) score += 5;
    if (job.source === 'LinkedIn') score += 5;

    return Math.min(score, 100);
};

const getScoreClass = (score) => {
    if (score >= 80) return 'score-perfect';
    if (score >= 60) return 'score-high';
    if (score >= 40) return 'score-mid';
    return 'score-low';
};

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
            const banner = !userPrefs ? `
                <div class="info-banner container">
                    <span>Set your preferences to activate intelligent matching.</span>
                    <a href="/settings" class="btn btn-secondary btn-sm" data-link>Configure Now</a>
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
                            <option value="latest">Latest</option>
                            <option value="score">Match Score</option>
                            <option value="salary">Salary</option>
                        </select>
                        
                        <div class="toggle-container">
                            <label class="switch">
                                <input type="checkbox" id="match-toggle" ${showOnlyMatches ? 'checked' : ''}>
                                <span class="slider-toggle"></span>
                            </label>
                            <span>Only High Matches</span>
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
            handleFiltering();
            setupFilters();
        }
    },
    '/settings': {
        render: () => {
            const p = userPrefs || {
                roleKeywords: [],
                preferredLocations: [],
                preferredMode: [],
                experienceLevel: '',
                skills: [],
                minMatchScore: 40
            };

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
                        <h2 class="card-title serif">Search Preferences</h2>
                        <form id="preferences-form" class="settings-form">
                            <div class="form-group">
                                <label for="role-keywords">Role Keywords (comma separated)</label>
                                <input type="text" id="role-keywords" value="${p.roleKeywords.join(', ')}" placeholder="e.g. SDE, Frontend, React" class="input-base">
                            </div>
                            
                            <div class="form-group">
                                <label for="preferred-locations">Preferred Locations (multi-select)</label>
                                <select id="preferred-locations" class="input-base" multiple style="height: 100px;">
                                    <option value="Bengaluru" ${p.preferredLocations.includes('Bengaluru') ? 'selected' : ''}>Bengaluru</option>
                                    <option value="Mumbai" ${p.preferredLocations.includes('Mumbai') ? 'selected' : ''}>Mumbai</option>
                                    <option value="Hyderabad" ${p.preferredLocations.includes('Hyderabad') ? 'selected' : ''}>Hyderabad</option>
                                    <option value="Chennai" ${p.preferredLocations.includes('Chennai') ? 'selected' : ''}>Chennai</option>
                                    <option value="Pune" ${p.preferredLocations.includes('Pune') ? 'selected' : ''}>Pune</option>
                                    <option value="Gurugram" ${p.preferredLocations.includes('Gurugram') ? 'selected' : ''}>Gurugram</option>
                                    <option value="Remote" ${p.preferredLocations.includes('Remote') ? 'selected' : ''}>Remote</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Preferred Mode</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="mode" value="Remote" ${p.preferredMode.includes('Remote') ? 'checked' : ''}> Remote
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="mode" value="Hybrid" ${p.preferredMode.includes('Hybrid') ? 'checked' : ''}> Hybrid
                                    </label>
                                    <label class="checkbox-item">
                                        <input type="checkbox" name="mode" value="Onsite" ${p.preferredMode.includes('Onsite') ? 'checked' : ''}> Onsite
                                    </label>
                                </div>
                            </div>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="exp-level">Experience Level</label>
                                    <select id="exp-level" class="input-base">
                                        <option value="">Select level...</option>
                                        <option value="Fresher" ${p.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                                        <option value="0-1" ${p.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Year</option>
                                        <option value="1-3" ${p.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                                        <option value="3-5" ${p.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="user-skills">Skills (comma separated)</label>
                                    <input type="text" id="user-skills" value="${p.skills.join(', ')}" placeholder="e.g. React, Python, SQL" class="input-base">
                                </div>
                            </div>

                            <div class="slider-container">
                                <div class="slider-header">
                                    <label for="match-threshold">Minimum Match Score Threshold</label>
                                    <span id="threshold-val" style="font-weight: 700;">${p.minMatchScore}%</span>
                                </div>
                                <input type="range" id="match-threshold" min="0" max="100" value="${p.minMatchScore}" class="range-input">
                            </div>

                            <div style="margin-top: 40px;">
                                <button type="submit" class="btn btn-primary">Save Preferences</button>
                                <span id="save-status" class="muted-info" style="display: none; color: var(--color-success);">Preferences Saved.</span>
                            </div>
                        </form>
                    </div>
                </div>
                <aside class="secondary-panel">
                    <div class="panel-section">
                        <h3 class="panel-title serif">Matching Logic</h3>
                        <p class="panel-text">Our engine scores jobs out of 100 based on keyword alignment, location, mode, and technical skills overlap.</p>
                    </div>
                </aside>
            </main>
            `;
        },
        afterRender: () => {
            const form = document.getElementById('preferences-form');
            const threshold = document.getElementById('match-threshold');
            const thresholdVal = document.getElementById('threshold-val');

            threshold.addEventListener('input', (e) => {
                thresholdVal.textContent = e.target.value + '%';
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const modes = Array.from(form.querySelectorAll('input[name="mode"]:checked')).map(i => i.value);
                const locations = Array.from(document.getElementById('preferred-locations').selectedOptions).map(o => o.value);

                const prefs = {
                    roleKeywords: document.getElementById('role-keywords').value.split(',').map(s => s.trim()).filter(s => s !== ''),
                    preferredLocations: locations,
                    preferredMode: modes,
                    experienceLevel: document.getElementById('exp-level').value,
                    skills: document.getElementById('user-skills').value.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== ''),
                    minMatchScore: parseInt(threshold.value)
                };

                localStorage.setItem('jobTrackerPreferences', JSON.stringify(prefs));
                userPrefs = prefs;

                const status = document.getElementById('save-status');
                status.style.display = 'inline';
                setTimeout(() => status.style.display = 'none', 3000);
            });
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
                        <h2 class="card-title serif">The engine is warming up.</h2>
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
                    <h1 class="headline serif">Validation Proof</h1>
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
                    <h2 class="card-title serif">${containerId === 'saved-job-list' ? 'Clear as a blank canvas.' : 'No jobs match your search.'}</h2>
                    <p class="card-description">${containerId === 'saved-job-list' ? 'Jobs you save during your search will appear here.' : 'Adjust filters or lower your match threshold.'}</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = jobsToRender.map(job => {
        const score = calculateMatchScore(job);
        return `
        <article class="job-card">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div class="job-source-badge">${job.source}</div>
                    ${userPrefs ? `<div class="score-badge ${getScoreClass(score)}">${score}% Match</div>` : ''}
                </div>
                <h3 class="job-title serif">${job.title}</h3>
                <div class="job-company">${job.company}</div>
                <div class="job-meta">
                    <span class="meta-item">${job.location}</span>
                    <span class="meta-item">${job.mode}</span>
                    <span class="meta-item">${job.experience} Exp</span>
                </div>
            </div>
            <div style="margin-top: 16px;">
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
            </div>
        </article>
        `;
    }).join('');
};

const handleFiltering = () => {
    const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const locVal = document.getElementById('filter-location')?.value || '';
    const modeVal = document.getElementById('filter-mode')?.value || '';
    const expVal = document.getElementById('filter-exp')?.value || '';
    const sourceVal = document.getElementById('filter-source')?.value || '';
    const sortVal = document.getElementById('filter-sort')?.value || 'latest';
    const matchToggle = document.getElementById('match-toggle')?.checked || false;

    let filtered = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(search) || job.company.toLowerCase().includes(search);
        const matchesLoc = !locVal || job.location === locVal;
        const matchesMode = !modeVal || job.mode === modeVal;
        const matchesExp = !expVal || job.experience === expVal;
        const matchesSource = !sourceVal || job.source === sourceVal;

        let matchesThreshold = true;
        if (matchToggle && userPrefs) {
            matchesThreshold = calculateMatchScore(job) >= userPrefs.minMatchScore;
        }

        return matchesSearch && matchesLoc && matchesMode && matchesExp && matchesSource && matchesThreshold;
    });

    // Sorting logic
    if (sortVal === 'latest') {
        filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    } else if (sortVal === 'score') {
        filtered.sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));
    } else if (sortVal === 'salary') {
        const getSalaryValue = (str) => {
            const matches = str.match(/(\d+(\.\d+)?)/);
            return matches ? parseFloat(matches[1]) : 0;
        };
        filtered.sort((a, b) => getSalaryValue(b.salaryRange) - getSalaryValue(a.salaryRange));
    }

    renderJobs(filtered);
};

const setupFilters = () => {
    const inputs = ['filter-search', 'filter-location', 'filter-mode', 'filter-exp', 'filter-source', 'filter-sort', 'match-toggle'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', handleFiltering);
            if (id === 'match-toggle') {
                el.addEventListener('change', (e) => {
                    showOnlyMatches = e.target.checked;
                    handleFiltering();
                });
            }
        }
    });
};

window.viewJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = document.getElementById('job-modal');
    const body = document.getElementById('modal-body');
    const score = calculateMatchScore(job);

    body.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="modal-source">${job.source}</div>
            ${userPrefs ? `<div class="score-badge ${getScoreClass(score)}">${score}% Match</div>` : ''}
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
        handleFiltering();
    } else if (path === '/saved') {
        const filteredSaved = jobs.filter(j => savedJobs.includes(j.id));
        renderJobs(filteredSaved, 'saved-job-list');
    }

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
                <h1 class="headline serif">Page Not Found</h1>
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
