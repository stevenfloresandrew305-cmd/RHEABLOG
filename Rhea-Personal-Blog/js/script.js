(function () {
  'use strict';

  var TOTAL = 20;

  var CAPTIONS = {
    1:  'The first page of my story, a memory I am happy to share.',
    2:  'A quiet moment kept close, just the way I remember it.',
    3:  'A beautiful moment celebrating the beginning of another year with family.',
    4:  'Welcoming 2026 with smiles, family, and unforgettable memories.',
    5:  'A special gathering filled with happiness and wonderful company.',
    6:  'Capturing memories with friends during our school journey.',
    7:  'School days become more memorable when shared with good friends.',
    8:  'A simple nighttime moment with friends worth remembering.',
    9:  'Little moments and beautiful memories with my friends.',
    10: 'Celebrating teamwork, friendship, and unforgettable school experiences.',
    11: 'A sweet celebration made special by friends and shared happiness.',
    12: 'A relaxing beach getaway filled with sunshine and friendship.',
    13: 'Intramurals memories, teamwork, and moments to remember.',
    14: 'A meaningful family moment during a special celebration.',
    15: 'Enjoying the peaceful scenery and beautiful moments outdoors.',
    16: 'A memorable trip with friends surrounded by nature and beautiful views.',
    17: 'A lovely day captured through a simple and elegant photograph.',
    18: 'Another chapter, another memory saved with a smile.',
    19: 'A day worth remembering, captured just as it was.',
    20: 'One more memory for now, with many more stories still to come.'
  };

  var AUTOPLAY_MS = 4000;
  var SLIDE_MS = 600;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function src(n) { return 'img/' + n + '.jpg'; }

  function watchImage(img) {
    var holder = img.closest('[data-photo]');
    if (!holder) return;
    function markMissing() { holder.classList.add('is-missing'); }
    img.addEventListener('error', markMissing);
    if (img.loading !== 'lazy' && img.getAttribute('src') &&
        img.complete && img.naturalWidth === 0) {
      markMissing();
    }
  }

  var header = $('#siteHeader');
  var navToggle = $('#navToggle');
  var navMenu = $('#navMenu');

  function setMenu(open) {
    navMenu.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  navToggle.addEventListener('click', function () {
    setMenu(!navMenu.classList.contains('is-open'));
  });

  document.addEventListener('click', function (e) {
    if (navMenu.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setMenu(false);
  });

  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var hash = link.getAttribute('href');
      if (hash.length < 2) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', hash); } catch (err) { }
    });
  });

  var sections = $$('[data-section]');
  var navLinks = $$('[data-nav]');
  var ticking = false;

  function updateOnScroll() {
    ticking = false;
    header.classList.toggle('is-scrolled', window.scrollY > 8);

    var probe = header.offsetHeight + window.innerHeight * 0.3;
    var current = sections[0].id;
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= probe) current = s.id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = 'contact';
    }
    if (current === 'journey') current = 'gallery';

    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-nav') === current);
    });
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateOnScroll); }
  }, { passive: true });
  updateOnScroll();

  var carousel = $('#carousel');
  var viewport = $('#carouselViewport');
  var track = $('#carouselTrack');
  var dotsBox = $('#carDots');
  var thumbsBox = $('#carThumbs');
  var captionEl = $('#carCaption');
  var counterEl = $('#carCounter');

  var currentIndex = 1;
  var isAnimating = false;
  var autoTimer = null;
  var hold = { hover: false, drag: false, hidden: false, lightbox: false };

  function makeSlide(n) {
    var slide = document.createElement('div');
    slide.className = 'slide photo';
    slide.setAttribute('data-photo', '');
    slide.setAttribute('data-file', src(n));
    var img = new Image();
    img.src = src(n);
    img.alt = 'Photo ' + n + ' of ' + TOTAL + ': ' + CAPTIONS[n];
    img.draggable = false;
    img.decoding = 'async';
    slide.appendChild(img);
    watchImage(img);
    return slide;
  }

  function buildCarousel() {
    for (var n = 1; n <= TOTAL; n++) {
      track.appendChild(makeSlide(n));
    }

    for (var i = 1; i <= TOTAL; i++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.setAttribute('aria-label', 'Go to photo ' + i);
      dot.setAttribute('data-index', i);
      dotsBox.appendChild(dot);

      var thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'thumb photo';
      thumb.setAttribute('data-photo', '');
      thumb.setAttribute('data-file', src(i));
      thumb.setAttribute('aria-label', 'Show photo ' + i);
      thumb.setAttribute('data-index', i);
      var timg = new Image();
      timg.src = src(i);
      timg.alt = '';
      timg.loading = 'lazy';
      timg.decoding = 'async';
      thumb.appendChild(timg);
      watchImage(timg);
      thumbsBox.appendChild(thumb);
    }

    updateCarousel(false);
  }

  function updateCarousel(animate) {
    var offset = -(currentIndex - 1) * 100;
    if (animate && !reducedMotion) {
      track.style.transition = 'transform ' + SLIDE_MS + 'ms cubic-bezier(0.65, 0, 0.35, 1)';
    } else {
      track.style.transition = 'none';
    }
    track.style.transform = 'translateX(' + offset + '%)';

    captionEl.textContent = CAPTIONS[currentIndex];
    captionEl.classList.remove('is-changing');
    void captionEl.offsetWidth;
    captionEl.classList.add('is-changing');
    counterEl.textContent = currentIndex + ' / ' + TOTAL;

    $$('.dot', dotsBox).forEach(function (d) {
      var on = Number(d.getAttribute('data-index')) === currentIndex;
      d.classList.toggle('is-active', on);
      if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });

    $$('.thumb', thumbsBox).forEach(function (t) {
      var on = Number(t.getAttribute('data-index')) === currentIndex;
      t.classList.toggle('is-active', on);
      if (on) {
        var left = t.offsetLeft - (thumbsBox.clientWidth - t.offsetWidth) / 2;
        if (thumbsBox.scrollTo) {
          thumbsBox.scrollTo({ left: left, behavior: reducedMotion ? 'auto' : 'smooth' });
        } else {
          thumbsBox.scrollLeft = left;
        }
      }
    });
  }

  function goNext() {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex++;
    updateCarousel(true);

    setTimeout(function () {
      isAnimating = false;
      if (currentIndex > TOTAL) {
        currentIndex = 1;
        updateCarousel(false);
      }
    }, SLIDE_MS);
  }

  function goPrev() {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex--;
    updateCarousel(true);

    setTimeout(function () {
      isAnimating = false;
      if (currentIndex < 1) {
        currentIndex = TOTAL;
        updateCarousel(false);
      }
    }, SLIDE_MS);
  }

  function goTo(n) {
    if (isAnimating || n === currentIndex) return;
    isAnimating = true;
    currentIndex = n;
    updateCarousel(true);

    setTimeout(function () {
      isAnimating = false;
    }, SLIDE_MS);
  }

  function startAuto() {
    stopAuto();
    if (hold.hover || hold.drag || hold.hidden || hold.lightbox) return;
    autoTimer = setInterval(goNext, AUTOPLAY_MS);
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  carousel.addEventListener('pointerenter', function (e) {
    if (e.pointerType === 'mouse') { hold.hover = true; stopAuto(); }
  });
  carousel.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') { hold.hover = false; startAuto(); }
  });
  document.addEventListener('visibilitychange', function () {
    hold.hidden = document.hidden;
    if (hold.hidden) stopAuto(); else startAuto();
  });

  $('#carPrev').addEventListener('click', function () { goPrev(); startAuto(); });
  $('#carNext').addEventListener('click', function () { goNext(); startAuto(); });

  function onPick(e) {
    var btn = e.target.closest('[data-index]');
    if (!btn) return;
    goTo(Number(btn.getAttribute('data-index')));
    startAuto();
  }
  dotsBox.addEventListener('click', onPick);
  thumbsBox.addEventListener('click', onPick);

  carousel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { goPrev(); startAuto(); }
    if (e.key === 'ArrowRight') { goNext(); startAuto(); }
  });

  var startX = 0, dragX = 0, dragging = false;

  viewport.addEventListener('pointerdown', function (e) {
    if (isAnimating) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    dragX = 0;
    hold.drag = true;
    stopAuto();
    try { viewport.setPointerCapture(e.pointerId); } catch (err) { }
  });

  viewport.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    dragX = e.clientX - startX;
    var offset = -(currentIndex - 1) * 100;
    track.style.transition = 'none';
    track.style.transform = 'translateX(calc(' + offset + '% + ' + dragX + 'px))';
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    hold.drag = false;
    var threshold = Math.min(60, viewport.offsetWidth * 0.15);
    if (Math.abs(dragX) > threshold) {
      if (dragX < 0) goNext(); else goPrev();
    } else {
      updateCarousel(true);
    }
    dragX = 0;
    startAuto();
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  var galleryGrid = $('#galleryGrid');
  var lightbox = $('#lightbox');
  var lbPhoto = $('#lbPhoto');
  var lbImg = $('#lbImg');
  var lbCaption = $('#lbCaption');
  var lbIndex = 1;
  var lastFocus = null;

  function buildGallery() {
    for (var n = 1; n <= TOTAL; n++) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'g-item photo';
      item.setAttribute('data-photo', '');
      item.setAttribute('data-file', src(n));
      item.setAttribute('data-index', n);
      item.setAttribute('aria-label', 'Open photo ' + n + ': ' + CAPTIONS[n]);

      var img = new Image();
      img.src = src(n);
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      item.appendChild(img);

      var zoom = document.createElement('span');
      zoom.className = 'g-zoom';
      zoom.setAttribute('aria-hidden', 'true');
      zoom.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M11 5a6 6 0 100 12 6 6 0 000-12zM21 21l-4.5-4.5M11 8.5v5M8.5 11h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      item.appendChild(zoom);

      watchImage(img);
      galleryGrid.appendChild(item);
    }
  }

  function showLightboxPhoto(n) {
    lbIndex = ((n - 1) % TOTAL + TOTAL) % TOTAL + 1;
    lbPhoto.classList.remove('is-missing');
    lbPhoto.setAttribute('data-file', src(lbIndex));
    lbImg.src = src(lbIndex);
    lbImg.alt = 'Photo ' + lbIndex + ' of ' + TOTAL + ': ' + CAPTIONS[lbIndex];
    lbCaption.textContent = CAPTIONS[lbIndex];
  }

  lbImg.addEventListener('error', function () {
    if (lbImg.getAttribute('src')) lbPhoto.classList.add('is-missing');
  });

  function openLightbox(n) {
    lastFocus = document.activeElement;
    showLightboxPhoto(n);
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');
    hold.lightbox = true;
    stopAuto();
    window.requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    $('#lbClose').focus();
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    hold.lightbox = false;
    startAuto();
    setTimeout(function () { lightbox.hidden = true; lbImg.removeAttribute('src'); }, reducedMotion ? 0 : 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  galleryGrid.addEventListener('click', function (e) {
    var item = e.target.closest('.g-item');
    if (item) openLightbox(Number(item.getAttribute('data-index')));
  });

  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', function () { showLightboxPhoto(lbIndex - 1); });
  $('#lbNext').addEventListener('click', function () { showLightboxPhoto(lbIndex + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) {
      if (e.key === 'Escape') setMenu(false);
      return;
    }
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showLightboxPhoto(lbIndex - 1);
    else if (e.key === 'ArrowRight') showLightboxPhoto(lbIndex + 1);
    else if (e.key === 'Tab') {
      var focusables = $$('.lb-btn', lightbox);
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  $$('img', document).forEach(function (img) {
    if (!img.closest('#carouselTrack') && !img.closest('#galleryGrid') &&
        !img.closest('#carThumbs') && img.id !== 'lbImg') {
      watchImage(img);
    }
  });

  buildCarousel();
  buildGallery();
  startAuto();
})();