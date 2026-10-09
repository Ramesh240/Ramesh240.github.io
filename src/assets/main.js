// Flip cards: a button flips the card, the hidden face is made inert,
// and focus moves to the button on the newly visible face.
(function () {
  var cards = document.querySelectorAll('.flip');
  Array.prototype.forEach.call(cards, function (card) {
    var front = card.querySelector('.face.front');
    var back = card.querySelector('.face.back');
    if (!front || !back) return;

    function sync() {
      var flipped = card.getAttribute('data-flipped') === 'true';
      front.inert = flipped;
      back.inert = !flipped;
      front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
      back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
    }

    sync();

    Array.prototype.forEach.call(card.querySelectorAll('[data-flip]'), function (btn) {
      btn.addEventListener('click', function () {
        var flipped = card.getAttribute('data-flipped') === 'true';
        card.setAttribute('data-flipped', flipped ? 'false' : 'true');
        sync();
        var target = (flipped ? front : back).querySelector('[data-flip]');
        if (target) target.focus({ preventScroll: true });
      });
    });
  });
})();
