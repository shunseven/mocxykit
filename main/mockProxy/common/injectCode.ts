interface InjectCodeOptions {
  configPath: string;
  lang: string;
  buttonPosition: string;
}


export const getInjectCode = (options: InjectCodeOptions) => {
  const buttonStyles = getButtonStyles(options.buttonPosition);
  const buttonText = options.lang === 'en' ? 'Proxy & Mock Config' : 'proxy&mock配置';
  return `
  <style>
    #proxy-mock-btn {
      position: fixed;
      z-index: 9999;
      padding: 8px 16px;
      background: #1890ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      ${buttonStyles}
    }
    #proxy-mock-iframe {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 95%;
      height: 95%;
      z-index: 10000;
      border: none;
      box-shadow: 0 0 20px rgba(0,0,0,0.2);
      background: white;
    }
    #proxy-mock-mask {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    }
  </style>
  <button id="proxy-mock-btn">${buttonText}</button>
  <div id="proxy-mock-mask"></div>
  <iframe id="proxy-mock-iframe"></iframe>
  <script>
    (function(){
      const btn = document.getElementById('proxy-mock-btn');
      const iframe = document.getElementById('proxy-mock-iframe');
      const mask = document.getElementById('proxy-mock-mask');
      
      btn.addEventListener('click', () => {
        iframe.src = '${options.configPath}';
        iframe.style.display = 'block';
        mask.style.display = 'block';
      });
      
      mask.addEventListener('click', () => {
        iframe.style.display = 'none';
        mask.style.display = 'none';
        iframe.src = '';
      });
    })();
  </script>
`
}

export function getButtonStyles(position: string): string {
  if (position.includes(',')) {
    const [x, y] = position.split(',').map(n => parseInt(n.trim()));
    return `left: ${x}px; top: ${y}px;`;
  }
  
  switch (position) {
    case 'top':
      return 'right: 20px; top: 20px;';
    case 'middle':
      return 'right: 20px; top: 50%; transform: translateY(-50%);';
    case 'bottom':
      return 'right: 20px; bottom: 20px;';
    default:
      return 'right: 20px; top: 50%; transform: translateY(-50%);';
  }
}