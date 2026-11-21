(function () {
  var theme = 'light';

  try {
    var raw = window.localStorage.getItem('webmili:prefs:v1');
    var prefs = raw ? JSON.parse(raw) : null;
    var saved = prefs && typeof prefs === 'object' ? prefs.theme : null;

    if (saved === 'light' || saved === 'dark') {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
  } catch (error) {
    // El almacenamiento o el JSON pueden ser inválidos; se usa el tema del sistema.
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
      }
    } catch (matchError) {
      theme = 'light';
    }
  }

  document.documentElement.setAttribute('data-theme', theme);

  var themeColorMeta = document.querySelector('meta[name="theme-color"]');

  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', theme === 'dark' ? '#181d1a' : '#fbf8f1');
  }
})();
