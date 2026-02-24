/**
 * Job Notification Tracker - SPA Router & Design System Logic
 */

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
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Dashboard</h1>
                    <p class="subtext">Your career overview and active tracking status.</p>
                </div>
            </section>
            <main class="main-layout container">
                <div class="primary-workspace">
                    <div class="empty-state">
                        <div class="empty-state-content">
                            <h2 class="card-title">No jobs yet.</h2>
                            <p class="card-description">In the next step, you will load a realistic dataset.</p>
                        </div>
                    </div>
                </div>
            </main>
        `
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
                        <div class="settings-form">
                            <div class="form-group">
                                <label for="role-keywords">Role Keywords</label>
                                <input type="text" id="role-keywords" placeholder="e.g. Senior Frontend Engineer, UI Designer" class="input-base">
                            </div>
                            <div class="form-group">
                                <label for="locations">Preferred Locations</label>
                                <input type="text" id="locations" placeholder="e.g. New York, London, Remote" class="input-base">
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="work-mode">Mode</label>
                                    <select id="work-mode" class="input-base">
                                        <option value="">Select mode...</option>
                                        <option value="remote">Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="onsite">Onsite</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="exp-level">Experience Level</label>
                                    <select id="exp-level" class="input-base">
                                        <option value="">Select level...</option>
                                        <option value="entry">Entry Level</option>
                                        <option value="mid">Mid Level</option>
                                        <option value="senior">Senior</option>
                                        <option value="lead">Lead / Principal</option>
                                    </select>
                                </div>
                            </div>
                            <div style="margin-top: 24px;">
                                <button class="btn btn-primary" disabled>Save Preferences</button>
                                <span class="muted-info">Logic implementation in next step.</span>
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
            <main class="main-layout container">
                <div class="primary-workspace">
                    <div class="empty-state">
                        <div class="empty-state-content">
                            <h2 class="card-title">Clear as a blank canvas.</h2>
                            <p class="card-description">Jobs you save during your search will appear here for quick access. This features premium tracking features.</p>
                        </div>
                    </div>
                </div>
            </main>
        `
    },
    '/digest': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Daily Digest</h1>
                    <p class="subtext">A curated summary of the best matches found in the last 24 hours.</p>
                </div>
            </section>
            <main class="main-layout container">
                <div class="primary-workspace">
                    <div class="empty-state">
                        <div class="empty-state-content">
                            <h2 class="card-title">The engine is warming up.</h2>
                            <p class="card-description">Your first daily summary will be generated once the data engine is active. Look forward to high-signal alerts every morning at 9AM.</p>
                        </div>
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
    // Intercept clicks for routing
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]') || e.target.closest('[data-link]')) {
            const link = e.target.matches('[data-link]') ? e.target : e.target.closest('[data-link]');
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
            // Close mobile menu if open
            document.getElementById('top-nav').classList.remove('active');
            document.getElementById('menu-toggle').classList.remove('active');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const topNav = document.getElementById('top-nav');

    if (menuToggle && topNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            topNav.classList.toggle('active');
        });
    }

    // Handle back/forward buttons
    window.addEventListener('popstate', router);

    // Initial route
    router();
});
