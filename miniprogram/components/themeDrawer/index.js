Component({
  properties: {
    visible: { type: Boolean, value: false },
    themes: { type: Array, value: [] },
    activeId: { type: String, value: '' }
  },
  methods: {
    noop() {},
    close() { this.triggerEvent('close'); },
    select(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('select', { id });
    }
  }
});