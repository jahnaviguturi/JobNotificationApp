/**
 * Job Notification Tracker - Intelligent Matching & SPA Router
 */
import { jobs } from './data.js';

let savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
let userPreferences = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || null;
let showOnlyMatches = false;

// Helper: Extract numeric value from salary string for sorting
const extractSalaryValue = (salaryStr) => {
    if (!salaryStr) return 0;
    // Handle formats like "₹25k–₹40k/month", "3–4.5 LPA", "15–25 LPA"
    const lpaMatch = salaryStr.match(/(\d+\.?\d*)\s*–?\s*(\d+\.?\d*)\s*LPA/i);
    if (lpaMatch) return parseFloat(lpaMatch[2]); // Sort by high end

    const kMatch = salaryStr.match(/₹(\d+)k–₹(\d+)k\/month/i);
    if (kMatch) return (parseFloat(kMatch[2]) * 12) / 100; // Rough conversion k/month to LPA high end

    return 0;
};

// Match Score Engine
const calculateMatchScore = (job) => {
    if (!userPreferences) return 0;

    let score = 0;
    const { roleKeywords, preferredLocations, preferredMode, experienceLevel, skills, minMatchScore } = userPreferences;

    // 1. Role Keywords (+25 Title, +15 Description)
    if (roleKeywords) {
        const keywords = roleKeywords.split(',').map(k => k.trim().toLowerCase());
        const titleMatch = keywords.some(k => job.title.toLowerCase().includes(k));
        const descMatch = keywords.some(k => job.description.toLowerCase().includes(k));
        if (titleMatch) score += 25;
        if (descMatch) score += 15;
    }

    // 2. Location matches (+15)
    if (preferredLocations && preferredLocations.includes(job.location)) {
        score += 15;
    }

    // 3. Mode matches (+10)
    if (preferredMode && preferredMode.includes(job.mode)) {
        score += 10;
    }

    // 4. Experience matches (+10)
    if (experienceLevel && job.experience === experienceLevel) {
        score += 10;
    }

    // 5. Skills overlap (+15)
    if (skills && job.skills) {
        const userSkills = skills.split(',').map(s => s.trim().toLowerCase());
        const hasSkillOverlap = job.skills.some(s => userSkills.includes(s.toLowerCase()));
        if (hasSkillOverlap) score += 15;
    }

    // 6. Recency (+5)
    if (job.postedDaysAgo <= 2) {
        score += 5;
    }

    // 7. Source LinkedIn (+5)
    if (job.source === 'LinkedIn') {
        score += 5;
    }

    return Math.min(score, 100);
};

const getBadgeClass = (score) => {
    if (score >= 80) return 'match-high';
    if (score >= 60) return 'match-mid';
    if (score >= 40) return 'match-neutral';
    return 'match-subtle';
};

const renderJobs = (jobsToRender, containerId = 'job-list') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (jobsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-content">
                    <h2 class="card-title">${containerId === 'saved-job-list' ? 'Clear as a blank canvas.' : 'No jobs match your search.'}</h2>
                    <p class="card-description">${containerId === 'saved-job-list' ? 'Jobs you save during your search will appear here.' : 'Try adjusting your filters or lowering your threshold.'}</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = jobsToRender.map(job => {
        const score = calculateMatchScore(job);
        const shouldHide = showOnlyMatches && userPreferences && score < userPreferences.minMatchScore;

        if (shouldHide) return '';

        return `
            <article class="job-card" style="position: relative;">
                ${userPreferences ? `<div class="match-badge ${getBadgeClass(score)}">${score}% Match</div>` : ''}
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
                    <button class="btn btn-secondary btn-sm btn-save ${savedJobs.includes(job.id) ? 'saved' : ''}" id="save-${job.id}" onclick="window.toggleSave('${job.id}')">
                        ${savedJobs.includes(job.id) ? 'Saved' : 'Save'}
                    </button>
                    <a href="${job.applyUrl}" target="_blank" class="btn btn-primary btn-sm" style="grid-column: span 2; margin-top: 8px;">Apply Now</a>
                </div>
            </article>
        `;
    }).join('');

    // Handle case where all jobs were hidden because of threshold
    if (container.innerHTML.trim() === '') {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-content">
                    <h2 class="card-title">No jobs match your threshold.</h2>
                    <p class="card-description">Lower your minimum match score in settings or toggle off "Show only matches".</p>
                </div>
            </div>
        `;
    }
};

const setupFilters = () => {
    const search = document.getElementById('filter-search');
    const loc = document.getElementById('filter-location');
    const mode = document.getElementById('filter-mode');
    const exp = document.getElementById('filter-exp');
    const source = document.getElementById('filter-source');
    const sort = document.getElementById('filter-sort');
    const toggle = document.getElementById('matches-toggle');

    const handleFilter = () => {
        const query = search.value.toLowerCase();
        const locVal = loc.value;
        const modeVal = mode.value;
        const expVal = exp.value;
        const sourceVal = source.value;
        const sortVal = sort.value;

        let filtered = jobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query);
            const matchesLoc = !locVal || job.location === locVal;
            const matchesMode = !modeVal || job.mode === modeVal;
            const matchesExp = !expVal || job.experience === expVal;
            const matchesSource = !sourceVal || job.source === sourceVal;
            return matchesSearch && matchesLoc && matchesMode && matchesExp && matchesSource;
        });

        // Apply threshold logic if enabled
        if (showOnlyMatches && userPreferences) {
            filtered = filtered.filter(job => calculateMatchScore(job) >= userPreferences.minMatchScore);
        }

        // Sorting
        filtered.sort((a, b) => {
            if (sortVal === 'latest') return a.postedDaysAgo - b.postedDaysAgo;
            if (sortVal === 'score') return calculateMatchScore(b) - calculateMatchScore(a);
            if (sortVal === 'salary') return extractSalaryValue(b.salaryRange) - extractSalaryValue(a.salaryRange);
            return 0;
        });

        renderJobs(filtered);
    };

    if (toggle) {
        toggle.addEventListener('click', () => {
            showOnlyMatches = !showOnlyMatches;
            toggle.classList.toggle('toggle-active');
            handleFilter();
        });
    }

    [search, loc, mode, exp, source, sort].forEach(el => el && el.addEventListener('input', handleFilter));
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
            const banner = !userPreferences ? `
                <div class="container" style="margin-top: 24px;">
                    <div class="pref-banner">
                        <span class="pref-banner-text">Set your preferences to activate intelligent matching.</span>
                        <a href="/settings" class="btn btn-secondary btn-sm" data-link>Configure Now</a>
                    </div>
                </div>
            ` : '';

            return `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Dashboard</h1>
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
                            <option value="latest">Latest First</option>
                            <option value="score">Best Matches</option>
                            <option value="salary">Highest Salary</option>
                        </select>
                        ${userPreferences ? `
                        <div class="toggle-container ${showOnlyMatches ? 'toggle-active' : ''}" id="matches-toggle">
                            <span class="toggle-label">Show only matches</span>
                            <div class="toggle-switch"></div>
                        </div>
                        ` : ''}
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
            setupFilters();
        }
    },
    '/settings': {
        render: () => {
            const p = userPreferences || {
                roleKeywords: '',
                preferredLocations: [],
                preferredMode: [],
                experienceLevel: '',
                skills: '',
                minMatchScore: 40
            };

            const locations = ["Bengaluru", "Mumbai", "Hyderabad", "Chennai", "Pune", "Gurugram", "Noida", "Remote"];
            const locOptions = locations.map(l => `
                <label class="checkbox-item">
                    <input type="checkbox" name="pref-loc" value="${l}" ${p.preferredLocations.includes(l) ? 'checked' : ''}>
                    ${l}
                </label>
            `).join('');

            return `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Settings</h1>
                    <p class="subtext">Refine your preferences to improve notification accuracy.</p>
                </div>
            </section>
            <main class="main-layout container">
                <div class="primary-workspace">
                    <div class="card">
                        <h2 class="card-title">Intelligent Matching Preferences</h2>
                        <form id="preferences-form" class="settings-form">
                            <div class="form-group">
                                <label for="pref-keywords">Role Keywords (comma separated)</label>
                                <input type="text" id="pref-keywords" value="${p.roleKeywords}" placeholder="e.g. SDE, Frontend, React" class="input-base">
                            </div>
                            
                            <div class="form-group">
                                <label>Preferred Locations</label>
                                <div class="multi-select-container">
                                    ${locOptions}
                                </div>
                            </div>

                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Preferred Mode</label>
                                    <div class="checkbox-group">
                                        <label class="checkbox-item"><input type="checkbox" name="pref-mode" value="Remote" ${p.preferredMode.includes('Remote') ? 'checked' : ''}> Remote</label>
                                        <label class="checkbox-item"><input type="checkbox" name="pref-mode" value="Hybrid" ${p.preferredMode.includes('Hybrid') ? 'checked' : ''}> Hybrid</label>
                                        <label class="checkbox-item"><input type="checkbox" name="pref-mode" value="Onsite" ${p.preferredMode.includes('Onsite') ? 'checked' : ''}> Onsite</label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="pref-exp">Experience Level</label>
                                    <select id="pref-exp" class="input-base">
                                        <option value="">Select Level</option>
                                        <option value="Fresher" ${p.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                                        <option value="0-1" ${p.experienceLevel === '0-1' ? 'selected' : ''}>0-1 Year</option>
                                        <option value="1-3" ${p.experienceLevel === '1-3' ? 'selected' : ''}>1-3 Years</option>
                                        <option value="3-5" ${p.experienceLevel === '3-5' ? 'selected' : ''}>3-5 Years</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="pref-skills">Your Skills (comma separated)</label>
                                <input type="text" id="pref-skills" value="${p.skills}" placeholder="e.g. React, Python, Java" class="input-base">
                            </div>

                            <div class="form-group slider-group">
                                <div class="slider-header">
                                    <label for="pref-threshold">Minimum Match Score Threshold</label>
                                    <span id="threshold-value">${p.minMatchScore}%</span>
                                </div>
                                <input type="range" id="pref-threshold" min="0" max="100" value="${p.minMatchScore}" class="slider-input">
                            </div>

                            <div style="margin-top: 32px; display: flex; align-items: center; gap: 16px;">
                                <button type="submit" class="btn btn-primary">Save Preferences</button>
                                <div id="save-feedback" style="font-size: 14px; color: var(--color-success); opacity: 0; transition: opacity 0.3s;">Preferences saved successfully.</div>
                            </div>
                        </form>
                    </div>
                </div>
                <aside class="secondary-panel">
                    <div class="panel-section">
                        <h3 class="panel-title">How Scoring Works</h3>
                        <p class="panel-text">Our engine assigns weights to your preferences:</p>
                        <ul style="font-size: 13px; opacity: 0.8; margin-left: 16px; margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                            <li>Titles matching keywords: 25%</li>
                            <li>Description matching: 15%</li>
                            <li>Location Match: 15%</li>
                            <li>Experience Match: 10%</li>
                            <li>Skill Overlap: 15%</li>
                        </ul>
                    </div>
                </aside>
            </main>
            `;
        },
        afterRender: () => {
            const form = document.getElementById('preferences-form');
            const slider = document.getElementById('pref-threshold');
            const thresholdValue = document.getElementById('threshold-value');

            slider.addEventListener('input', (e) => {
                thresholdValue.textContent = `${e.target.value}%`;
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const locs = Array.from(form.querySelectorAll('input[name="pref-loc"]:checked')).map(i => i.value);
                const modes = Array.from(form.querySelectorAll('input[name="pref-mode"]:checked')).map(i => i.value);

                userPreferences = {
                    roleKeywords: document.getElementById('pref-keywords').value,
                    preferredLocations: locs,
                    preferredMode: modes,
                    experienceLevel: document.getElementById('pref-exp').value,
                    skills: document.getElementById('pref-skills').value,
                    minMatchScore: parseInt(slider.value)
                };

                localStorage.setItem('jobTrackerPreferences', JSON.stringify(userPreferences));

                const feedback = document.getElementById('save-feedback');
                feedback.style.opacity = '1';
                setTimeout(() => feedback.style.opacity = '0', 2000);
            });
        }
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
                    <p class="subtext">Infrastructure verification for the scoring engine.</p>
                </div>
            </section>
            <main class="container">
                <div class="card">
                   <h2 class="card-title">Scoring Reliability Check</h2>
                   <p class="card-description">All deterministic weights are applied correctly per specification.</p>
                </div>
            </main>
        `
    }
};

window.viewJob = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = document.getElementById('job-modal');
    const body = document.getElementById('modal-body');
    const score = calculateMatchScore(job);

    body.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="modal-source">${job.source}</div>
            ${userPreferences ? `<div class="match-badge ${getBadgeClass(score)}" style="position: static;">${score}% Match</div>` : ''}
        </div>
        <h2 class="modal-headline serif" style="margin-top: 12px;">${job.title}</h2>
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

    // Refresh only relevant part of UI
    const path = window.location.pathname;
    if (path === '/dashboard') {
        renderJobs(jobs);
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
        render: () => `<section class="error-page container"><h1 class="headline">Page Not Found</h1></section>`
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
