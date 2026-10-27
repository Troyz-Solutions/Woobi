/**
 * AURA Wardrobe — Exact Replica Prototype Application Logic
 * Full Production System with:
 * - 01 Setup & First Outfit: Welcome, Style preferences, Add your wardrobe, Review item
 * - 02 Daily Outfit Studio: Today, Outfit details, Swap an item, Outfit ready
 * - 03 Style Studio: "Need an outfit?" AI Wardrobe Stylist & "Make your own outfit" Custom Builder
 * - 04 Wardrobe Intelligence: Condition (Clean / In Laundry) & Fit (Tight / Perfect / Loose) Tracking
 * - 05 Wardrobe & History: Your wardrobe, Saved looks, Wear history, Profile
 * - 06 Auth, Premium & Settings: Sign in, Premium, Reminders, Account & privacy
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DATA MODELS & INITIAL STATE
  // =========================================================================
  const LOOKS_DATA = [
    {
      id: 'look_1',
      title: 'Easy everyday',
      caption: 'A relaxed look for your college day.',
      modelPhoto: 'assets/model_tryon_navy.jpg',
      top: { name: 'Navy shirt', photo: 'assets/navy_shirt.jpg', condition: 'clean', fit: 'perfect' },
      bottom: { name: 'Beige trousers', photo: 'assets/beige_chinos.jpg', condition: 'clean', fit: 'perfect' },
      footwear: { name: 'White sneakers', photo: 'assets/white_sneakers.jpg', condition: 'clean', fit: 'perfect' },
      accessory: { name: 'Leather watch', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' }
    },
    {
      id: 'look_2',
      title: 'Office ready',
      caption: 'Crisp tailored tones suited for AC workdays.',
      modelPhoto: 'assets/model_tryon_linen.jpg',
      top: { name: 'White linen shirt', photo: 'assets/white_linen_shirt.jpg', condition: 'clean', fit: 'loose' },
      bottom: { name: 'Beige trousers', photo: 'assets/beige_chinos.jpg', condition: 'clean', fit: 'perfect' },
      footwear: { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg', condition: 'clean', fit: 'perfect' },
      accessory: { name: 'Leather watch', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' }
    },
    {
      id: 'look_3',
      title: 'Weekend casual',
      caption: 'Lightweight breathable cotton for warm afternoons.',
      modelPhoto: 'assets/model_tryon_kurta.jpg',
      top: { name: 'Olive kurta', photo: 'assets/olive_kurta.jpg', condition: 'clean', fit: 'perfect' },
      bottom: { name: 'Cream palazzo', photo: 'assets/cream_palazzo.jpg', condition: 'clean', fit: 'loose' },
      footwear: { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg', condition: 'clean', fit: 'perfect' },
      accessory: { name: 'Leather watch', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' }
    }
  ];

  // Complete user wardrobe collection with laundry & fit telemetry
  const WARDROBE_ITEMS = [
    { id: 'item_1', name: 'Navy shirt', category: 'Tops', photo: 'assets/navy_shirt.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_2', name: 'Beige chinos', category: 'Bottoms', photo: 'assets/beige_chinos.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_3', name: 'Cream kurta', category: 'Tops', photo: 'assets/olive_kurta.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_4', name: 'White sneakers', category: 'Shoes', photo: 'assets/white_sneakers.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_5', name: 'Maroon top', category: 'Tops', photo: 'assets/maroon_top.jpg', condition: 'clean', fit: 'tight' },
    { id: 'item_6', name: 'Dark skirt', category: 'Bottoms', photo: 'assets/dark_skirt.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_7', name: 'White linen shirt', category: 'Tops', photo: 'assets/white_linen_shirt.jpg', condition: 'clean', fit: 'loose' },
    { id: 'item_8', name: 'Dark denim', category: 'Bottoms', photo: 'assets/dark_denim.jpg', condition: 'dirty', fit: 'perfect' },
    { id: 'item_9', name: 'Tan loafers', category: 'Shoes', photo: 'assets/tan_loafers.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_10', name: 'Leather watch', category: 'Accessories', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_11', name: 'Black trainers', category: 'Shoes', photo: 'assets/black_trainers.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_12', name: 'Brown sandals', category: 'Shoes', photo: 'assets/brown_sandals.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_13', name: 'Cream palazzo', category: 'Bottoms', photo: 'assets/cream_palazzo.jpg', condition: 'clean', fit: 'loose' },
    { id: 'item_14', name: 'Indigo kurti', category: 'Tops', photo: 'assets/indigo_kurti.jpg', condition: 'dirty', fit: 'perfect' },
    { id: 'item_15', name: 'Terracotta tee', category: 'Tops', photo: 'assets/terracotta_tee.jpg', condition: 'dirty', fit: 'tight' },
    { id: 'item_16', name: 'Tailored blazer', category: 'Tops', photo: 'assets/smart_blazer.jpg', condition: 'clean', fit: 'tight' }
  ];

  // Pre-calculated AI Stylist Curations for "Need an outfit?" alternative cycling
  const STYLIST_OPTIONS = [
    {
      id: 'opt_1',
      title: 'Easy Everyday Contrast',
      caption: 'Breathable navy cotton paired with beige chinos for Chennai 29°C.',
      modelPhoto: 'assets/model_tryon_navy.jpg',
      flatLayPhoto: 'assets/minimal_style.jpg',
      top: { name: 'Navy shirt', photo: 'assets/navy_shirt.jpg' },
      bottom: { name: 'Beige chinos', photo: 'assets/beige_chinos.jpg' },
      footwear: { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' },
      rationale: 'Lightweight cotton prevents heat retention in Chennai humidity. High-contrast navy and beige create a timeless smart-casual balance. We avoided your dark denim because it is marked in laundry.'
    },
    {
      id: 'opt_2',
      title: 'Crisp Linen Tailored',
      caption: 'Clean monochrome tones ideal for indoor AC and meetings.',
      modelPhoto: 'assets/model_tryon_linen.jpg',
      flatLayPhoto: 'assets/office_ready.jpg',
      top: { name: 'White linen shirt', photo: 'assets/white_linen_shirt.jpg' },
      bottom: { name: 'Beige chinos', photo: 'assets/beige_chinos.jpg' },
      footwear: { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg' },
      rationale: 'Relaxed linen airflow tailored with structured beige trousers. Tan loafers pull the earthy palette together. All 3 pieces are 100% clean and ready.'
    },
    {
      id: 'opt_3',
      title: 'Relaxed Urban Minimal',
      caption: 'Comfortable street style with lightweight ease.',
      modelPhoto: 'assets/model_tryon_maroon.jpg',
      flatLayPhoto: 'assets/style_casual.jpg',
      top: { name: 'Maroon top', photo: 'assets/maroon_top.jpg' },
      bottom: { name: 'Dark skirt', photo: 'assets/dark_skirt.jpg' },
      footwear: { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' },
      rationale: 'Deep maroon tone paired with dark pleated skirt. White sneakers add casual athletic contrast for walking comfortably around the city.'
    },
    {
      id: 'opt_4',
      title: 'Refined Modern Heritage',
      caption: 'Elevated silhouette suitable for evening outings and celebrations.',
      modelPhoto: 'assets/model_tryon_kurta.jpg',
      flatLayPhoto: 'assets/traditional_kurta.jpg',
      top: { name: 'Cream kurta', photo: 'assets/olive_kurta.jpg' },
      bottom: { name: 'Cream palazzo', photo: 'assets/cream_palazzo.jpg' },
      footwear: { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg' },
      rationale: 'Breathable ethnic silhouette with contemporary relaxed drape. Perfect for celebrations, dinners, and evening gatherings.'
    }
  ];

  const state = {
    currentScreen: 'welcome',
    todayCanvasMode: 'model', // 'model' or 'flat'
    stylistViewMode: 'model', // 'model' or 'flat'
    currentLookIndex: 0,
    currentStylistOptionIndex: 0,
    stylistForm: {
      occasion: 'College',
      vibe: 'Relaxed',
      weather: 'Chennai 29°C'
    },
    builderSelection: {
      top: WARDROBE_ITEMS.find(i => i.id === 'item_1'),
      bottom: WARDROBE_ITEMS.find(i => i.id === 'item_2'),
      shoe: WARDROBE_ITEMS.find(i => i.id === 'item_4'),
      accessory: WARDROBE_ITEMS.find(i => i.id === 'item_10')
    },
    builderCurrentTab: 'Tops',
    activeEditingItemId: null,
    modalCondition: 'clean',
    modalFit: 'perfect',
    wardrobeActiveCategory: 'All',
    activeSwapSlot: 'footwear',
    selectedSwapChoice: {
      name: 'Brown loafers',
      photo: 'assets/tan_loafers.jpg'
    },
    savedBookmarks: new Set(['look_1', 'look_2', 'look_3']),
    currentPlan: 'monthly',
    isPremium: false,
    wearHistoryCount: 6
  };

  // =========================================================================
  // 2. SCREEN ROUTER & NAVIGATION
  // =========================================================================
  function goToScreen(screenId) {
    state.currentScreen = screenId;

    // Update screen selector dropdown if present
    const select = document.getElementById('screenSelect');
    if (select && select.value !== screenId) {
      select.value = screenId;
    }

    // Hide all phone screens
    document.querySelectorAll('.phone-screen').forEach(el => el.classList.remove('active'));

    // Show target screen
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    // Specific screen entry triggers
    if (screenId === 'wardrobe') {
      renderWardrobeGrid();
      updateWardrobeCounts();
    } else if (screenId === 'ai-stylist') {
      resetStylistQuestionnaire();
      updateStylistWardrobeStats();
    } else if (screenId === 'custom-builder') {
      renderBuilderGrid();
      updateBuilderTray();
    }

    // Update Bottom Nav active tab indicator if applicable
    updateBottomNav(screenId);

    // Scroll phone screen container to top
    const container = document.getElementById('phoneScreenContainer');
    if (container) container.scrollTop = 0;
  }

  function updateBottomNav(screenId) {
    const navMapping = {
      'today': 'today',
      'outfit-details': 'today',
      'swap-item': 'today',
      'outfit-ready': 'today',
      'preparing-outfits': 'today',
      'ai-stylist': 'today',
      'custom-builder': 'today',
      'photo-access': 'today',
      'not-enough-items': 'today',
      'outfit-feedback': 'today',
      'weekly-planning': 'today',

      'wardrobe': 'wardrobe',
      'review-item': 'wardrobe',
      'add-wardrobe': 'wardrobe',
      'empty-wardrobe': 'wardrobe',
      'upload-failed': 'wardrobe',
      'crop-photo': 'wardrobe',
      'edit-item': 'wardrobe',

      'saved': 'saved',
      'offline-mode': 'saved',

      'profile': 'profile',
      'wear-history': 'profile',
      'premium': 'profile',
      'manage-subscription': 'profile',
      'reminders': 'profile',
      'account-privacy': 'profile',
      'help-support': 'profile',
      'delete-account': 'profile',
      'new-password': 'profile'
    };

    const targetTab = navMapping[screenId] || 'today';
    document.querySelectorAll('.phone-bottom-nav .nav-tab').forEach(btn => {
      const isMatch = btn.textContent.toLowerCase().includes(targetTab);
      btn.classList.toggle('active', isMatch);
    });
  }

  // =========================================================================
  // 3. DAILY OUTFIT CAROUSEL & PREVIEW TOGGLE
  // =========================================================================
  function setTodayCanvasMode(mode) {
    state.todayCanvasMode = mode;
    const btnModel = document.getElementById('btnViewModel');
    const btnFlat = document.getElementById('btnViewFlat');
    const viewMod = document.getElementById('todayModelView');
    const viewQuad = document.getElementById('todayCollageQuad');

    if (mode === 'model') {
      if (btnModel) btnModel.classList.add('active');
      if (btnFlat) btnFlat.classList.remove('active');
      if (viewMod) viewMod.classList.remove('hidden');
      if (viewQuad) viewQuad.classList.add('hidden');
    } else {
      if (btnModel) btnModel.classList.remove('active');
      if (btnFlat) btnFlat.classList.add('active');
      if (viewMod) viewMod.classList.add('hidden');
      if (viewQuad) viewQuad.classList.remove('hidden');
    }
  }

  function cycleLook(direction) {
    state.currentLookIndex = (state.currentLookIndex + direction + LOOKS_DATA.length) % LOOKS_DATA.length;
    renderCurrentLook();
  }

  function renderCurrentLook() {
    const look = LOOKS_DATA[state.currentLookIndex];
    if (!look) return;

    // Today screen elements
    const todayLookName = document.getElementById('todayLookName');
    const lookIndexLabel = document.getElementById('lookIndexLabel');
    if (todayLookName) todayLookName.textContent = look.title;
    if (lookIndexLabel) lookIndexLabel.textContent = `Look ${state.currentLookIndex + 1} of ${LOOKS_DATA.length}`;

    // Model View
    const todayModelImg = document.getElementById('todayModelImg');
    if (todayModelImg) todayModelImg.src = look.modelPhoto;

    // Flat Quad View
    const qTop = document.getElementById('quadImgTop');
    const qBot = document.getElementById('quadImgBot');
    const qShoe = document.getElementById('quadImgShoe');
    const qAcc = document.getElementById('quadImgAcc');
    if (qTop) qTop.src = look.top.photo;
    if (qBot) qBot.src = look.bottom.photo;
    if (qShoe) qShoe.src = look.footwear.photo;
    if (qAcc) qAcc.src = look.accessory.photo;

    // Carousel dots
    const dots = document.querySelectorAll('#carouselDots .dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === state.currentLookIndex);
    });

    // Outfit details screen sync
    const detTitle = document.getElementById('detailsOutfitTitle');
    const detCaption = document.getElementById('detailsCaptionText');
    if (detTitle) detTitle.textContent = look.title;
    if (detCaption) detCaption.textContent = look.caption;

    const dTop = document.getElementById('detImgTop');
    const dBot = document.getElementById('detImgBot');
    const dShoe = document.getElementById('detImgShoe');
    const dAcc = document.getElementById('detImgAcc');
    if (dTop) dTop.src = look.top.photo;
    if (dBot) dBot.src = look.bottom.photo;
    if (dShoe) dShoe.src = look.footwear.photo;
    if (dAcc) dAcc.src = look.accessory.photo;

    const rowTop = document.getElementById('rowThumbTop');
    const rowNameTop = document.getElementById('rowNameTop');
    const rowBot = document.getElementById('rowThumbBot');
    const rowNameBot = document.getElementById('rowNameBot');
    const rowShoe = document.getElementById('rowThumbShoe');
    const rowNameShoe = document.getElementById('rowNameShoe');

    if (rowTop) rowTop.src = look.top.photo;
    if (rowNameTop) rowNameTop.textContent = look.top.name;
    if (rowBot) rowBot.src = look.bottom.photo;
    if (rowNameBot) rowNameBot.textContent = look.bottom.name;
    if (rowShoe) rowShoe.src = look.footwear.photo;
    if (rowNameShoe) rowNameShoe.textContent = look.footwear.name;

    // Outfit ready screen sync
    const rTop = document.getElementById('readyImgTop');
    const rBot = document.getElementById('readyImgBot');
    const rShoe = document.getElementById('readyImgShoe');
    const rAcc = document.getElementById('readyImgAcc');
    if (rTop) rTop.src = look.top.photo;
    if (rBot) rBot.src = look.bottom.photo;
    if (rShoe) rShoe.src = look.footwear.photo;
    if (rAcc) rAcc.src = look.accessory.photo;
  }

  function setTodayOccasion(occ, btn) {
    document.querySelectorAll('#todayOccasionGroup .pill-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (occ === 'Office') {
      state.currentLookIndex = 1;
    } else if (occ === 'Casual') {
      state.currentLookIndex = 2;
    } else {
      state.currentLookIndex = 0;
    }
    renderCurrentLook();
    showToast(`Styling looks for ${occ} in Chennai`);
  }

  // =========================================================================
  // 4. AI STYLIST FLOW ("NEED AN OUTFIT?" WITH ALTERNATIVE CYCLE)
  // =========================================================================
  function selectStylistOption(field, value, btn) {
    state.stylistForm[field] = value;
    const parent = btn.parentElement;
    if (parent) {
      parent.querySelectorAll('.pill-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }

  function updateStylistWardrobeStats() {
    const cleanItems = WARDROBE_ITEMS.filter(i => i.condition === 'clean');
    const dirtyItems = WARDROBE_ITEMS.filter(i => i.condition === 'dirty');

    const cleanEl = document.getElementById('stylistCleanCount');
    const dirtyEl = document.getElementById('stylistDirtyCount');
    if (cleanEl) cleanEl.textContent = cleanItems.length;
    if (dirtyEl) dirtyEl.textContent = dirtyItems.length;
  }

  function resetStylistQuestionnaire() {
    const qView = document.getElementById('stylistQuestionnaireView');
    const aView = document.getElementById('stylistAnalyzingView');
    const rView = document.getElementById('stylistResultView');

    if (qView) qView.classList.remove('hidden');
    if (aView) aView.classList.add('hidden');
    if (rView) rView.classList.add('hidden');
    state.currentStylistOptionIndex = 0;
  }

  function updateAIStep(stepNum, status) {
    const el = document.getElementById(`aiStep${stepNum}`);
    if (!el) return;
    el.classList.remove('pending', 'current', 'completed');
    el.classList.add(status);
    const bullet = el.querySelector('.step-bullet');
    if (bullet) {
      bullet.textContent = (status === 'completed') ? '✓' : stepNum;
    }
  }

  function setAIProgress(percent) {
    const bar = document.getElementById('aiProgressBar');
    if (bar) bar.style.width = `${percent}%`;
  }

  function synthesizeAIOutfit(isRegen = false) {
    const occasion = state.stylistForm.occasion || 'College';
    const vibe = state.stylistForm.vibe || 'Relaxed';
    const weather = state.stylistForm.weather || 'Chennai 29°C';

    const qView = document.getElementById('stylistQuestionnaireView');
    const aView = document.getElementById('stylistAnalyzingView');
    const rView = document.getElementById('stylistResultView');

    if (qView) qView.classList.add('hidden');
    if (rView) rView.classList.add('hidden');
    if (aView) aView.classList.remove('hidden');

    const occasionTag = document.getElementById('aiPromptOccasionTag');
    if (occasionTag) occasionTag.textContent = occasion;

    // Reset stages to Step 1 active
    setAIProgress(22);
    updateAIStep(1, 'current');
    updateAIStep(2, 'pending');
    updateAIStep(3, 'pending');
    updateAIStep(4, 'pending');

    // Filter clean wardrobe items
    const cleanTops = WARDROBE_ITEMS.filter(i => i.category === 'Tops' && i.condition === 'clean');
    const cleanBottoms = WARDROBE_ITEMS.filter(i => i.category === 'Bottoms' && i.condition === 'clean');
    const cleanShoes = WARDROBE_ITEMS.filter(i => i.category === 'Shoes' && i.condition === 'clean');

    // Select pieces tailored to occasion & vibe
    let top, bottom, footwear, localFallback, flatLay;

    if (occasion === 'Office' || vibe === 'Sharp') {
      top = cleanTops.find(i => i.name.includes('linen') || i.name.includes('blazer')) || cleanTops[0];
      bottom = cleanBottoms.find(i => i.name.includes('chinos') || i.name.includes('trousers')) || cleanBottoms[0];
      footwear = cleanShoes.find(i => i.name.includes('loafers')) || cleanShoes[0];
      localFallback = 'assets/model_tryon_linen.jpg';
      flatLay = 'assets/office_ready.jpg';
    } else if (occasion === 'Festive') {
      top = cleanTops.find(i => i.name.includes('kurta') || i.name.includes('kurti')) || cleanTops[0];
      bottom = cleanBottoms.find(i => i.name.includes('palazzo') || i.name.includes('chinos')) || cleanBottoms[0];
      footwear = cleanShoes.find(i => i.name.includes('loafers') || i.name.includes('sandals')) || cleanShoes[0];
      localFallback = 'assets/model_tryon_kurta.jpg';
      flatLay = 'assets/traditional_kurta.jpg';
    } else if (occasion === 'Date' || vibe === 'Minimal') {
      top = cleanTops.find(i => i.name.includes('Maroon') || i.name.includes('Navy')) || cleanTops[0];
      bottom = cleanBottoms.find(i => i.name.includes('skirt') || i.name.includes('chinos')) || cleanBottoms[0];
      footwear = cleanShoes.find(i => i.name.includes('sneakers') || i.name.includes('loafers')) || cleanShoes[0];
      localFallback = 'assets/model_tryon_maroon.jpg';
      flatLay = 'assets/style_casual.jpg';
    } else {
      // College or Casual
      top = cleanTops.find(i => i.name.includes('Navy') || i.name.includes('tee')) || cleanTops[0];
      bottom = cleanBottoms.find(i => i.name.includes('chinos') || i.name.includes('denim')) || cleanBottoms[0];
      footwear = cleanShoes.find(i => i.name.includes('sneakers') || i.name.includes('trainers')) || cleanShoes[0];
      localFallback = 'assets/model_tryon_navy.jpg';
      flatLay = 'assets/minimal_style.jpg';
    }

    // Dynamic Generative AI Prompt & unique seed
    const seed = Math.floor(Math.random() * 899999) + 100000;
    const aiPrompt = `Full-length head-to-toe editorial fashion photograph of an attractive Indian model standing in a modern architectural aesthetic setting for ${occasion}. Wearing ${top.name}, ${bottom.name}, and ${footwear.name} clearly visible on feet touching floor. Full body head down to shoes visible, natural soft editorial lighting, 8k resolution, elegant lookbook styling.`;
    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=768&height=1024&nologo=true&seed=${seed}&model=flux`;

    // Preload image in background
    let finalModelUrl = aiImageUrl;
    const preloadImg = new Image();
    preloadImg.onload = () => {
      finalModelUrl = aiImageUrl;
    };
    preloadImg.onerror = () => {
      finalModelUrl = localFallback;
    };
    preloadImg.src = aiImageUrl;

    // Timeline Animation Stages
    setTimeout(() => {
      updateAIStep(1, 'completed');
      updateAIStep(2, 'current');
      setAIProgress(48);
    }, 600);

    setTimeout(() => {
      updateAIStep(2, 'completed');
      updateAIStep(3, 'current');
      setAIProgress(74);
    }, 1300);

    setTimeout(() => {
      updateAIStep(3, 'completed');
      updateAIStep(4, 'current');
      setAIProgress(94);
    }, 2000);

    setTimeout(() => {
      updateAIStep(4, 'completed');
      setAIProgress(100);

      // Create new AI Curation object
      const aiCuration = {
        id: `ai_gen_${Date.now()}`,
        isAIGenerated: true,
        title: `${vibe} ${occasion} Contrast`,
        caption: `Algorithmically styled for ${occasion} in ${weather}`,
        modelPhoto: finalModelUrl,
        flatLayPhoto: flatLay,
        top: { name: top.name, photo: top.photo },
        bottom: { name: bottom.name, photo: bottom.photo },
        footwear: { name: footwear.name, photo: footwear.photo },
        rationale: `Neural Stylist harmonized your clean ${top.name} with ${bottom.name} and ${footwear.name} for ${weather} humidity control. Color contrast optimized for a ${vibe.toLowerCase()} silhouette.`
      };

      // Set as the primary option
      STYLIST_OPTIONS[0] = aiCuration;
      state.currentStylistOptionIndex = 0;

      if (aView) aView.classList.add('hidden');
      if (rView) rView.classList.remove('hidden');

      renderStylistOption(0);
      showToast(isRegen ? '⚡ AI synthesized a fresh variation!' : '✨ AI synthesized your full-body look on model!');
    }, 2600);
  }

  function generateStylistOutfit() {
    synthesizeAIOutfit(false);
  }

  function regenerateAIOutfit() {
    synthesizeAIOutfit(true);
  }

  function cycleStylistOption() {
    // Advances to next look in circular fashion
    state.currentStylistOptionIndex = (state.currentStylistOptionIndex + 1) % STYLIST_OPTIONS.length;
    renderStylistOption(state.currentStylistOptionIndex);
    showToast(`Loaded Alternative Look ${state.currentStylistOptionIndex + 1} of ${STYLIST_OPTIONS.length}`);
  }

  function setStylistViewMode(mode) {
    state.stylistViewMode = mode;
    const btnM = document.getElementById('stylistBtnModel');
    const btnF = document.getElementById('stylistBtnFlat');
    if (btnM) btnM.classList.toggle('active', mode === 'model');
    if (btnF) btnF.classList.toggle('active', mode === 'flat');
    renderStylistOption(state.currentStylistOptionIndex);
  }

  function renderStylistOption(index) {
    const opt = STYLIST_OPTIONS[index];
    if (!opt) return;

    const titleEl = document.getElementById('stylistLookTitle');
    const capEl = document.getElementById('stylistLookCaption');
    const modelEl = document.getElementById('stylistResultModelImg');
    const tagEl = document.getElementById('stylistModelTagText');
    const aiBadge = document.getElementById('stylistAiBadge');

    if (titleEl) titleEl.textContent = opt.title;
    if (capEl) capEl.textContent = opt.caption;
    
    if (aiBadge) {
      if (opt.isAIGenerated) {
        aiBadge.style.display = 'inline-block';
        aiBadge.textContent = '🤖 Real-time AI Generated';
      } else {
        aiBadge.style.display = 'inline-block';
        aiBadge.textContent = '✨ Curated Classic';
      }
    }

    if (modelEl) {
      if (state.stylistViewMode === 'flat' && opt.flatLayPhoto) {
        modelEl.src = opt.flatLayPhoto;
        if (tagEl) tagEl.innerHTML = '<span>👔</span> Studio Flat-Lay';
      } else {
        modelEl.src = opt.modelPhoto;
        if (tagEl) tagEl.innerHTML = opt.isAIGenerated ? '<span>✨</span> AI Generated Look' : '<span>👤</span> Styled on model (Full Look)';
      }
    }

    const tTop = document.getElementById('stylistThumbTop');
    const nTop = document.getElementById('stylistNameTop');
    const tBot = document.getElementById('stylistThumbBot');
    const nBot = document.getElementById('stylistNameBot');
    const tShoe = document.getElementById('stylistThumbShoe');
    const nShoe = document.getElementById('stylistNameShoe');

    if (tTop) tTop.src = opt.top.photo;
    if (nTop) nTop.textContent = opt.top.name;
    if (tBot) tBot.src = opt.bottom.photo;
    if (nBot) nBot.textContent = opt.bottom.name;
    if (tShoe) tShoe.src = opt.footwear.photo;
    if (nShoe) nShoe.textContent = opt.footwear.name;

    const ratEl = document.getElementById('stylistRationaleText');
    if (ratEl) ratEl.textContent = opt.rationale;

    const hintEl = document.getElementById('stylistOptionHint');
    if (hintEl) hintEl.textContent = `Showing Option ${index + 1} of ${STYLIST_OPTIONS.length} · Tap to cycle alternatives`;
  }

  function confirmStylistOutfit() {
    const opt = STYLIST_OPTIONS[state.currentStylistOptionIndex];
    if (opt) {
      // Sync to Ready Screen
      const rTop = document.getElementById('readyImgTop');
      const rBot = document.getElementById('readyImgBot');
      const rShoe = document.getElementById('readyImgShoe');
      if (rTop) rTop.src = opt.top.photo;
      if (rBot) rBot.src = opt.bottom.photo;
      if (rShoe) rShoe.src = opt.footwear.photo;
    }
    showToast('✓ Outfit selected! Marked as planned for today.');
    goToScreen('outfit-ready');
  }

  // =========================================================================
  // 5. CUSTOM OUTFIT BUILDER ("MAKE YOUR OWN OUTFIT")
  // =========================================================================
  function setBuilderTab(tabName, btn) {
    state.builderCurrentTab = tabName;
    if (btn) {
      const parent = btn.parentElement;
      if (parent) {
        parent.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    }
    renderBuilderGrid();
  }

  function renderBuilderGrid() {
    const container = document.getElementById('builderItemsGrid');
    if (!container) return;

    const items = WARDROBE_ITEMS.filter(item => {
      if (state.builderCurrentTab === 'Tops') return item.category === 'Tops';
      if (state.builderCurrentTab === 'Bottoms') return item.category === 'Bottoms';
      if (state.builderCurrentTab === 'Shoes') return item.category === 'Shoes';
      if (state.builderCurrentTab === 'Accessories') return item.category === 'Accessories';
      return true;
    });

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      const isSelected = isItemSelectedInBuilder(item);
      const isDirty = item.condition === 'dirty';

      card.className = `builder-item-card ${isSelected ? 'selected' : ''} ${isDirty ? 'dirty' : ''}`;
      card.onclick = () => selectBuilderItem(item);

      const statusBadge = isDirty
        ? '<span class="badge-status dirty">🧺 In Laundry</span>'
        : '<span class="badge-status clean">✨ Clean</span>';

      const fitBadge = item.fit === 'tight'
        ? '<span class="badge-fit tight">Small</span>'
        : item.fit === 'loose'
        ? '<span class="badge-fit loose">Loose</span>'
        : '<span class="badge-fit">Fit</span>';

      card.innerHTML = `
        <div class="builder-item-thumb">
          <img src="${item.photo}" alt="${item.name}">
        </div>
        <div class="builder-item-name">${item.name}</div>
        <div class="builder-item-badge-row">
          ${statusBadge}
          ${fitBadge}
        </div>
      `;
      container.appendChild(card);
    });
  }

  function isItemSelectedInBuilder(item) {
    if (item.category === 'Tops' && state.builderSelection.top?.id === item.id) return true;
    if (item.category === 'Bottoms' && state.builderSelection.bottom?.id === item.id) return true;
    if (item.category === 'Shoes' && state.builderSelection.shoe?.id === item.id) return true;
    if (item.category === 'Accessories' && state.builderSelection.accessory?.id === item.id) return true;
    return false;
  }

  function selectBuilderItem(item) {
    if (item.category === 'Tops') state.builderSelection.top = item;
    if (item.category === 'Bottoms') state.builderSelection.bottom = item;
    if (item.category === 'Shoes') state.builderSelection.shoe = item;
    if (item.category === 'Accessories') state.builderSelection.accessory = item;

    if (item.condition === 'dirty') {
      showToast(`⚠️ Note: ${item.name} is in laundry, but we will still preview it!`);
    } else {
      showToast(`Added ${item.name} to look`);
    }

    renderBuilderGrid();
    updateBuilderTray();
  }

  function updateBuilderTray() {
    const tTop = document.getElementById('trayThumbTop');
    const lTop = document.getElementById('trayLabelTop');
    const tBot = document.getElementById('trayThumbBot');
    const lBot = document.getElementById('trayLabelBot');
    const tShoe = document.getElementById('trayThumbShoe');
    const lShoe = document.getElementById('trayLabelShoe');

    if (state.builderSelection.top) {
      if (tTop) tTop.src = state.builderSelection.top.photo;
      if (lTop) lTop.textContent = state.builderSelection.top.name;
    }
    if (state.builderSelection.bottom) {
      if (tBot) tBot.src = state.builderSelection.bottom.photo;
      if (lBot) lBot.textContent = state.builderSelection.bottom.name;
    }
    if (state.builderSelection.shoe) {
      if (tShoe) tShoe.src = state.builderSelection.shoe.photo;
      if (lShoe) lShoe.textContent = state.builderSelection.shoe.name;
    }
  }

  function resetBuilderSelections() {
    state.builderSelection = {
      top: WARDROBE_ITEMS[0],
      bottom: WARDROBE_ITEMS[1],
      shoe: WARDROBE_ITEMS[3],
      accessory: WARDROBE_ITEMS[9]
    };
    renderBuilderGrid();
    updateBuilderTray();
    showToast('Reset curated selections');
  }

  function previewCustomOutfitOnModel() {
    const selView = document.getElementById('builderSelectionView');
    const preView = document.getElementById('builderModelPreviewView');

    if (selView) selView.classList.add('hidden');
    if (preView) preView.classList.remove('hidden');

    // Dynamic model tryon mapping based on selections
    const modelImg = document.getElementById('builderPreviewModelImg');
    const topId = state.builderSelection.top?.id;
    if (modelImg) {
      if (topId === 'item_1') {
        modelImg.src = 'assets/model_tryon_navy.jpg'; // Navy shirt look
      } else if (topId === 'item_7') {
        modelImg.src = 'assets/model_tryon_linen.jpg'; // White linen look
      } else if (topId === 'item_3') {
        modelImg.src = 'assets/model_tryon_kurta.jpg'; // Kurta look
      } else if (topId === 'item_5') {
        modelImg.src = 'assets/model_tryon_maroon.jpg'; // Maroon look
      } else {
        modelImg.src = 'assets/model_tryon_navy.jpg';
      }
    }

    const cTop = document.getElementById('customThumbTop');
    const nTop = document.getElementById('customNameTop');
    const cBot = document.getElementById('customThumbBot');
    const nBot = document.getElementById('customNameBot');
    const cShoe = document.getElementById('customThumbShoe');
    const nShoe = document.getElementById('customNameShoe');

    if (cTop && state.builderSelection.top) cTop.src = state.builderSelection.top.photo;
    if (nTop && state.builderSelection.top) nTop.textContent = state.builderSelection.top.name;
    if (cBot && state.builderSelection.bottom) cBot.src = state.builderSelection.bottom.photo;
    if (nBot && state.builderSelection.bottom) nBot.textContent = state.builderSelection.bottom.name;
    if (cShoe && state.builderSelection.shoe) cShoe.src = state.builderSelection.shoe.photo;
    if (nShoe && state.builderSelection.shoe) nShoe.textContent = state.builderSelection.shoe.name;

    showToast('✨ Rendered custom outfit on model');
  }

  function backToBuilderSelection() {
    const selView = document.getElementById('builderSelectionView');
    const preView = document.getElementById('builderModelPreviewView');
    if (selView) selView.classList.remove('hidden');
    if (preView) preView.classList.add('hidden');
  }

  function confirmCustomOutfit() {
    const rTop = document.getElementById('readyImgTop');
    const rBot = document.getElementById('readyImgBot');
    const rShoe = document.getElementById('readyImgShoe');
    if (rTop && state.builderSelection.top) rTop.src = state.builderSelection.top.photo;
    if (rBot && state.builderSelection.bottom) rBot.src = state.builderSelection.bottom.photo;
    if (rShoe && state.builderSelection.shoe) rShoe.src = state.builderSelection.shoe.photo;

    showToast('✓ Custom outfit ready to wear!');
    goToScreen('outfit-ready');
  }

  // =========================================================================
  // 6. WARDROBE GRID & CONDITION (CLEAN / DIRTY / FIT) MANAGEMENT
  // =========================================================================
  function renderWardrobeGrid(category = state.wardrobeActiveCategory, query = '') {
    const container = document.getElementById('wardrobeCardsGrid');
    if (!container) return;

    let items = WARDROBE_ITEMS.slice();

    // Category Filter
    if (category === 'Clean') {
      items = items.filter(i => i.condition === 'clean');
    } else if (category === 'Laundry') {
      items = items.filter(i => i.condition === 'dirty');
    } else if (category && category !== 'All') {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }

    // Search Query Filter
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    container.innerHTML = '';
    items.forEach(item => {
      const box = document.createElement('div');
      box.className = 'wardrobe-item-box';

      const isClean = item.condition === 'clean';
      const statusBadge = isClean
        ? `<span class="badge-status clean" onclick="event.stopPropagation(); app.toggleItemCondition('${item.id}')" title="Tap to mark in laundry">✨ Clean</span>`
        : `<span class="badge-status dirty" onclick="event.stopPropagation(); app.toggleItemCondition('${item.id}')" title="Tap to mark clean">🧺 In Laundry</span>`;

      const fitBadge = item.fit === 'tight'
        ? `<span class="badge-fit tight">Tight</span>`
        : item.fit === 'loose'
        ? `<span class="badge-fit loose">Loose</span>`
        : `<span class="badge-fit">Perfect fit</span>`;

      box.innerHTML = `
        <div class="w-img-wrap" onclick="app.openConditionModal('${item.id}')">
          <img src="${item.photo}" alt="${item.name}">
        </div>
        <div class="w-meta" onclick="app.openConditionModal('${item.id}')">
          <div class="w-name">${item.name}</div>
          <div class="w-sub" style="display:flex; gap:4px; margin-top:4px; flex-wrap:wrap;">
            ${statusBadge}
            ${fitBadge}
          </div>
        </div>
        <button class="w-dots" onclick="event.stopPropagation(); app.openConditionModal('${item.id}')">⋮</button>
      `;

      container.appendChild(box);
    });

    updateWardrobeCounts();
  }

  function filterWardrobeCategory(cat, btn) {
    state.wardrobeActiveCategory = cat;
    if (btn) {
      document.querySelectorAll('#wardrobeCatFilter .cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    const searchInput = document.getElementById('wardrobeSearchInput');
    const query = searchInput ? searchInput.value : '';
    renderWardrobeGrid(cat, query);
  }

  function filterWardrobeGrid() {
    const searchInput = document.getElementById('wardrobeSearchInput');
    const query = searchInput ? searchInput.value : '';
    renderWardrobeGrid(state.wardrobeActiveCategory, query);
  }

  function updateWardrobeCounts() {
    const cleanCount = WARDROBE_ITEMS.filter(i => i.condition === 'clean').length;
    const dirtyCount = WARDROBE_ITEMS.filter(i => i.condition === 'dirty').length;

    const countLabel = document.getElementById('wardrobeCountLabel');
    if (countLabel) countLabel.textContent = `${WARDROBE_ITEMS.length} items`;

    const cleanEl = document.getElementById('wardrobeCleanCount');
    const dirtyEl = document.getElementById('wardrobeLaundryCount');
    if (cleanEl) cleanEl.textContent = cleanCount;
    if (dirtyEl) dirtyEl.textContent = dirtyCount;
  }

  function toggleItemCondition(itemId) {
    const item = WARDROBE_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (item.condition === 'clean') {
      item.condition = 'dirty';
      showToast(`🧺 Marked "${item.name}" as in laundry (excluded from outfits)`);
    } else {
      item.condition = 'clean';
      showToast(`✨ Marked "${item.name}" as clean & ready to style!`);
    }

    renderWardrobeGrid();
    updateStylistWardrobeStats();
  }

  function openConditionModal(itemId) {
    const item = WARDROBE_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    state.activeEditingItemId = itemId;
    state.modalCondition = item.condition;
    state.modalFit = item.fit;

    const modal = document.getElementById('itemConditionModal');
    const imgEl = document.getElementById('modalItemImg');
    const titleEl = document.getElementById('modalItemTitle');
    const catEl = document.getElementById('modalItemCat');

    if (imgEl) imgEl.src = item.photo;
    if (titleEl) titleEl.textContent = item.name;
    if (catEl) catEl.textContent = `${item.category} · ${item.fit.toUpperCase()}`;

    // Update active pills
    selectModalCondition(item.condition);
    selectModalFit(item.fit);

    if (modal) modal.classList.remove('hidden');
  }

  function closeConditionModal() {
    const modal = document.getElementById('itemConditionModal');
    if (modal) modal.classList.add('hidden');
    state.activeEditingItemId = null;
  }

  function selectModalCondition(cond) {
    state.modalCondition = cond;
    const btnClean = document.getElementById('btnCondClean');
    const btnDirty = document.getElementById('btnCondDirty');

    if (btnClean && btnDirty) {
      btnClean.classList.toggle('active', cond === 'clean');
      btnDirty.classList.toggle('active', cond === 'dirty');
    }
  }

  function selectModalFit(fit) {
    state.modalFit = fit;
    const btnTight = document.getElementById('btnFitTight');
    const btnPerfect = document.getElementById('btnFitPerfect');
    const btnLoose = document.getElementById('btnFitLoose');

    if (btnTight && btnPerfect && btnLoose) {
      btnTight.classList.toggle('active', fit === 'tight');
      btnPerfect.classList.toggle('active', fit === 'perfect');
      btnLoose.classList.toggle('active', fit === 'loose');
    }
  }

  function saveModalConditionChanges() {
    if (!state.activeEditingItemId) return;
    const item = WARDROBE_ITEMS.find(i => i.id === state.activeEditingItemId);
    if (item) {
      item.condition = state.modalCondition;
      item.fit = state.modalFit;
      showToast(`Updated "${item.name}": ${item.condition === 'clean' ? '✨ Clean' : '🧺 In Laundry'}, ${item.fit} fit`);
    }
    closeConditionModal();
    renderWardrobeGrid();
    updateStylistWardrobeStats();
  }

  // =========================================================================
  // 7. SWAP AN ITEM INTERACTION
  // =========================================================================
  function openSwapScreen(slot) {
    state.activeSwapSlot = slot;
    const title = document.getElementById('swapHeaderTitle');
    if (title) {
      if (slot === 'top') title.textContent = 'Choose a different top';
      else if (slot === 'bottom') title.textContent = 'Choose different trousers';
      else title.textContent = 'Choose different shoes';
    }
    goToScreen('swap-item');
  }

  function selectSwapOption(id, name, photo, cardEl) {
    document.querySelectorAll('#swapGrid .swap-card').forEach(c => {
      c.classList.remove('selected');
      const chk = c.querySelector('.choice-checkbox');
      if (chk) chk.classList.remove('checked');
    });
    cardEl.classList.add('selected');
    const chk = cardEl.querySelector('.choice-checkbox');
    if (chk) chk.classList.add('checked');

    state.selectedSwapChoice = { id, name, photo };
  }

  function confirmSwap() {
    const slot = state.activeSwapSlot;
    const choice = state.selectedSwapChoice;

    if (slot === 'footwear') {
      const qShoe = document.getElementById('quadImgShoe');
      const detShoe = document.getElementById('detImgShoe');
      const rowShoe = document.getElementById('rowThumbShoe');
      const rowName = document.getElementById('rowNameShoe');

      if (qShoe) qShoe.src = choice.photo;
      if (detShoe) detShoe.src = choice.photo;
      if (rowShoe) rowShoe.src = choice.photo;
      if (rowName) rowName.textContent = choice.name;
    }
    showToast(`Swapped ${slot} to ${choice.name}`);
    goToScreen('outfit-details');
  }

  // =========================================================================
  // 8. OUTFIT DECISION ACTIONS (MARK AS WORN / SAVE FOR LATER)
  // =========================================================================
  function markAsWorn() {
    state.wearHistoryCount++;
    showToast('✓ Great choice! Added to your wear history.');
    setTimeout(() => goToScreen('outfit-ready'), 600);
  }

  function saveForLater() {
    showToast('🔖 Saved outfit for your next occasion.');
    goToScreen('saved');
  }

  function toggleBookmarkCurrent() {
    const look = LOOKS_DATA[state.currentLookIndex];
    if (!look) return;
    if (state.savedBookmarks.has(look.id)) {
      state.savedBookmarks.delete(look.id);
      showToast('Removed outfit from saved looks');
    } else {
      state.savedBookmarks.add(look.id);
      showToast('🔖 Saved outfit to your collection');
    }
  }

  function toggleStyleChoice(cardEl) {
    cardEl.classList.toggle('selected');
    const check = cardEl.querySelector('.style-choice-checkbox');
    if (check) check.classList.toggle('checked');
  }

  function simulateUpload() {
    showToast('Analyzing your garment photo...');
    setTimeout(() => {
      goToScreen('review-item');
    }, 1200);
  }

  function saveReviewedItem() {
    showToast('✓ Navy shirt added to your wardrobe!');
    setTimeout(() => {
      goToScreen('today');
    }, 800);
  }

  // =========================================================================
  // 9. PROFILE, SETTINGS & UTILITIES
  // =========================================================================
  function selectPlan(planType) {
    state.currentPlan = planType;
    document.querySelectorAll('.pricing-option-card').forEach(card => card.classList.remove('selected'));
    const target = planType === 'annual' ? document.getElementById('planAnnual') : document.getElementById('planMonthly');
    if (target) target.classList.add('selected');
  }

  function activatePremium() {
    state.isPremium = true;
    showToast('🎉 Welcome to AURA Premium! All features unlocked.');
    setTimeout(() => goToScreen('today'), 800);
  }

  function saveReminderPreferences() {
    showToast('✓ Reminder preferences updated.');
    goToScreen('profile');
  }

  function exportWardrobe() {
    showToast('📦 Preparing wardrobe data package...');
    setTimeout(() => {
      showToast('✓ Export ready! 16 garments packaged.');
    }, 1000);
  }

  function deleteAccount() {
    goToScreen('delete-account');
  }

  function showHelpSupport() {
    goToScreen('help-support');
  }

  function rotateCropImage() {
    const img = document.getElementById('cropTargetImg');
    if (!img) return;
    const currentRot = parseInt(img.dataset.rotation || '0', 10);
    const nextRot = (currentRot + 90) % 360;
    img.dataset.rotation = nextRot;
    img.style.transform = `rotate(${nextRot}deg)`;
  }

  function setAspectRatio(ratio, btn) {
    document.querySelectorAll('.aspect-ratio-tabs .cat-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const container = document.getElementById('cropAspectBox');
    if (!container) return;
    if (ratio === '1:1') {
      container.style.width = '200px';
      container.style.height = '200px';
    } else if (ratio === '3:4') {
      container.style.width = '180px';
      container.style.height = '240px';
    } else if (ratio === '4:3') {
      container.style.width = '240px';
      container.style.height = '180px';
    } else {
      container.style.width = '210px';
      container.style.height = '210px';
    }
  }

  function setAvailability(status) {
    const lbl = document.getElementById('selectedAvailLabel');
    if (lbl) lbl.textContent = status;
    const menu = document.getElementById('availDropdownMenu');
    if (menu) menu.classList.add('hidden');
    document.querySelectorAll('.dropdown-popover-menu .dropdown-option').forEach(opt => {
      opt.classList.toggle('active', opt.textContent.includes(status));
    });
    showToast(`Garment availability marked as ${status}`);
  }

  function selectFeedbackOption(labelEl) {
    document.querySelectorAll('.feedback-radio-list .feedback-option').forEach(opt => opt.classList.remove('selected'));
    labelEl.classList.add('selected');
    const radio = labelEl.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }

  function retryUpload() {
    showToast('🔄 Retrying photo upload...');
    setTimeout(() => {
      showToast('✅ All wardrobe items uploaded successfully!');
      setTimeout(() => goToScreen('today'), 800);
    }, 1000);
  }

  function tryReconnect() {
    showToast('📶 Reconnecting to AURA Cloud...');
    setTimeout(() => {
      showToast('Online! Synchronizing latest suggestions.');
      goToScreen('today');
    }, 900);
  }

  function confirmDeleteAccount() {
    showToast('Account data deleted. Resetting to setup...');
    setTimeout(() => {
      goToScreen('welcome');
    }, 900);
  }

  // Toast Notification Helper
  function showToast(msg) {
    const toast = document.getElementById('toastPopup');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3200);
  }

  // =========================================================================
  // 10. INITIALIZATION
  // =========================================================================
  function init() {
    renderCurrentLook();
    renderWardrobeGrid();
    updateWardrobeCounts();
    goToScreen('welcome');
  }

  // Expose public API to window for inline HTML onclick handlers
  window.app = {
    goToScreen,
    setTodayCanvasMode,
    cycleLook,
    setTodayOccasion,
    openSwapScreen,
    selectSwapOption,
    confirmSwap,
    markAsWorn,
    saveForLater,
    toggleBookmarkCurrent,
    toggleStyleChoice,
    simulateUpload,
    saveReviewedItem,
    filterWardrobeCategory,
    filterWardrobeGrid,
    selectPlan,
    activatePremium,
    saveReminderPreferences,
    exportWardrobe,
    deleteAccount,
    showHelpSupport,
    rotateCropImage,
    setAspectRatio,
    setAvailability,
    selectFeedbackOption,
    retryUpload,
    tryReconnect,
    confirmDeleteAccount,

    // AI Stylist API
    selectStylistOption,
    generateStylistOutfit,
    regenerateAIOutfit,
    cycleStylistOption,
    confirmStylistOutfit,
    resetStylistQuestionnaire,
    setStylistViewMode,

    // Custom Builder API
    setBuilderTab,
    selectBuilderItem,
    resetBuilderSelections,
    previewCustomOutfitOnModel,
    confirmCustomOutfit,
    backToBuilderSelection,

    // Wardrobe Condition & Fit API
    toggleItemCondition,
    openConditionModal,
    closeConditionModal,
    selectModalCondition,
    selectModalFit,
    saveModalConditionChanges
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
