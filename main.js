/**
 * Job Notification Tracker - SPA Router & Application Logic
 */

const routes = {
    '/': {
        render: () => `
            <section class="hero container">
                <h1 class="headline">Stop Missing The Right Jobs.</h1>
                <p class="subtext">Precision-matched job discovery delivered daily at 9AM.</p>
                <div class="cta-area">
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
                    <p class="subtext">Your personalized job matches and tracking overview.</p>
                </div>
            </section>
            <main class="container">
                <div class="empty-state">
                    <h2 class="empty-state-title">No jobs yet.</h2>
                    <p class="empty-state-text">In the next step, you will load a realistic dataset to see matches here.</p>
                </div>
            </main>
        `
    },
    '/settings': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Settings</h1>
                    <p class="subtext">Configure your search preferences and notification parameters.</p>
                </div>
            </section>
            <main class="container">
                <div class="card">
                    <h2 class="card-title">Preference Profile</h2>
                    <div class="settings-grid">
                        <div class="form-group form-group-full">
                            <label for="role-keywords">Role Keywords</label>
                            <input type="text" id="role-keywords" class="input-base" placeholder="e.g. Senior Frontend Engineer, Product Designer">
                        </div>
                        <div class="form-group">
                            <label for="location">Preferred Locations</label>
                            <input type="text" id="location" class="input-base" placeholder="e.g. San Francisco, Remote">
                        </div>
                        <div class="form-group">
                            <label for="work-mode">Mode</label>
                            <select id="work-mode" class="input-base">
                                <option value="remote">Remote</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="onsite">Onsite</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="experience">Experience Level</label>
                            <select id="experience" class="input-base">
                                <option value="entry">Entry Level</option>
                                <option value="mid">Mid Level</option>
                                <option value="senior">Senior Level</option>
                                <option value="lead">Lead / Principal</option>
                            </select>
                        </div>
                    </div>
                </div>
            </main>
        `
    },
    '/saved': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Saved Jobs</h1>
                    <p class="subtext">Your collection of high-interest opportunities.</p>
                </div>
            </section>
            <main class="container">
                <div class="empty-state">
                    <h2 class="empty-state-title">Your collection is empty.</h2>
                    <p class="empty-state-text">Jobs you save from the dashboard will appear here for later review.</p>
                </div>
            </main>
        `
    },
    '/digest': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Daily Digest</h1>
                    <p class="subtext">A curated summary of the best role matches.</p>
                </div>
            </section>
            <main class="container">
                <div class="empty-state">
                    <h2 class="empty-state-title">No digest ready.</h2>
                    <p class="empty-state-text">The daily summary feature is scheduled for implementation. You'll receive your first digest once matching logic is active.</p>
                </div>
            </main>
        `
    },
    '/proof': {
        render: () => `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">Validation Proof</h1>
                    <p class="subtext">This section will be used for artifact collection and verification.</p>
                </div>
            </section>
            <main class="container">
                <div class="card">
                    <h2 class="card-title">Artifact Repository</h2>
                    <p class="card-description">Development logs and test results will be presented here in future iterations.</p>
                </div>
            </main>
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

    document.getElementById('page-content').innerHTML = route.render();
    updateActiveLinks();
};

const updateActiveLinks = () => {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });

    // Handle home link highlighting if needed
    const logoLink = document.querySelector('.app-logo-link');
    if (logoLink) {
        if (path === '/') {
            logoLink.style.opacity = '1';
        } else {
            logoLink.style.opacity = '1';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Intercept clicks for routing
    document.body.addEventListener('click', e => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
            // Close mobile menu if open
            const topNav = document.getElementById('top-nav');
            const menuToggle = document.getElementById('menu-toggle');
            if (topNav && menuToggle) {
                topNav.classList.remove('active');
                menuToggle.classList.remove('active');
            }
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
