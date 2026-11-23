(() => {
  const standalone = document.body.hasAttribute('data-app-launch');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const welcomeSeenKey = 'woobi_welcome_seen';

  function hasSeenWelcome() {
    try {
      return (localStorage.getItem('woobi_welcome_seen') === 'true' &&
              localStorage.getItem('woobi_user_registered') === 'true' &&
              localStorage.getItem('woobi_onboarding_completed') === 'true');
    } catch (e) {
      return false;
    }
  }

  function markWelcomeSeen() {
    try {
      localStorage.setItem(welcomeSeenKey, 'true');
      localStorage.setItem('woobi_user_registered', 'true');
      localStorage.setItem('woobi_onboarding_completed', 'true');
    } catch (e) {}
  }

  function animateWelcomeCarpet(canvas, onComplete) {
    if (!canvas) {
      if (onComplete) onComplete();
      return () => {};
    }
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      if (onComplete) onComplete();
      return () => {};
    }

    let width = 0;
    let height = 0;
    let gold, velvet, sheen;
    let animFrame = 0;
    let startTime = null;
    const duration = 1800; // 1.8s silky smooth unroll

    function updateGradients() {
      if (!width || !height) return;
      gold = context.createLinearGradient(0, 0, 0, height);
      gold.addColorStop(0, '#e5c694');
      gold.addColorStop(1, '#9b6a3b');

      velvet = context.createLinearGradient(0, 0, 0, height);
      velvet.addColorStop(0, '#651b2a');
      velvet.addColorStop(0.55, '#ac263c');
      velvet.addColorStop(1, '#791426');

      sheen = context.createLinearGradient(0, 0, width, 0);
      sheen.addColorStop(0, 'rgba(48, 7, 19, 0.5)');
      sheen.addColorStop(0.5, 'rgba(255, 183, 165, 0.12)');
      sheen.addColorStop(1, 'rgba(48, 7, 19, 0.5)');
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      updateGradients();
    }

    resize();

    function draw(progress) {
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);

      // Smooth cosine easing
      const travel = 0.5 - Math.cos(progress * Math.PI) / 2;
      const front = -14 + (height + 54) * travel;
      const halfWidth = y => width * (0.10 + 0.40 * y / height);
      const center = width / 2;

      function fabric(inset, fill) {
        context.beginPath();
        context.moveTo(center - halfWidth(0) + inset, 0);
        context.lineTo(center + halfWidth(0) - inset, 0);
        context.lineTo(center + halfWidth(front) - inset, front);
        context.lineTo(center - halfWidth(front) + inset, front);
        context.closePath();
        context.fillStyle = fill;
        context.fill();
      }

      if (front > 0) {
        fabric(0, gold);
        fabric(Math.max(2, width * 0.007), velvet);
        fabric(Math.max(2, width * 0.007), sheen);
      }

      const radius = 3 + 9 * Math.max(0, Math.min(front / height, 1));
      if (front - radius < height && progress < 1) {
        const left = center - halfWidth(front);
        const right = center + halfWidth(front);
        const cap = radius * 0.7;
        const roll = context.createLinearGradient(0, front - radius, 0, front + radius);
        roll.addColorStop(0, '#882237');
        roll.addColorStop(0.28, '#d2616b');
        roll.addColorStop(0.52, '#b5384d');
        roll.addColorStop(1, '#651526');

        context.beginPath();
        context.moveTo(left + cap, front - radius);
        context.lineTo(right - cap, front - radius);
        context.bezierCurveTo(right + cap, front - radius, right + cap, front + radius, right - cap, front + radius);
        context.lineTo(left + cap, front + radius);
        context.bezierCurveTo(left - cap, front + radius, left - cap, front - radius, left + cap, front - radius);
        context.fillStyle = roll;
        context.fill();

        context.fillStyle = '#c49b65';
        for (const x of [left + cap * 0.3, right - cap * 0.3]) {
          context.beginPath();
          context.ellipse(x, front, cap * 0.6, radius * 0.88, 0, 0, Math.PI * 2);
          context.fill();
        }
      }
    }

    if (reduced.matches) {
      draw(1);
      if (onComplete) onComplete();
      return () => {};
    }

    function tick(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      draw(progress);
      if (progress < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        // Unroll complete: render clean final frame and end loop permanently
        draw(1);
        if (onComplete) onComplete();
      }
    }

    animFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }

  function revealDashboard() {
    window.app?.goToScreen?.('today');
    window.Studio3D?.setRenderingPaused?.(false);
  }

  // The standalone preview hands off to the actual app after Enter is pressed.
  const address = new URL(location.href);
  if (!standalone && address.searchParams.get('welcome') === 'entered') {
    address.searchParams.delete('welcome');
    history.replaceState(null, '', address);
    markWelcomeSeen();
    revealDashboard();
    return;
  }

  function initRedCarpet(onFinishedCallback) {
    // Pause 3D background rendering during intro to guarantee 60fps canvas unroll
    if (window.Studio3D && typeof window.Studio3D.setRenderingPaused === 'function') {
      window.Studio3D.setRenderingPaused(true);
    }

    document.body.classList.add('welcome-intro');

    let welcome = document.getElementById('woobiRedCarpetIntro') || document.querySelector('.app-welcome');
    if (!welcome) {
      welcome = document.createElement('div');
      welcome.id = 'woobiRedCarpetIntro';
      welcome.className = 'app-welcome';
      welcome.setAttribute('aria-labelledby', 'app-welcome-title');
      welcome.innerHTML = `
        <div class="welcome-stage" aria-hidden="true"><span class="welcome-arch"></span></div>
        <header class="welcome-header">
          <div class="welcome-brand">woobi<span>YOUR STYLE, REMIXED.</span></div>
        </header>
        <div class="welcome-copy">
          <span class="welcome-star" aria-hidden="true">✧</span>
          <p class="welcome-eyebrow">A MOMENT, JUST FOR YOU</p>
          <h1 id="app-welcome-title">Discover the art<br><em>of being you</em></h1>
          <button class="welcome-skip" type="button" autofocus>Enter Woobi <span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span></button>
        </div>
        <div class="welcome-carpet" aria-hidden="true"><canvas></canvas></div>`;
      document.body.append(welcome);
    }

    welcome.style.display = 'block';
    welcome.style.opacity = '1';
    welcome.style.pointerEvents = 'auto';

    let canvas = welcome.querySelector('.welcome-carpet canvas');
    let stopCarpetAnim = animateWelcomeCarpet(canvas);

    let entering = false;
    const finish = () => {
      stopCarpetAnim();
      document.body.classList.remove('welcome-intro');
      welcome.style.transition = 'opacity 0.4s ease';
      welcome.style.opacity = '0';
      welcome.style.pointerEvents = 'none';
      setTimeout(() => {
        welcome.style.display = 'none';
        welcome.style.clipPath = '';
      }, 400);

      markWelcomeSeen();

      if (standalone) {
        location.replace(location.protocol === 'file:' ? '../index.html?welcome=entered' : '/?welcome=entered');
        return;
      }

      revealDashboard();

      if (typeof onFinishedCallback === 'function') {
        onFinishedCallback();
      }

      const dashboard = document.querySelector('.app-viewport');
      if (dashboard) {
        dashboard.setAttribute('tabindex', '-1');
        dashboard.focus({ preventScroll: true });
      }
    };

    const enterButton = welcome.querySelector('button');
    if (enterButton) {
      enterButton.onclick = async () => {
        if (entering) return;
        entering = true;
        enterButton.disabled = true;

        if (reduced.matches || standalone) {
          finish();
          return;
        }

        // Smooth hardware-accelerated aperture / fade transition
        welcome.querySelectorAll('.welcome-header, .welcome-copy').forEach(el => {
          el.style.transition = 'opacity 0.25s ease';
          el.style.opacity = '0';
        });

        try {
          const bounds = welcome.getBoundingClientRect();
          const btnBounds = enterButton.getBoundingClientRect();
          const centerX = btnBounds.left + btnBounds.width / 2 - bounds.left;
          const centerY = btnBounds.top + btnBounds.height / 2 - bounds.top;
          const radius = Math.hypot(
            Math.max(centerX, bounds.width - centerX),
            Math.max(centerY, bounds.height - centerY)
          ) * 1.05;

          function aperture(size) {
            const points = ['0px 0px', '100% 0px', '100% 100%', '0px 100%', '0px 0px'];
            for (let step = 0; step <= 32; step++) {
              const angle = step / 32 * Math.PI * 2;
              points.push(`${centerX + Math.cos(angle) * size}px ${centerY + Math.sin(angle) * size}px`);
            }
            points.push('0px 0px');
            return `polygon(evenodd, ${points.join(',')})`;
          }

          const departure = welcome.animate([
            { clipPath: aperture(0) },
            { clipPath: aperture(radius) }
          ], { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
          departure.finished.then(finish, finish);
        } catch (e) {
          finish();
        }
      };
    }

    // Keyboard support: Enter key
    const onKey = (e) => {
      if (!entering && (e.key === 'Enter' || e.key === ' ')) {
        window.removeEventListener('keydown', onKey);
        if (enterButton) enterButton.click();
      }
    };
    window.addEventListener('keydown', onKey);
  }

  // Only auto-run if standalone preview page
  if (standalone) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initRedCarpet());
    } else {
      initRedCarpet();
    }
  }

  window.woobiShowRedCarpetIntro = initRedCarpet;
})();
