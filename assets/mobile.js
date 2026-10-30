/* Use the already saved portrait video on phones; keep the desktop source intact. */
(function () {
  var media = window.matchMedia('(max-width: 767px)');
  function init() {
    var hero = document.getElementById('comp-mfm9dnps1_video');
    var portrait = document.getElementById('comp-mgcccqn6_video');
    if (!hero || !portrait) return;
    var desktopSource = hero.getAttribute('src');
    var phoneSource = portrait.getAttribute('src');
    function update() {
      var source = media.matches ? phoneSource : desktopSource;
      var videos = [hero].concat([].slice.call(hero.parentElement.querySelectorAll('.tk-vclone')));
      videos.forEach(function (video) {
        if (video.getAttribute('src') === source) return;
        video.setAttribute('src', source);
        video.load();
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () {});
      });
    }
    update();
    media.addEventListener('change', update);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
