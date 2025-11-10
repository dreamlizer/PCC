// 使用 miniprogram-ci 进行云函数部署的替代方案
// 需要准备：
// 1) 在微信公众平台开发者工具中导出项目私钥文件（*.key），将路径配置到 PRIVATE_KEY_PATH
// 2) 确保当前账号对云环境 cloud1-8gay4zt288916e1c 有“云开发管理员”权限
// 3) 已在云开发控制台预先创建 pccFramework / pccQuestions 两个云函数

const path = require('path');
const ci = require('miniprogram-ci');

// 请按实际路径修改为你的私钥文件路径
const PRIVATE_KEY_PATH = path.resolve(__dirname, '../.private/app.key');
const PROJECT_PATH = path.resolve(__dirname, '..');
const APPID = 'wx210a8ba1f85b5f8d';
const ENV_ID = 'cloud1-8gay4zt288916e1c';

async function main() {
  const project = new ci.Project({
    appid: APPID,
    type: 'miniProgram',
    projectPath: PROJECT_PATH,
    privateKeyPath: PRIVATE_KEY_PATH,
    ignores: ['node_modules/**/*'],
  });

  const functions = [
    {
      name: 'pccFramework',
      dir: path.resolve(PROJECT_PATH, 'cloudfunctions/pccFramework'),
    },
    {
      name: 'pccQuestions',
      dir: path.resolve(PROJECT_PATH, 'cloudfunctions/pccQuestions'),
    },
  ];

  for (const f of functions) {
    console.log(`开始上传云函数: ${f.name}`);
    const result = await ci.cloud.uploadFunction({
      project,
      env: ENV_ID,
      name: f.name,
      path: f.dir,
      // 关闭云端安装依赖，改为本地已安装后上传全部文件
      remoteNpmInstall: false,
      // includeFiles 不设置时默认上传所在文件夹全部文件
    });
    console.log(`上传完成: ${f.name}`, result);
  }
}

main().catch((err) => {
  console.error('上传云函数失败: ', err);
  process.exit(1);
});