/**
 * Job Notification App - SPA Router & Design System Logic
 */

const routes = {
    '/': {
        title: 'Design System Foundation',
        subtext: 'Establishing the core principles and visual language for a calm, intentional workspace.'
    },
    '/dashboard': {
        title: 'Dashboard',
        subtext: 'This section will be built in the next step.'
    },
    '/saved': {
        title: 'Saved Jobs',
        subtext: 'This section will be built in the next step.'
    },
    '/digest': {
        title: 'Job Digest',
        subtext: 'This section will be built in the next step.'
    },
    '/settings': {
        title: 'Settings',
        subtext: 'This section will be built in the next step.'
    },
    '/proof': {
        title: 'Validation Proof',
        subtext: 'This section will be built in the next step.'
    }
};

const navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const path = window.location.pathname;
    const route = routes[path] || {
        title: 'Page Not Found',
        subtext: 'The page you are looking for does not exist.',
        isError: true
    };

    const container = document.getElementById('page-content');

    if (route.isError) {
        container.innerHTML = `
            <section class="error-page container">
                <h1 class="headline">${route.title}</h1>
                <p class="subtext">${route.subtext}</p>
                <div style="margin-top: 40px;">
                    <a href="/" class="btn btn-primary" data-link>Return Home</a>
                </div>
            </section>
        `;
    } else {
        container.innerHTML = `
            <section class="context-header">
                <div class="container">
                    <h1 class="headline">${route.title}</h1>
                    <p class="subtext">${route.subtext}</p>
                </div>
            </section>
            <main class="main-layout container">
                <div class="primary-workspace">
                    <div class="card">
                        <h2 class="card-title">Coming Soon</h2>
                        <p class="card-description">The infrastructure and features for the ${route.title} are scheduled for the next implementation phase.</p>
                    </div>
                </div>
                <aside class="secondary-panel">
                    <div class="panel-section">
                        <h3 class="panel-title">Status</h3>
                        <p class="panel-text">This route is part of the initial skeleton. Business logic will be injected here during the feature development step.</p>
                    </div>
                </aside>
            </main>
        `;
    }

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
};

document.addEventListener('DOMContentLoaded', () => {
    // Intercept clicks for routing
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault();
            navigateTo(e.target.href);
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
