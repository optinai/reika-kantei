(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal, .reveal-scale, .gold-line, .chapter');
  document.querySelectorAll('.product').forEach((el, index) => {
    el.style.setProperty('--card-delay', `${index * 120}ms`);
  });
  document.querySelectorAll('.voice-card').forEach((el, index) => {
    el.style.setProperty('--card-delay', `${index * 75}ms`);
  });
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('on'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px' });
    reveals.forEach(el => observer.observe(el));
  }

  const progress = document.getElementById('progressBar');
  const sticky = document.getElementById('sticky');

  document.querySelectorAll('[data-count]').forEach(el => {
    const goal = Number.parseInt(el.dataset.count || '0', 10);
    const duration = Number.parseInt(el.dataset.countDuration || '2200', 10);
    if (!Number.isFinite(goal)) return;
    if (reduced || !('IntersectionObserver' in window)) {
      el.textContent = goal.toLocaleString('ja-JP');
      return;
    }
    let done = false;
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || done) return;
        done = true;
        let startedAt;
        el.textContent = '0';
        el.classList.add('counting');
        const step = timestamp => {
          startedAt ??= timestamp;
          const progressValue = Math.min((timestamp - startedAt) / duration, 1);
          const eased = 1 - Math.pow(1 - progressValue, 3);
          el.textContent = Math.floor(goal * eased).toLocaleString('ja-JP');
          if (progressValue < 1) requestAnimationFrame(step);
          else {
            el.textContent = goal.toLocaleString('ja-JP');
            el.classList.remove('counting');
            el.classList.add('counted');
          }
        };
        window.setTimeout(() => requestAnimationFrame(step), 260);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    countObserver.observe(el);
  });

  const deadlineKey = document.body.dataset.deadlineKey;
  if (deadlineKey) {
    const periodDays = Number(document.body.dataset.deadlineDays);
    const storageKey = `lp_first_visit_${deadlineKey}`;
    let openedAt = Date.now();
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(saved) && saved > 0) openedAt = saved;
      else {
        // 旧版は72時間後の期限を保存していたため、初回閲覧時刻を復元する。
        const previousDeadline = Number(localStorage.getItem(`lp_deadline_${deadlineKey}`));
        if (Number.isFinite(previousDeadline) && previousDeadline > 72 * 3600000) openedAt = previousDeadline - 72 * 3600000;
        localStorage.setItem(storageKey, String(openedAt));
      }
    } catch (_) {}
    const end = new Date(openedAt);
    end.setDate(end.getDate() + periodDays);
    end.setHours(24, 0, 0, 0);
    const deadline = end.getTime();

    const countdown = document.querySelector('.countdown');
    const expired = document.querySelector('.countdown-expired');
    const countdownMinis = document.querySelectorAll('[data-countdown-mini]');
    const pad = value => String(value).padStart(2, '0');
    let timerId;

    const expireOffer = () => {
      countdown?.classList.add('expired');
      expired?.classList.add('on');
      countdownMinis.forEach(mini => { mini.textContent = 'お申し込み受付中'; });
    };

    const updateCountdown = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        expireOffer();
        if (timerId) window.clearInterval(timerId);
        return;
      }
      const days = Math.floor(remaining / 86400000);
      const hoursLeft = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      const values = { d: String(days), h: pad(hoursLeft), m: pad(minutes), s: pad(seconds) };
      Object.entries(values).forEach(([part, value]) => {
        const target = countdown?.querySelector(`[data-${part}]`);
        if (target) target.textContent = value;
      });
      countdownMinis.forEach(mini => {
        mini.textContent = `残り${days > 0 ? `${days}日 ` : ''}${pad(hoursLeft)}:${pad(minutes)}:${pad(seconds)}`;
      });
    };

    updateCountdown();
    timerId = window.setInterval(updateCountdown, 1000);
  }

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    sticky.classList.toggle('on', window.scrollY > window.innerHeight * 0.65);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
