// Progressive enhancements: the document, links, and disclosures work without JavaScript.
(() => {
  'use strict';

  const root = document.documentElement;
  const languageToggle = document.querySelector('#language-toggle');
  const themeToggle = document.querySelector('#theme-toggle');
  const mobileMenu = document.querySelector('.mobile-nav');
  const menuToggle = mobileMenu?.querySelector('summary');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const translatedText = [...document.querySelectorAll('[data-i18n]')];
  const translatedLabels = [...document.querySelectorAll('[data-i18n-aria]')];
  const english = Object.fromEntries([
    ...translatedText.map((element) => [element.dataset.i18n, element.textContent]),
    ...translatedLabels.map((element) => [element.dataset.i18nAria, element.getAttribute('aria-label')]),
  ]);
  const chinese = {
    skip: '跳转到正文',
    brand: '黄文瑀',
    brandAria: '黄文瑀，返回顶部',
    navAria: '主导航',
    navAbout: '关于',
    navResearch: '探索方向',
    navProjects: '项目',
    menuAria: '打开导航',
    mobileNavAria: '移动端导航',
    heroLine1: '始于好奇，',
    heroLine2: '求解世界。',
    heroName: '黄文瑀 / Wing',
    heroIntro: '加州大学圣地亚哥分校物理学本科生，预计于 2029 年毕业。探索物理系统、机器学习，以及它们之间的规律。',
    explore: '探索我的项目',
    gravityAria: '可交互的引力实验。拖动以发射粒子，或使用发射粒子按钮。调整引力强度，观察轨道如何变化。',
    gravityHint: '引力实验场 — 拖动发射粒子',
    frequency: '引力',
    launchParticle: '发射粒子',
    resetGravity: '重置',
    factsAria: '个人概览',
    studyLabel: '学习',
    studyValue: 'UC San Diego 物理学 · 2029',
    focusLabel: '关注',
    focusValue: '学习系统与计算',
    locationLabel: '所在地',
    locationValue: '美国加州，圣地亚哥',
    aboutLabel: '关于我',
    aboutLine1: '对规律保持好奇。',
    aboutLine2: '对答案继续追问。',
    aboutP1: '我是黄文瑀（Wenyu Huang），也可以叫我 Wing。目前在加州大学圣地亚哥分校攻读物理学本科，预计于 2029 年毕业。我的兴趣横跨物理系统、数学与机器学习。',
    aboutP2: '我喜欢将想法变成模型，用代码检验它们，再寻找解释尚未触及的地方。这里记录我正在探索的问题，以及一路构建的项目。',
    affiliationLabel: '目前所在课题组',
    serraGroup: 'Mattia Serra 课题组',
    liGroup: 'Aobo Li 课题组',
    researchLabel: '探索方向',
    researchTitle: '值得继续追问的问题。',
    research1Title: '从物理信号中学习',
    research1Desc: '模型究竟学到了什么？当预测依赖了错误的信号时，我们又该如何察觉？',
    research1Topics: '粒子物理 / 机器学习',
    research2Title: '生命系统的力学',
    research2Desc: '局部作用力、主动应力与材料性质，如何共同塑造集体运动和组织形变？',
    research2Topics: '连续介质力学 / 生物物理',
    projectsLabel: '精选项目',
    projectsTitle: '让想法落地。',
    allRepos: '全部代码仓库',
    cellTitle: '细胞应力',
    cellCategory: '组织力学 / Mattia Serra 课题组',
    cellDesc: '通过连续介质模型、力平衡分析与数值实验，探索主动应力和弹性如何影响组织形变。',
    discussResearch: '交流这项研究',
    project1Category: '粒子物理与机器学习 / Aobo Li 课题组',
    project1Desc: '通过能量匹配对比与能量依赖性诊断，从整体准确率之外的角度评估粒子事件模型。',
    project1Aria: 'EnergyBench — 查看代码仓库',
    energyImageAria: '放大 EnergyBench 图表',
    energyCaption: '研究图表 — 模型对比与能量依赖性诊断。',
    project2Category: '模拟 / 科学计算',
    project2Desc: '结合平衡几何、非线性求解器与交互式可视化，对液滴引起的弯曲进行数值研究。',
    project2Aria: 'Elastocapillarity — 查看代码仓库',
    elasticImageAria: '放大液滴平衡形态图',
    elasticCaption: '数值研究 — 三种弹性毛细参数下的平衡形态。',
    project3Category: '网页 / 科研工具',
    project3Desc: '一张可搜索的 UC San Diego 科研地图，将教师、实验室、科研机会与学术档案汇集于同一界面。',
    project3Aria: 'Research Atlas — 查看代码仓库',
    atlasImageAria: '放大 Research Atlas 界面',
    atlasCaption: '界面设计 — 搜索、筛选并探索 UC San Diego 的科研。',
    enlarge: '点击图片放大 ↗',
    imageViewerAria: '项目图片',
    closeImage: '关闭 ×',
    viewRepo: '查看代码仓库',
    cellCanvasAria: '可交互的模拟场。使用时间滑块和物理量切换按钮，探索细胞面积与肌球蛋白分布。',
    cellStudyLabel: '探索模拟结果',
    cellFieldAria: '模拟物理量',
    cellArea: '细胞面积',
    cellMyosin: '肌球蛋白',
    cellTimeLabel: '模拟时间',
    cellPlay: '播放',
    cellReset: '重置',
    cellLoading: '正在载入模拟数据…',
    cellDataCaption: '由原始模拟数值场在浏览器中实时绘制。可探索 0–15 小时的已保存状态；交互控件不会重新求解模型。',
    arcadeCategory: '浏览器游戏 / 个人项目',
    arcadeDesc: '一个汇集益智、策略游戏与趣味实验的浏览器游乐场，支持响应式操作、本地收藏与 AI 对手。',
    playArcade: '进入游乐场',
    arcadeImageAria: '进入 Wenhao’s Arcade 游乐场',
    arcadeCaption: '玩一会儿，换个心情。— 项目原有封面插图。',
    arcadeLive: '在浏览器中游玩 ↗',
    contactLine1: '总有新的',
    contactLine2: '问题。',
    contactDesc: '有一个问题、一个想法，或值得一起探索的事物？',
    contactGithub: '在 GitHub 找到我',
    copyrightName: '黄文瑀',
    backTop: '返回顶部',
  };

  const imageDescriptions = {
    energyImageAria: 'EnergyBench 对模型排名、分词方式与能量依赖性的对比图。',
    elasticImageAria: '三种递增弹性毛细参数下的液滴与弹性梁平衡形态。',
    atlasImageAria: 'Research Atlas 界面，包含教师搜索、研究筛选、搜索结果与个人档案详情。',
    arcadeImageAria: '黑色网格上的绿色方块蛇，Wenhao’s Arcade 项目封面插图。',
  };
  const projectImages = [...document.querySelectorAll('.project-figure a')].map((link) => {
    const image = link.querySelector('img');
    return { link, image, englishAlt: image?.alt || '' };
  });
  const imageViewer = document.querySelector('#image-viewer');
  const viewerImage = imageViewer?.querySelector('img');
  const viewerCaption = imageViewer?.querySelector('.viewer-caption');
  let activeImageLink = null;

  const description = document.querySelector('meta[name="description"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const metadata = {
    en: {
      title: document.title,
      description: description?.content || '',
      ogTitle: ogTitle?.content || document.title,
      ogDescription: ogDescription?.content || '',
    },
    'zh-CN': {
      title: '黄文瑀 Wenyu Huang — 物理与计算',
      description: '黄文瑀（Wenyu Huang）— 加州大学圣地亚哥分校物理学本科生，预计于 2029 年毕业。探索物理系统、机器学习与科学计算。',
      ogTitle: '黄文瑀 Wenyu Huang — 物理与计算',
      ogDescription: '始于好奇，求解世界。黄文瑀的物理探索、学习系统与精选项目。',
    },
  };

  function readPreference(key) {
    try { return window.localStorage.getItem(key); }
    catch (_) { return null; }
  }

  function savePreference(key, value) {
    try { window.localStorage.setItem(key, value); }
    catch (_) { /* Preferences still apply to this visit when storage is unavailable. */ }
  }

  let language = readPreference('wing-language') === 'zh-CN' ? 'zh-CN' : 'en';
  const savedTheme = readPreference('wing-theme');
  let explicitTheme = savedTheme === 'light' || savedTheme === 'dark';

  function updateMenuLabel() {
    if (!menuToggle) return;
    menuToggle.setAttribute('aria-label', language === 'zh-CN'
      ? mobileMenu.open ? '关闭导航' : '打开导航'
      : mobileMenu.open ? 'Close navigation' : 'Open navigation');
  }

  function updateThemeLabel() {
    if (!themeToggle) return;
    const dark = root.dataset.theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.setAttribute('aria-label', language === 'zh-CN'
      ? dark ? '切换为浅色模式' : '切换为深色模式'
      : dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function setLanguage(nextLanguage, persist = false) {
    language = nextLanguage === 'zh-CN' ? 'zh-CN' : 'en';
    const dictionary = language === 'zh-CN' ? chinese : english;
    root.lang = language;
    translatedText.forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = dictionary[key] ?? english[key];
    });
    translatedLabels.forEach((element) => {
      const key = element.dataset.i18nAria;
      element.setAttribute('aria-label', dictionary[key] ?? english[key]);
    });
    projectImages.forEach(({ link, image, englishAlt }) => {
      if (image) image.alt = language === 'zh-CN'
        ? imageDescriptions[link.dataset.i18nAria] || englishAlt
        : englishAlt;
    });
    updateViewerDescription();
    if (languageToggle) {
      languageToggle.textContent = language === 'en' ? '中文' : 'EN';
      languageToggle.lang = language === 'en' ? 'zh-CN' : 'en';
      languageToggle.setAttribute('aria-label', language === 'en' ? '切换为中文' : 'Switch to English');
    }
    const pageMetadata = metadata[language];
    document.title = pageMetadata.title;
    if (description) description.content = pageMetadata.description;
    if (ogTitle) ogTitle.content = pageMetadata.ogTitle;
    if (ogDescription) ogDescription.content = pageMetadata.ogDescription;
    updateThemeLabel();
    updateMenuLabel();
    if (persist) savePreference('wing-language', language);
    window.dispatchEvent(new Event('languagechange'));
    schedulePageUpdate();
  }

  function setTheme(nextTheme, persist = false) {
    root.dataset.theme = nextTheme === 'dark' ? 'dark' : 'light';
    updateThemeLabel();
    if (themeColor) {
      themeColor.content = window.getComputedStyle(root).getPropertyValue('--paper').trim()
        || (root.dataset.theme === 'dark' ? '#171918' : '#f5f5f2');
    }
    if (persist) {
      explicitTheme = true;
      savePreference('wing-theme', root.dataset.theme);
    }
    window.dispatchEvent(new Event('themechange'));
  }

  languageToggle?.addEventListener('click', () => setLanguage(language === 'en' ? 'zh-CN' : 'en', true));
  themeToggle?.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  darkScheme.addEventListener('change', (event) => {
    if (!explicitTheme) setTheme(event.matches ? 'dark' : 'light');
  });

  mobileMenu?.addEventListener('toggle', updateMenuLabel);
  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.open = false;
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      // Keep native anchor scrolling and move keyboard focus out of the closed menu.
      const previousTabIndex = target.getAttribute('tabindex');
      if (previousTabIndex === null) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (previousTabIndex === null) {
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !mobileMenu?.open) return;
    mobileMenu.open = false;
    menuToggle?.focus();
  });
  document.addEventListener('click', (event) => {
    if (mobileMenu?.open && !mobileMenu.contains(event.target)) mobileMenu.open = false;
  });

  function updateViewerDescription() {
    if (!activeImageLink || !viewerImage || !viewerCaption) return;
    viewerImage.alt = activeImageLink.querySelector('img')?.alt || '';
    viewerCaption.textContent = activeImageLink.closest('figure')
      ?.querySelector('figcaption > span')?.textContent || '';
  }

  if (imageViewer && viewerImage && typeof imageViewer.showModal === 'function') {
    projectImages.filter(({ link }) => link.hasAttribute('data-lightbox')).forEach(({ link }) => {
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        activeImageLink = link;
        viewerImage.src = link.href;
        updateViewerDescription();
        try {
          imageViewer.showModal();
        } catch (_) {
          // Preserve the image link if this browser cannot open the native dialog.
          viewerImage.removeAttribute('src');
          activeImageLink = null;
          return;
        }
        event.preventDefault();
        document.body.classList.add('viewer-open');
      });
    });
    imageViewer.querySelector('.viewer-close')?.addEventListener('click', () => imageViewer.close());
    imageViewer.addEventListener('click', (event) => {
      if (!imageViewer.open || event.target !== imageViewer) return;
      const bounds = imageViewer.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) imageViewer.close();
    });
    imageViewer.addEventListener('close', () => {
      document.body.classList.remove('viewer-open');
      viewerImage.removeAttribute('src');
      viewerImage.alt = '';
      if (viewerCaption) viewerCaption.textContent = '';
      activeImageLink = null;
    });
  }

  const progress = document.querySelector('.reading-progress');
  const header = document.querySelector('.site-header');
  const navigation = [...document.querySelectorAll('.desktop-nav a[data-section]')]
    .map((link) => ({ link, section: document.getElementById(link.dataset.section) }))
    .filter(({ section }) => section);
  let pageFrame = 0;

  function updatePage() {
    pageFrame = 0;
    const distance = root.scrollHeight - window.innerHeight;
    const fraction = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    progress?.style.setProperty('--progress', String(fraction));
    const readingLine = (header?.getBoundingClientRect().bottom || 0)
      + Math.min(window.innerHeight * 0.2, 160);
    navigation.forEach(({ link, section }) => {
      const bounds = section.getBoundingClientRect();
      if (bounds.top <= readingLine && bounds.bottom > readingLine) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function schedulePageUpdate() {
    if (!pageFrame) pageFrame = window.requestAnimationFrame(updatePage);
  }

  window.addEventListener('scroll', schedulePageUpdate, { passive: true });
  window.addEventListener('resize', schedulePageUpdate, { passive: true });
  window.addEventListener('load', schedulePageUpdate, { once: true });
  document.querySelectorAll('details').forEach((detail) => detail.addEventListener('toggle', schedulePageUpdate));
  document.fonts?.ready.then(schedulePageUpdate);

  const reveals = [...document.querySelectorAll('.reveal')];
  let revealObserver;

  function revealAll() {
    revealObserver?.disconnect();
    revealObserver = null;
    root.classList.remove('motion-ready');
    reveals.forEach((element) => element.classList.add('is-visible'));
  }

  function initializeReveals() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealAll();
      return;
    }
    try {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver?.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      reveals.forEach((element) => revealObserver.observe(element));
      root.classList.add('motion-ready');
    } catch (_) {
      // A missing or failing observer must never make the content inaccessible.
      revealAll();
    }
  }

  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) revealAll();
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  setTheme(explicitTheme ? savedTheme : darkScheme.matches ? 'dark' : 'light');
  setLanguage(language);
  initializeReveals();
})();
