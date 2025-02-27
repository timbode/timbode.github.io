document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  const navLinks = document.querySelectorAll('nav a');
  const navMenu = document.querySelector('.nav-links');

  // Toggle mobile menu
  mobileMenuButton.addEventListener('click', function() {
    mobileMenuButton.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close mobile menu when clicking a link
  const closeMenu = () => {
    mobileMenuButton.classList.remove('active');
    navMenu.classList.remove('active');
  };


  navLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();

      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        closeMenu(); // Close mobile menu when clicking a link
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});