// behaviors/fade.js
module.exports = Behavior({
  data: {
    fadeClass: ''
  },
  methods: {
    applyFadeEnter() {
      this.setData({ fadeClass: 'fade-enter' });
    },
    applyFadeLeaveThen(callback, delay = 500) {
      this.setData({ fadeClass: 'fade-leave' });
      if (typeof callback === 'function') {
        setTimeout(callback, delay);
      }
    }
  }
});
