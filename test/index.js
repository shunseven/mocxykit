console.log('环境变量内容:', process.env);
console.log('代理配置:', window.__PROXY_MOCK_CONFIG__);
console.log('开始检查配置...');

function initConfig() {
    // 如果配置还未定义，使用默认配置
    if (typeof window.__PROXY_MOCK_CONFIG__ === 'undefined') {
        console.warn('Config not found, using webpack defined config');
        window.__PROXY_MOCK_CONFIG__ = __PROXY_MOCK_CONFIG__;
    }
}

// 立即执行初始化
initConfig();

console.log('配置状态:', {
    configExists: typeof window.__PROXY_MOCK_CONFIG__ !== 'undefined',
    configValue: window.__PROXY_MOCK_CONFIG__
});

function checkConfig() {
    console.log('当前配置状态:', {
        configExists: typeof window.__PROXY_MOCK_CONFIG__ !== 'undefined',
        configValue: window.__PROXY_MOCK_CONFIG__
    });
    
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        if (window.__PROXY_MOCK_CONFIG__) {
            resultDiv.textContent = JSON.stringify(window.__PROXY_MOCK_CONFIG__, null, 2);
        } else {
            resultDiv.textContent = '配置未加载 - ' + new Date().toISOString();
        }
    }
}

// 页面加载完成后检查
document.addEventListener('DOMContentLoaded', checkConfig);

// 显示到页面
document.addEventListener('DOMContentLoaded', () => {
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <h3>配置信息</h3>
            <pre>${JSON.stringify(window.__PROXY_MOCK_CONFIG__, null, 2)}</pre>
        `;
    }
});

// 延迟检查
setTimeout(checkConfig, 100);
setTimeout(checkConfig, 500);