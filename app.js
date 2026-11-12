/**
 * Pro Teach Consults — Behance NZUAC UI/UX Interactive Engine
 * Features:
 * - Split-text word reveal choreography & curtain image reveals
 * - Interactive Gallery Window (8 items + Filter tabs + Fullscreen Lightbox <dialog> with keyboard nav)
 * - Dedicated Principal Consultant (Zenab Adam) 3-Portrait Switcher
 * - Animated Sliding Testimonials Carousel (auto-play, arrows, pagination dots, touch swipe)
 * - Animated statistics counters
 * - Magnetic buttons, pointer spotlight cards & custom cursor follower
 * - Consultation booking <dialog> modal & toast confirmation
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heroBgVideo = document.getElementById('heroBgVideo');
  if (heroBgVideo) {
    heroBgVideo.muted = true;
    heroBgVideo.play().catch(() => {});
  }

  /* --------------------------------------------------------------------------
     1. SPLIT-TEXT TYPOGRAPHY PREPARATION
     -------------------------------------------------------------------------- */
  document.querySelectorAll('[data-split-text]').forEach((el) => {
    const plainText = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', plainText);

    let wordIndex = 0;
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
          } else {
            const mask = document.createElement('span');
            mask.className = 'split-word-mask';
            mask.setAttribute('aria-hidden', 'true');

            const word = document.createElement('span');
            word.className = 'split-word';
            word.style.setProperty('--word-delay', `${wordIndex * 34}ms`);
            word.textContent = part;

            mask.appendChild(word);
            frag.appendChild(mask);
            wordIndex++;
          }
        });
        return frag;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        clone.setAttribute('aria-hidden', 'true');
        Array.from(node.childNodes).forEach((child) => {
          clone.appendChild(processNode(child));
        });
        return clone;
      }
      return document.createTextNode('');
    };

    const children = Array.from(el.childNodes);
    el.innerHTML = '';
    children.forEach((child) => el.appendChild(processNode(child)));
  });

  /* --------------------------------------------------------------------------
     2. INTERSECTION OBSERVER FOR REVEALS & COUNTERS
     -------------------------------------------------------------------------- */
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -30px 0px' }
  );

  document
    .querySelectorAll('[data-split-text], .reveal-up, .reveal-scale, .curtain-reveal')
    .forEach((el) => revealObserver.observe(el));

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target || '0', 10);
    if (prefersReducedMotion || !target) {
      el.textContent = target.toLocaleString();
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(eased * target).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.counter').forEach((c) => counterObserver.observe(c));

  /* --------------------------------------------------------------------------
     3. SCROLL PROGRESS & STICKY HEADER SCROLLSPY
     -------------------------------------------------------------------------- */
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const siteHeader = document.getElementById('siteHeader');
  const navLinks = document.querySelectorAll('.nav-link[data-nav]');
  const sections = Array.from(navLinks)
    .map((l) => document.getElementById(l.dataset.nav))
    .filter(Boolean);

  const onScroll = () => {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollProgressBar) {
      scrollProgressBar.style.scale = `${maxScroll > 0 ? scrollTop / maxScroll : 0} 1`;
    }
    if (siteHeader) {
      siteHeader.classList.toggle('is-scrolled', scrollTop > 20);
    }

    let activeId = '';
    sections.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      if (r.top <= 160 && r.bottom >= 160) activeId = sec.id;
    });
    navLinks.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === activeId));
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------------------------------------
     4. INTERACTIVE CURSOR, MAGNETIC BUTTONS & CARD SPOTLIGHT
     -------------------------------------------------------------------------- */
  const cursorFollower = document.getElementById('cursorFollower');
  const cursorLabel = document.getElementById('cursorLabel');

  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion && cursorFollower) {
    window.addEventListener(
      'pointermove',
      (e) => {
        cursorFollower.style.opacity = '1';
        cursorFollower.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      },
      { passive: true }
    );

    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        cursorFollower.classList.add('is-active');
        if (cursorLabel) cursorLabel.textContent = el.dataset.cursor || '';
      });
      el.addEventListener('pointerleave', () => {
        cursorFollower.classList.remove('is-active');
        if (cursorLabel) cursorLabel.textContent = '';
      });
    });

    document.querySelectorAll('.magnetic-btn').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.translate = `${dx * 0.14}px ${dy * 0.2}px`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.translate = '0px 0px';
      });
    });

    const heroStage = document.getElementById('heroParallaxStage');
    if (heroStage) {
      heroStage.addEventListener('pointermove', (e) => {
        const r = heroStage.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        const img = heroStage.querySelector('.parallax-img');
        if (img) img.style.translate = `${nx * -12}px ${ny * -12}px`;
      });
      heroStage.addEventListener('pointerleave', () => {
        const img = heroStage.querySelector('.parallax-img');
        if (img) img.style.translate = '0px 0px';
      });
    }
  }

  document.querySelectorAll('[data-spotlight]').forEach((card) => {
    card.addEventListener(
      'pointermove',
      (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
        card.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
      },
      { passive: true }
    );
  });

  /* --------------------------------------------------------------------------
     5. INTERACTIVE GALLERY WINDOW (8 ITEMS + CATEGORY FILTER + LIGHTBOX)
     -------------------------------------------------------------------------- */
  const galleryItemsData = [
    {
      src: 'assets/images/apsi_cohort_real.png',
      tag: 'Official Cohort · Kano',
      title: 'APSI Workshop Graduates & Official Roll-Up Banner',
      desc: 'Zenab Adam and certified alumni holding completion certificates in Kano.'
    },
    {
      src: 'assets/images/hero_workshop.png',
      tag: '#APSI23 Intensive',
      title: 'Stage Confidence & Vocal Coaching',
      desc: 'Hands-on public speaking drills, voice projection, and speech delivery.'
    },
    {
      src: 'assets/images/school_consulting.png',
      tag: 'School Setup & M&E',
      title: 'Teacher & Curriculum Mentorship',
      desc: 'In-classroom teacher capacity building and curriculum review in Kano.'
    },
    {
      src: 'assets/images/check_summit.png',
      tag: 'Annual Convocation',
      title: 'APSI C.H.E.C.K. Summit',
      desc: 'Coaching, Healing, Effective Communication & Knowledge Application Summit.'
    },
    {
      src: 'assets/images/logo-original.png',
      tag: 'Brand Identity',
      title: 'Pro Teach Consults Limited — Inform • Instruct • Inspire',
      desc: '61 Maganda Road, Fagge, Kano State, Nigeria.'
    },
    {
      src: 'assets/images/zenab_1.jpg',
      fallback: 'assets/images/zenab_adam_portrait.png',
      tag: 'Principal Consultant',
      title: 'Zenab Adam — Founder & Lead Strategist',
      desc: 'Edu Consultant, Life Coach, Trainer & Communications Coach, and TEDx Speaker.'
    },
    {
      src: 'assets/images/zenab_2.jpg',
      fallback: 'assets/images/zenab_adam_portrait.png',
      tag: 'TEDx Speaker & Coach',
      title: 'Zenab Adam — Executive Communications & Coaching',
      desc: 'Leading transformative public speaking and teacher training across Northern Nigeria.'
    },
    {
      src: 'assets/images/zenab_3.jpg',
      fallback: 'assets/images/zenab_adam_portrait.png',
      tag: 'Executive Leadership',
      title: 'Zenab Adam — Educational Leadership & Mentorship',
      desc: 'Founder of Pro Teach Consults Limited, Kano State, Nigeria.'
    }
  ];

  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter || 'all';
      const applyFilter = () => {
        filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
        galleryItems.forEach((item) => {
          const match = cat === 'all' || item.dataset.category === cat;
          item.hidden = !match;
        });
      };
      if (document.startViewTransition && !prefersReducedMotion) {
        document.startViewTransition(applyFilter);
      } else {
        applyFilter();
      }
    });
  });

  // Lightbox Window Logic
  const lightbox = document.getElementById('galleryLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTag = document.getElementById('lightboxTag');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');
  let currentSlide = 0;

  const renderLightboxSlide = (index) => {
    currentSlide = (index + galleryItemsData.length) % galleryItemsData.length;
    const item = galleryItemsData[currentSlide];
    if (lightboxImg) {
      lightboxImg.onerror = () => {
        if (item.fallback && lightboxImg.src !== item.fallback) {
          lightboxImg.src = item.fallback;
        }
      };
      lightboxImg.src = item.src;
      lightboxImg.alt = item.title;
    }
    if (lightboxTag) lightboxTag.textContent = item.tag;
    if (lightboxTitle) lightboxTitle.textContent = item.title;
    if (lightboxDesc) lightboxDesc.textContent = item.desc;
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentSlide + 1} / ${galleryItemsData.length}`;
    }
  };

  const openLightbox = (index) => {
    if (!lightbox) return;
    renderLightboxSlide(index);
    lightbox.showModal();
  };

  galleryItems.forEach((item) => {
    const idx = parseInt(item.dataset.index || '0', 10);
    item.addEventListener('click', () => openLightbox(idx));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(idx);
      }
    });
  });

  document.querySelectorAll('[data-gallery-open]').forEach((el) => {
    el.addEventListener('click', () => {
      openLightbox(parseInt(el.dataset.galleryOpen || '0', 10));
    });
  });

  if (closeLightboxBtn && lightbox) {
    closeLightboxBtn.addEventListener('click', () => lightbox.close());
  }
  if (prevBtn) prevBtn.addEventListener('click', () => renderLightboxSlide(currentSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => renderLightboxSlide(currentSlide + 1));

  window.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.open) return;
    if (e.key === 'ArrowLeft') renderLightboxSlide(currentSlide - 1);
    if (e.key === 'ArrowRight') renderLightboxSlide(currentSlide + 1);
  });

  /* --------------------------------------------------------------------------
     6. PRINCIPAL CONSULTANT (ZENAB ADAM) 3-PORTRAIT SWITCHER
     -------------------------------------------------------------------------- */
  const founderFeaturedImg = document.getElementById('founderFeaturedImg');
  const founderCaptionTitle = document.getElementById('founderCaptionTitle');
  const founderMainFrame = document.getElementById('founderMainFrame');
  const founderThumbBtns = document.querySelectorAll('.founder-thumb-btn');

  founderThumbBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      founderThumbBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      const newSrc = btn.dataset.founderSrc;
      const newTitle = btn.dataset.founderTitle;
      const galleryIdx = btn.dataset.galleryIdx;

      if (founderFeaturedImg && newSrc) {
        founderFeaturedImg.style.opacity = '0.35';
        setTimeout(() => {
          founderFeaturedImg.src = newSrc;
          founderFeaturedImg.style.opacity = '1';
        }, 120);
      }
      if (founderCaptionTitle && newTitle) {
        founderCaptionTitle.textContent = newTitle;
      }
      if (founderMainFrame && galleryIdx) {
        founderMainFrame.dataset.galleryOpen = galleryIdx;
      }
    });
  });

  /* --------------------------------------------------------------------------
     7. ANIMATED SLIDING TESTIMONIALS CAROUSEL
     -------------------------------------------------------------------------- */
  const sliderTrack = document.getElementById('testimonialSliderTrack');
  const sliderViewport = document.getElementById('testimonialSliderViewport');
  const prevTestimonialBtn = document.getElementById('prevTestimonialBtn');
  const nextTestimonialBtn = document.getElementById('nextTestimonialBtn');
  const testimonialDotsContainer = document.getElementById('testimonialDots');

  if (sliderTrack && sliderViewport) {
    const slides = Array.from(sliderTrack.querySelectorAll('.testimonial-slide'));
    let currentIndex = 0;
    let autoplayTimer = null;

    const getVisibleCount = () => (window.innerWidth <= 768 ? 1 : 2);
    const getMaxIndex = () => Math.max(0, slides.length - getVisibleCount());

    const renderDots = () => {
      if (!testimonialDotsContainer) return;
      const maxIdx = getMaxIndex();
      testimonialDotsContainer.innerHTML = '';
      for (let i = 0; i <= maxIdx; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `slider-dot${i === currentIndex ? ' is-active' : ''}`;
        dot.setAttribute('aria-label', `Go to testimonial slide ${i + 1}`);
        dot.addEventListener('click', () => {
          goToSlide(i);
          restartAutoplay();
        });
        testimonialDotsContainer.appendChild(dot);
      }
    };

    const updateSliderPosition = () => {
      if (!slides.length) return;
      const maxIdx = getMaxIndex();
      if (currentIndex > maxIdx) currentIndex = 0;
      if (currentIndex < 0) currentIndex = maxIdx;

      const slideEl = slides[0];
      const slideWidth = slideEl.getBoundingClientRect().width;
      const gap = parseFloat(window.getComputedStyle(sliderTrack).gap || '21.6') || 21.6;
      const offset = currentIndex * (slideWidth + gap);
      sliderTrack.style.transform = `translate3d(${-offset}px, 0, 0)`;

      if (testimonialDotsContainer) {
        Array.from(testimonialDotsContainer.children).forEach((dot, idx) => {
          dot.classList.toggle('is-active', idx === currentIndex);
        });
      }
    };

    const goToSlide = (idx) => {
      const maxIdx = getMaxIndex();
      if (idx > maxIdx) {
        currentIndex = 0;
      } else if (idx < 0) {
        currentIndex = maxIdx;
      } else {
        currentIndex = idx;
      }
      updateSliderPosition();
    };

    const startAutoplay = () => {
      if (prefersReducedMotion) return;
      stopAutoplay();
      autoplayTimer = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 4500);
    };

    const stopAutoplay = () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const restartAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    if (prevTestimonialBtn) {
      prevTestimonialBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        restartAutoplay();
      });
    }
    if (nextTestimonialBtn) {
      nextTestimonialBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        restartAutoplay();
      });
    }

    sliderViewport.addEventListener('pointerenter', stopAutoplay);
    sliderViewport.addEventListener('pointerleave', startAutoplay);
    sliderViewport.addEventListener('focusin', stopAutoplay);
    sliderViewport.addEventListener('focusout', startAutoplay);

    // Touch swipe support
    let touchStartX = 0;
    sliderViewport.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].clientX;
        stopAutoplay();
      },
      { passive: true }
    );
    sliderViewport.addEventListener(
      'touchend',
      (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 40) {
          goToSlide(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
        }
        startAutoplay();
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      renderDots();
      updateSliderPosition();
    });

    renderDots();
    updateSliderPosition();
    startAutoplay();
  }

  /* --------------------------------------------------------------------------
     8. CONSULTATION MODAL & TOAST NOTIFICATION
     -------------------------------------------------------------------------- */
  const consultDialog = document.getElementById('consultDialog');
  const modalService = document.getElementById('modalService');
  const modalForm = document.getElementById('modalConsultForm');
  const toastBanner = document.getElementById('toastBanner');

  const openBookingModal = (service = '') => {
    if (!consultDialog) return;
    if (service && modalService) {
      const match = Array.from(modalService.options).find((o) => o.value === service);
      if (match) modalService.value = service;
    }
    consultDialog.showModal();
  };

  ['openModalBtn', 'heroBookBtn', 'ctaBannerBookBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => openBookingModal());
  });

  ['closeModalBtn', 'cancelModalBtn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn && consultDialog) btn.addEventListener('click', () => consultDialog.close());
  });

  document.querySelectorAll('[data-service-select]').forEach((btn) => {
    btn.addEventListener('click', () => openBookingModal(btn.dataset.serviceSelect || ''));
  });

  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      if (!modalForm.checkValidity()) {
        e.preventDefault();
        const invalid = modalForm.querySelector(':invalid');
        if (invalid) invalid.focus();
        return;
      }
      const name = document.getElementById('modalName')?.value || 'Client';
      const service = document.getElementById('modalService')?.value || 'Consultation';
      if (toastBanner) {
        toastBanner.hidden = false;
        toastBanner.textContent = `✓ Thank you, ${name}! Request for ${service} saved. Call/WhatsApp 0902 383 8323 for instant confirmation.`;
        setTimeout(() => {
          toastBanner.hidden = true;
        }, 5000);
      }
    });
  }

  /* --------------------------------------------------------------------------
     9. THEME TOGGLE
     -------------------------------------------------------------------------- */
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const html = document.documentElement;
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (document.startViewTransition && !prefersReducedMotion) {
        document.startViewTransition(() => html.setAttribute('data-theme', next));
      } else {
        html.setAttribute('data-theme', next);
      }
    });
  }
});
