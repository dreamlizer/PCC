function insertRecord() {
  this.setData({
    showInsertModal: true,
    insertRegion: '',
    insertCity: '',
    insertSales: '',
  });
}

function deleteRecord(e) {
  wx.showLoading({ title: '删除中...' });
  wx.cloud
    .callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'deleteRecord',
        data: { _id: e.currentTarget.dataset.id },
      },
    })
    .then(() => {
      wx.showToast({ title: '删除成功' });
      this.getRecord();
      wx.hideLoading();
    })
    .catch(() => {
      wx.showToast({ title: '删除失败', icon: 'none' });
      wx.hideLoading();
    });
}

function onInsertRegionInput(e) {
  this.setData({ insertRegion: e.detail.value });
}

function onInsertCityInput(e) {
  this.setData({ insertCity: e.detail.value });
}

function onInsertSalesInput(e) {
  this.setData({ insertSales: e.detail.value });
}

function onInsertCancel() {
  this.setData({ showInsertModal: false });
}

async function onInsertConfirm() {
  const { insertRegion, insertCity, insertSales } = this.data;
  if (!insertRegion || !insertCity || !insertSales) {
    wx.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }

  wx.showLoading({ title: '插入中...' });
  try {
    await wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'insertRecord',
        data: {
          region: insertRegion,
          city: insertCity,
          sales: Number(insertSales),
        },
      },
    });
    wx.showToast({ title: '插入成功' });
    this.setData({ showInsertModal: false });
    this.getRecord();
  } catch (_) {
    wx.showToast({ title: '插入失败', icon: 'none' });
  } finally {
    wx.hideLoading();
  }
}

function bindInput(e) {
  const index = e.currentTarget.dataset.index;
  const record = this.data.record;
  record[index].sales = Number(e.detail.value);
  this.setData({ record });
}

function getRecord() {
  wx.showLoading({ title: '' });
  wx.cloud
    .callFunction({
      name: 'quickstartFunctions',
      data: { type: 'selectRecord' },
    })
    .then((resp) => {
      this.setData({
        haveGetRecord: true,
        record: resp.result.data,
      });
      wx.hideLoading();
    })
    .catch(() => {
      this.setData({ showTip: true });
      wx.hideLoading();
    });
}

function clearRecord() {
  this.setData({
    haveGetRecord: false,
    record: [],
  });
}

function updateRecord() {
  wx.showLoading({ title: '' });
  wx.cloud
    .callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'updateRecord',
        data: this.data.record,
      },
    })
    .then(() => {
      wx.showToast({ title: '更新成功' });
      wx.hideLoading();
    })
    .catch(() => {
      this.setData({ showTip: true });
      wx.hideLoading();
    });
}

module.exports = {
  insertRecord,
  deleteRecord,
  onInsertRegionInput,
  onInsertCityInput,
  onInsertSalesInput,
  onInsertCancel,
  onInsertConfirm,
  bindInput,
  getRecord,
  clearRecord,
  updateRecord,
};

