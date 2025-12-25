Component({
  properties: {
    theme: { type: Object, value: null },
    title: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    rightText: { type: String, value: '' },
    rightDisabled: { type: Boolean, value: false },
    showAccent: { type: Boolean, value: true }
  },
  methods: {
    onRightTap() {
      if (this.properties.rightDisabled) return;
      this.triggerEvent('right');
    }
  }
});
