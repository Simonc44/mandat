window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'wait_for_update': 500
});
gtag('config', 'G-CMMWPQG5P6');
(function() {
  try {
    var saved = localStorage.getItem('mandat_analytics_consent');
    if (saved === 'granted') {
      gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }
  } catch(e) {}
})();
