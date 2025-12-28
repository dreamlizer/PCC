function applyCommonCloudFunctionError(page, err) {
  const errMsg = err && err.errMsg ? String(err.errMsg) : '';

  if (errMsg.includes('Environment not found')) {
    page.setData({
      showTip: true,
      title: '云开发环境未找到',
      content: '如果已经开通云开发，请检查环境ID与 `miniprogram/app.js` 中的 `env` 参数是否一致。',
    });
    return true;
  }

  if (errMsg.includes('FunctionName parameter could not be found')) {
    page.setData({
      showTip: true,
      title: '请上传云函数',
      content: "在'cloudfunctions/quickstartFunctions'目录右键，选择【上传并部署-云端安装依赖】，等待云函数上传完成后重试。",
    });
    return true;
  }

  return false;
}

module.exports = {
  applyCommonCloudFunctionError,
};

