// Language Switcher JavaScript
// Multi-language support for KFrost Portfolio Site

// Default translations (fallback)
let translations = {
  ja: {
    nav: {
      home: "ホーム",
      career: "キャリア詳細"
    },
    content: {
      lastUpdated: "最終更新:"
    },
    footer: {
      copyright: "All rights reserved."
    }
  },
  en: {
    nav: {
      home: "Home",
      career: "Career Details"
    },
    content: {
      lastUpdated: "Last Updated:"
    },
    footer: {
      copyright: "All rights reserved."
    }
  }
};

// Load translations from JSON file (with fallback)
async function loadTranslations() {
  try {
    const response = await fetch('/KFrost533/assets/js/translations/common.json');
    if (response.ok) {
      const loadedTranslations = await response.json();
      translations = { ...translations, ...loadedTranslations };
      console.log('✅ Translations loaded from external file');
    } else {
      console.log('⚠️ External translations not found, using fallback');
    }
  } catch (error) {
    console.log('⚠️ Failed to load external translations, using fallback:', error.message);
  }
}

// Merge page-specific translations (for pages with custom content)
function mergePageTranslations(pageTranslations) {
  if (pageTranslations && typeof pageTranslations === 'object') {
    Object.keys(pageTranslations).forEach(lang => {
      if (translations[lang]) {
        translations[lang] = { ...translations[lang], ...pageTranslations[lang] };
      } else {
        translations[lang] = pageTranslations[lang];
      }
    });
    console.log('📄 Page-specific translations merged');
  }
}

// Retrieve saved language or default to Japanese
let currentLang = localStorage.getItem('language') || 'ja';

// Language switch function
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  
  // HTML lang element update
  document.documentElement.lang = lang;
  
  // Update translations for elements with data-i18n attribute
  updateTranslations();
  
  // Update active button display
  updateActiveLanguageButton();
  
  // Animation for language switch
  const switcher = document.querySelector('.language-switcher');
  if (switcher) {
    switcher.style.transform = 'scale(0.9)';
    setTimeout(() => {
      switcher.style.transform = 'scale(1)';
    }, 100);
  }
}

// Update translations for elements with data-i18n attribute
function updateTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getTranslationByKey(key, currentLang);
    
    if (translation) {
      element.textContent = translation;
    }
  });
}

// Get translation by key
function getTranslationByKey(key, lang) {
  const keys = key.split('.');
  let translation = translations[lang];
  
  for (const k of keys) {
    if (translation && translation[k]) {
      translation = translation[k];
    } else {
      return null;
    }
  }
  
  return translation;
}

// Update active language button display
function updateActiveLanguageButton() {
  const buttons = document.querySelectorAll('.lang-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    const lang = btn.getAttribute('onclick')?.match(/'(.+)'/)?.[1];
    if (lang === currentLang) {
      btn.classList.add('active');
    }
  });
}

// Initialize language switcher on DOM load
document.addEventListener('DOMContentLoaded', async function() {
  // Load external translations first
  await loadTranslations();
  
  // Check if page has custom translations (set by page)
  if (typeof window.pageTranslations !== 'undefined') {
    mergePageTranslations(window.pageTranslations);
  }
  
  // Apply saved language settings
  switchLanguage(currentLang);
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Make functions globally available
window.switchLanguage = switchLanguage;
window.mergePageTranslations = mergePageTranslations;