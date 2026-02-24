/**
 * Job Notification Tracker - SPA Router, Scoring & Preferences
 */
import { jobs } from './data.js';

let savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
let preferences = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || null;
let onlyMatchesThreshold = false;

// ------------------------------------------
// MATCH SCORE ENGINE
// ------------------------------------------
const calculateMatchScore = (job) => {
    if (!preferences) return 0;

    let score = 0;
    const user = preferences;

    // 1. Role Keywords (+25 Title, +15 Description)
    if (user.roleKeywords) {
        const keywords = user.roleKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
        const titleMatch = keywords.some(k => job.title.toLowerCase().includes(k));
        const descMatch = keywords.some(k => job.description.toLowerCase().includes(k));
        if (titleMatch) score += 25;
        if (descMatch) score += 15;
    }

    // 2. Preferred Locations (+15)
    if (user.preferredLocations && user.preferredLocations.length > 0) {
        if (user.preferredLocations.includes(job.location)) {
            score += 15;
        }
    }

    // 3. Preferred Mode (+10)
    if (user.preferredMode && user.preferredMode.length > 0) {
        if (user.preferredMode.includes(job.mode)) {
            score += 10;
        }
    }

    // 4. Experience Level (+10)
    if (user.experienceLevel && job.experience === user.experienceLevel) {
        score += 10;
    }

    // 5. Skills Overlap (+15)
    if (user.skills && job.skills && job.skills.length > 0) {
        const userSkills = user.skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        const hasOverlap = job.skills.some(s => userSkills.includes(s.toLowerCase()));
        if (hasOverlap) score += 15;
    }

    // 6. Freshness (+5)
    if (job.postedDaysAgo <= 2) {
        score += 5;
    }

    // 7. Source (+5)
    if (job.source === 'LinkedIn') {
        score += 5;
    }

    return Math.min(score, 100);
};

const getScoreColorClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-mid';
    if (score >= 40) return 'score-low';
    return 'score-none';
};

// Salary extraction for sorting
const extractSalary = (salaryStr) => {
    // 10–18 LPA -> 10
    // ₹25k–₹40k/month Internship -> 25 * 0.12 (normalized to LPA)
    const normalized = salaryStr.replace(/₹/g, '').toLowerCase();
    const numbers = normalized.match(/[\d.]+/g);
    if (!numbers) return 0;

    let value = parseFloat(numbers[0]);
    if (normalized.includes('month') || normalized.includes('/mo')) {
        return value * 0.12; // Monthly to LPA
    }
    return value;
};

// ------------------------------------------
// ROUTES
// ------------------------------------------

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
                <div class="preference-banner">
                    <span class="banner-text">Set your preferences to activate intelligent matching.</span>
                    <a href="/settings" class="btn btn-secondary btn-sm" data-link>Open Settings</a>
                </div>
            ` : '';

            return `
            <section class="context-header">
                <div class="container">
                    ${banner}
                    <h1 class="headline serif">Dashboard</h1>
                    <p class="subtext">Your career overview and active tracking status.</p>
                </div>
            </section>
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
                        <select id="filter-sort" class="input-base filter-group">
                            <option value="latest">Latest</option>
                            <option value="score">Match Score</option>
                            <option value="salary">Highest Salary</option>
                        </select>
                        <div class="toggle-group">
                            <span>Only High Matches</span>
                            <label class="switch">
                                <input type="checkbox" id="threshold-toggle" ${onlyMatchesThreshold ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
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
            renderDashboardJobs();
            setupDashboardEvents();
        }
    },
    // ... next part will be added in another write if needed, but I'll write the whole file here
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
                        <h2 class="card-title">Search Preferences</h2>
                        <form id="preferences-form" class="settings-form">
                            <div class="form-group">
                                <label for="roleKeywords">Role Keywords (comma-separated)</label>
                                <input type="text" name="roleKeywords" value="${p.roleKeywords || ''}" placeholder="e.g. SDE, Frontend, Intern" class="input-base">
                            </div>
                            <div class="form-group">
                                <label for="preferredLocations">Preferred Locations (multiple)</label>
                                <select name="preferredLocations" class="input-base" multiple style="height: 120px;">
                                    <option value="Bengaluru" ${p.preferredLocations?.includes('Bengaluru') ? 'selected' : ''}>Bengaluru</option>
                                    <option value="Mumbai" ${p.preferredLocations?.includes('Mumbai') ? 'selected' : ''}>Mumbai</option>
                                    <option value="Hyderabad" ${p.preferredLocations?.includes('Hyderabad') ? 'selected' : ''}>Hyderabad</option>
                                    <option value="Chennai" ${p.preferredLocations?.includes('Chennai') ? 'selected' : ''}>Chennai</option>
                                    <option value="Pune" ${p.preferredLocations?.includes('Pune') ? 'selected' : ''}>Pune</option>
                                    <option value="Gurugram" ${p.preferredLocations?.includes('Gurugram') ? 'selected' : ''}>Gurugram</option>
                                    <option value="Remote" ${p.preferredLocations?.includes('Remote') ? 'selected' : ''}>Remote</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Preferred Mode</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-item"><input type="checkbox" name="preferredMode" value="Remote" ${p.preferredMode?.includes('Remote') ? 'checked' : ''}> Remote</label>
                                    <label class="checkbox-item"><input type="checkbox" name="preferredMode" value="Hybrid" ${p.preferredMode?.includes('Hybrid') ? 'checked' : ''}> Hybrid</label>
                                    <label class="checkbox-item"><input type="checkbox" name="preferredMode" value="Onsite" ${p.preferredMode?.includes('Onsite') ? 'checked' : ''}> Onsite</label>
                                </div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="experienceLevel">Experience Level</label>
                                    <select name="experienceLevel" class="input-base">
                                        <option value="Fresher" ${p.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                                        <option value="0-1" ${p.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Year</option>
                                        <option value="1-3" ${p.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                                        <option value="3-5" ${p.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="skills">Skills (comma-separated)</label>
                                    <input type="text" name="skills" value="${p.skills || ''}" placeholder="e.g. React, Python, Java" class="input-base">
                                </div>
                            </div>
                            <div class="form-group range-wrap">
                                <label for="minMatchScore">Minimum Match Score Threshold: <span class="range-value" id="score-val">${p.minMatchScore || 40}</span>%</label>
                                <input type="range" name="minMatchScore" min="0" max="100" value="${p.minMatchScore || 40}" class="range-input" id="score-range">
                            </div>
                            <div style="margin-top: 32px;">
                                <button type="submit" class="btn btn-primary">Save Preferences</button>
                            </div>
                        </form>
                    </div>
                </div>
                <aside class="secondary-panel">
                    <div class="panel-section">
                        <h3 class="panel-title serif">Match Logic</h3>
                        <p class="panel-text">Title Match: +25%<br>Location Match: +15%<br>Skills Overlap: +15%<br>Experience Match: +10%</p>
                    </div>
                </aside>
            </main>
            `;
        },
        afterRender: () => {
            const form = document.getElementById('preferences-form');
            const range = document.getElementById('score-range');
            const val = document.getElementById('score-val');

            range.oninput = () => val.textContent = range.value;

            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const modes = formData.getAll('preferredMode');
                const locations = formData.getAll('preferredLocations');

                preferences = {
                    roleKeywords: formData.get('roleKeywords'),
                    preferredLocations: locations,
                    preferredMode: modes,
                    experienceLevel: formData.get('experienceLevel'),
                    skills: formData.get('skills'),
                    minMatchScore: parseInt(formData.get('minMatchScore'))
                };

                localStorage.setItem('jobTrackerPreferences', JSON.stringify(preferences));
                alert('Preferences saved successfully.');
                navigateTo('/dashboard');
            };
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
            const savedData = jobs.filter(j => savedJobs.includes(j.id));
            renderJobList(savedData, 'saved-job-list');
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
                    <p class="subtext">Artifacts and system validation logs.</p>
                </div>
            </section>
        `
    }
};

const renderDashboardJobs = () => {
    const search = document.getElementById('filter-search').value.toLowerCase();
    const loc = document.getElementById('filter-location').value;
    const mode = document.getElementById('filter-mode').value;
    const sort = document.getElementById('filter-sort').value;

    let filtered = jobs.map(job => ({
        ...job,
        matchScore: calculateMatchScore(job)
    }));

    // Apply basic filters
    filtered = filtered.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(search) || job.company.toLowerCase().includes(search);
        const matchesLoc = !loc || job.location === loc;
        const matchesMode = !mode || job.mode === mode;
        return matchesSearch && matchesLoc && matchesMode;
    });

    // Apply Match Threshold
    if (onlyMatchesThreshold && preferences) {
        filtered = filtered.filter(job => job.matchScore >= (preferences.minMatchScore || 40));
    }

    // Sort
    if (sort === 'score') {
        filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sort === 'salary') {
        filtered.sort((a, b) => extractSalary(b.salaryRange) - extractSalary(a.salaryRange));
    } else {
        filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    }

    renderJobList(filtered);
};

const renderJobList = (jobsToRender, containerId = 'job-list') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (jobsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-content">
                    <img src="https://via.placeholder.com/60/ccc/fff?text=?" style="opacity: 0.2; margin-bottom: 24px;">
                    <h2 class="card-title serif">No roles match your criteria.</h2>
                    <p class="card-description">Adjust filters or lower your matching threshold in settings.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = jobsToRender.map(job => {
        const score = job.matchScore || calculateMatchScore(job);
        const colorClass = getScoreColorClass(score);
        const hasScore = preferences !== null;

        return `
        <article class="job-card">
            ${hasScore ? `<div class="match-score-badge ${colorClass}">${score}% Match</div>` : ''}
            <div class="job-card-header">
                <div class="job-source-badge">${job.source}</div>
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
                <button class="btn btn-secondary btn-sm btn-save ${savedJobs.includes(job.id) ? 'saved' : ''}" onclick="window.toggleSave('${job.id}')">
                    ${savedJobs.includes(job.id) ? 'Saved' : 'Save'}
                </button>
                <a href="${job.applyUrl}" target="_blank" class="btn btn-primary btn-sm" style="grid-column: span 2; margin-top: 8px;">Apply Now</a>
            </div>
        </article>
        `;
    }).join('');
};

const setupDashboardEvents = () => {
    const inputs = ['filter-search', 'filter-location', 'filter-mode', 'filter-sort'];
    inputs.forEach(id => {
        document.getElementById(id).oninput = renderDashboardJobs;
    });

    const toggle = document.getElementById('threshold-toggle');
    toggle.onchange = () => {
        onlyMatchesThreshold = toggle.checked;
        renderDashboardJobs();
    };
};

window.viewJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const score = calculateMatchScore(job);
    const colorClass = getScoreColorClass(score);

    const modal = document.getElementById('job-modal');
    const body = document.getElementById('modal-body');

    body.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="job-source-badge">${job.source}</div>
            ${preferences ? `<div class="badge ${colorClass}" style="color: white; padding: 4px 12px; border-radius: 20px;">${score}% Match Score</div>` : ''}
        </div>
        <h2 class="modal-headline serif" style="margin-top: 16px;">${job.title}</h2>
        <div class="modal-subheadline">${job.company} &bull; ${job.location} &bull; ${job.salaryRange}</div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Description</h3>
            <p>${job.description}</p>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">Required Capabilities</h3>
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
    router(); // Re-render current page
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
        if (link.getAttribute('href') === path) link.classList.add('active');
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
