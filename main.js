/**
 * Job Notification App - Design System Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Job Notification App Design System Initialized');
    
    // Example: Handle Copy Prompt button
    window.copyPrompt = () => {
        const promptContent = document.getElementById('prompt-content');
        if (!promptContent) return;
        
        const text = promptContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.secondary-panel .btn-secondary');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('btn-success');
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('btn-success');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    // Smooth scroll for anchors (if any)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
