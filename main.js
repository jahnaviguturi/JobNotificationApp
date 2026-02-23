/**
 * Job Notification App - SPA Router & Design System Shell
 */

const routes = {
    '/': {
        title: 'Home',
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
        title: 'Proof of Concept',
        subtext: 'This section will be built in the next step.'
    }
};

const navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
};

const router = () => {
    const path = window.location.pathname;
    // For local file testing (e.g. index.html) or actual routing
    // If it's a local file, we might need to handle it differently, 
    // but the user's request implies a web app structure.
    // Let's assume standard routing or handle the root properly.

    let route = routes[path] || routes['/']; // Default to home for unknown if desired, but 404 is requested

    // Check if it's a 404
    const isKnownRoute = Object.keys(routes).includes(path);

    if (!isKnownRoute && path !== '/index.html') {
        render404();
        updateActiveLinks(null);
        return;
    }

    if (path === '/index.html') route = routes['/'];

    renderPage(route);
    updateActiveLinks(path === '/index.html' ? '/' : path);
    window.scrollTo(0, 0);
};

const renderPage = (route) => {
    const titleEl = document.getElementById('page-title');
    const subtextEl = document.getElementById('page-subtext');
    const mainContentEl = document.getElementById('main-content');

    if (titleEl) titleEl.textContent = route.title;
    if (subtextEl) subtextEl.textContent = route.subtext;

    // Clear main content as per "No additional content" rule
    if (mainContentEl) mainContentEl.innerHTML = `
        <div class="primary-workspace">
            <div class="card" style="border: 1px dashed var(--color-border); opacity: 0.5; height: 300px; display: flex; align-items: center; justify-content: center;">
                <p>Placeholder for ${route.title} Module</p>
            </div>
        </div>
        <aside class="secondary-panel">
            <div class="panel-section">
                <h3 class="panel-title">Context</h3>
                <p class="panel-text">Additional information related to ${route.title} will appear here.</p>
            </div>
        </aside>
    `;
};

const render404 = () => {
    const titleEl = document.getElementById('page-title');
    const subtextEl = document.getElementById('page-subtext');
    const mainContentEl = document.getElementById('main-content');

    if (titleEl) titleEl.textContent = 'Page Not Found';
    if (subtextEl) subtextEl.textContent = 'The page you are looking for does not exist.';
    if (mainContentEl) mainContentEl.innerHTML = '';
};

const updateActiveLinks = (path) => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === path) {
            link.classList.add('active');
        }
    });
};

// Mobile Menu Toggle logic
const initMobileMenu = () => {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    if (toggle && mobileNav) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('open');
            mobileNav.classList.toggle('open');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
        });

        // Close menu on link click
        mobileNav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('open');
                mobileNav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Intercept clicks on nav-links
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('[data-route]')) {
            e.preventDefault();
            navigateTo(e.target.getAttribute('href'));
        } else if (e.target.closest('[data-route]')) {
            e.preventDefault();
            navigateTo(e.target.closest('[data-route]').getAttribute('href'));
        }
    });

    window.addEventListener('popstate', router);

    initMobileMenu();
    router();
});
