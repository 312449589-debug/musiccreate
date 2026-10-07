/* 部署时修改此文件。音乐服务商密钥只能保存在后端。 */
window.XIANBAN_CONFIG = {
  apiBaseUrl: '/api/v1',
  // 切换账号时应由身份适配层更新 storageScope，并重新加载页面。
  storageScope: 'default',
  // 由已确定的登录流程提供用户访问 token；匿名部署返回 null。
  getAccessToken: async () => null,
  onUnauthorized: () => {
    window.dispatchEvent(new CustomEvent('xianban:unauthorized'));
  }
};
