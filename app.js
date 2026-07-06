// Sena Academy Waitlist App Core Logic

class SenaWaitlistApp {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 8; // Step 0 (welcome) to Step 8 (success)
    this.form = document.getElementById('waitlistForm');
    this.sections = Array.from(document.querySelectorAll('.step-section'));
    this.progressBar = document.getElementById('progressBar');
    
    this.init();
  }

  init() {
    // Prevent default form submit and handle it manually
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Global keyboard listener for Typeform feel
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Listen to changes in radio buttons to auto-advance
    this.setupRadioListeners();

    // Setup dynamic character counter for goals/reason field
    this.setupCharCounter();

    // Initial state rendering
    this.updateUI();
  }

  // Hook up character counter update handler
  setupCharCounter() {
    const textarea = document.getElementById('reason');
    const counter = document.getElementById('charCounter');
    if (textarea && counter) {
      textarea.addEventListener('input', () => {
        const count = textarea.value.length;
        counter.textContent = `${count} / 280 characters`;
      });
    }
  }

  // Set up listeners for radio cards to automatically advance with a slight visual delay
  setupRadioListeners() {
    const radioInputs = this.form.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
      input.addEventListener('change', () => {
        // Highlight active and auto-advance after 300ms for smooth transitions
        setTimeout(() => {
          this.nextStep();
        }, 300);
      });
    });
  }

  // Progress to next step
  nextStep() {
    if (this.currentStep >= this.totalSteps) return;

    // Validate the current step fields before proceeding
    if (!this.validateStep(this.currentStep)) {
      return;
    }

    // Hand off to submit function if we are on the final questionnaire step
    if (this.currentStep === 7) {
      this.handleSubmit();
      return;
    }

    // Transitions
    const currentEl = document.getElementById(`step-${this.currentStep}`);
    currentEl.classList.remove('active');
    currentEl.classList.add('exit');

    this.currentStep++;

    const nextEl = document.getElementById(`step-${this.currentStep}`);
    nextEl.classList.remove('exit');
    nextEl.classList.add('active');

    this.updateUI();
  }

  // Return to previous step
  prevStep() {
    if (this.currentStep <= 0 || this.currentStep === 8) return; // Cannot go back from intro or success

    const currentEl = document.getElementById(`step-${this.currentStep}`);
    currentEl.classList.remove('active');

    this.currentStep--;

    const prevEl = document.getElementById(`step-${this.currentStep}`);
    prevEl.classList.remove('exit');
    prevEl.classList.add('active');

    this.updateUI();
  }

  // Handle standard key presses
  handleKeyDown(e) {
    // Avoid interrupting when on the success screen
    if (this.currentStep === 8) return;

    const key = e.key.toLowerCase();
    const activeSection = this.sections[this.currentStep];

    // Enter Key -> Next step / Submit
    if (e.key === 'Enter') {
      // In textareas, we allow Shift+Enter for newlines, but pure Enter proceeds
      if (e.target.tagName === 'TEXTAREA' && e.shiftKey) {
        return;
      }
      e.preventDefault();
      this.nextStep();
      return;
    }

    // Keyboard Shortcuts for Multiple Choice options (A, B, C, D, E, F)
    const options = activeSection.querySelectorAll('.option-card');
    if (options.length > 0 && ['a', 'b', 'c', 'd', 'e', 'f'].includes(key)) {
      const index = key.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
      if (index >= 0 && index < options.length) {
        e.preventDefault();
        const radio = options[index].querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          // Trigger change event to fire visual styling and auto-advance
          radio.dispatchEvent(new Event('change'));
        }
      }
    }
  }

  // Validate inputs for a specific step
  validateStep(stepIndex) {
    const activeSection = document.getElementById(`step-${stepIndex}`);
    if (!activeSection) return true;

    // Check Text & Email & Tel inputs
    const textInputs = activeSection.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    textInputs.forEach(input => {
      // Clear previous validation styles if any
      input.style.borderBottomColor = '';
      const trimmedValue = input.value.trim();

      // Empty field validation
      if (!trimmedValue) {
        isValid = false;
        this.shakeInput(input);
        return;
      }

      // Enforce Full Name checks (Step 1)
      if (input.id === 'fullName') {
        const nameWords = trimmedValue.split(/\s+/);
        const nameRegex = /^[\p{L}\s'-]{3,60}$/u; // Unicode letters, spaces, hyphens, min 3 chars
        
        if (nameWords.length < 2 || !nameRegex.test(trimmedValue)) {
          isValid = false;
          this.shakeInput(input);
        }
      }

      // Email format verification (Step 2)
      if (input.type === 'email') {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmedValue)) {
          isValid = false;
          this.shakeInput(input);
        }
      }

      // WhatsApp format verification (Step 3)
      if (input.id === 'whatsapp') {
        const cleanPhone = trimmedValue.replace(/[\s\-()]/g, '');
        const phoneRegex = /^\+?[0-9]{7,15}$/;
        if (!phoneRegex.test(cleanPhone)) {
          isValid = false;
          this.shakeInput(input);
        }
      }

      // Character count goals verification (Step 6)
      if (input.id === 'reason') {
        if (trimmedValue.length > 280) {
          isValid = false;
          this.shakeInput(input);
        }
      }
    });

    // Check Radio inputs
    const radioGroup = activeSection.querySelectorAll('input[type="radio"]');
    if (radioGroup.length > 0) {
      const isChecked = Array.from(radioGroup).some(radio => radio.checked);
      if (!isChecked) {
        isValid = false;
        // Shake the grid wrapper
        const grid = activeSection.querySelector('.options-grid');
        if (grid) {
          this.shakeInput(grid);
        }
      }
    }

    return isValid;
  }

  // Visual shake animation for invalid fields
  shakeInput(element) {
    element.style.transform = 'translateX(-10px)';
    element.style.transition = 'transform 0.1s ease';
    element.style.borderBottomColor = 'var(--error-color)';
    
    let offset = 10;
    const interval = setInterval(() => {
      offset = -offset;
      element.style.transform = `translateX(${offset}px)`;
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      element.style.transform = '';
      element.style.transition = '';
    }, 320);
  }

  // Update Progress Line and Focus state
  updateUI() {
    // 1. Calculate & update progress percentage
    // Total interactive questionnaire steps: Step 1 to 7
    let progressVal = 0;
    if (this.currentStep > 0) {
      progressVal = Math.min((this.currentStep / 7) * 100, 100);
    }
    this.progressBar.style.width = `${progressVal}%`;

    // 2. Control visibility of footer arrows
    const btnPrev = document.getElementById('navPrev');
    const btnNext = document.getElementById('navNext');
    
    if (btnPrev && btnNext) {
      btnPrev.disabled = (this.currentStep === 0 || this.currentStep === 8);
      btnNext.disabled = (this.currentStep === 8);
    }

    // 3. Auto-focus and scroll on text/email inputs in the active section
    const activeSection = document.getElementById(`step-${this.currentStep}`);
    if (activeSection) {
      const textInput = activeSection.querySelector('input[type="text"], input[type="email"], input[type="tel"], textarea');
      if (textInput) {
        setTimeout(() => {
          textInput.focus();
          textInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      } else {
        setTimeout(() => {
          activeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }

  // Handle Waitlist Form Submission
  handleSubmit() {
    // Validate final step before proceeding
    if (!this.validateStep(this.currentStep)) return;

    // Gather Form Data
    const formData = new FormData(this.form);
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      whatsapp: formData.get('whatsapp'),
      occupation: formData.get('occupation'),
      primarySkill: formData.get('primarySkill'),
      reason: formData.get('reason'),
      referral: formData.get('referral'),
      timestamp: new Date().toISOString()
    };

    console.log('Sena Academy Waitlist Submission Successful:', data);

    // Post to Google Sheets Web App
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx3_pkZys2dBwTHK6ReO8IfbffDJTn8A6qhOLOtmnCQ346yu4LxlQsni6MI8mmwIMGGpA/exec';
    
    fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // standard workaround for Google Web App CORS restrictions
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(() => console.log('Successfully saved to Google Sheets'))
    .catch(error => console.error('Error posting to Google Sheets:', error));

    // Save in LocalStorage as local backup
    let list = JSON.parse(localStorage.getItem('sena_waitlist') || '[]');
    list.push(data);
    localStorage.setItem('sena_waitlist', JSON.stringify(list));

    // Proceed to Success Slide
    const currentEl = document.getElementById(`step-${this.currentStep}`);
    currentEl.classList.remove('active');
    currentEl.classList.add('exit');

    this.currentStep = 8;

    const successEl = document.getElementById(`step-${this.currentStep}`);
    successEl.classList.add('active');

    this.updateUI();
    this.launchConfetti();
  }

  // Lightweight, secure, offline native canvas particle confetti simulator
  launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Custom branded colors: green accent gradients, blues and golds
    const colors = ['#10b981', '#34d399', '#059669', '#3b82f6', '#60a5fa', '#fbbf24', '#f59e0b'];
    const particles = [];

    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        r: Math.random() * 5 + 3,
        d: Math.random() * height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 8 - 4,
        tiltAngleIncremental: Math.random() * 0.05 + 0.02,
        tiltAngle: 0
      });
    }

    let animationFrameId;
    const startTime = Date.now();

    function draw() {
      ctx.clearRect(0, 0, width, height);

      let active = false;
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 4;

        if (p.y <= height) {
          active = true;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active && Date.now() - startTime < 4000) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animationFrameId);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    }

    draw();
  }
}

// Safe Initialization
let app;
function initApp() {
  app = new SenaWaitlistApp();
  window.app = app;
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
