const { UPLOAD_FILE_CODE } = require('./snippets');

function uploadImg() {
  wx.showLoading({ title: '' });

  wx.chooseMedia({
    count: 1,
    success: (chooseResult) => {
      wx.cloud
        .uploadFile({
          cloudPath: `my-photo-${new Date().getTime()}.png`,
          filePath: chooseResult.tempFiles[0].tempFilePath,
        })
        .then((res) => {
          this.setData({
            haveGetImgSrc: true,
            imgSrc: res.fileID,
          });
        })
        .catch(() => {});
    },
    complete: () => {
      wx.hideLoading();
    },
  });
}

function clearImgSrc() {
  this.setData({
    haveGetImgSrc: false,
    imgSrc: '',
  });
}

function getUploadFileCode() {
  this.setData({
    callUploadFileCode: UPLOAD_FILE_CODE,
  });
}

module.exports = {
  uploadImg,
  clearImgSrc,
  getUploadFileCode,
};

