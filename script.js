document.addEventListener('DOMContentLoaded', function() {
  // Smooth scrolling for navigation
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Load publications
  const publicationsSection = document.querySelector('#publications');
  if (publicationsSection) {
    fetch('publications.html')
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const publicationsList = doc.querySelector('ul');
        if (publicationsList) {
          const existingList = publicationsSection.querySelector('ul');
          if (existingList) {
            existingList.replaceWith(publicationsList);
          } else {
            publicationsSection.appendChild(publicationsList);
          }
        }
      })
      .catch(error => {
        console.error('Error loading publications:', error);
      });
  }
});