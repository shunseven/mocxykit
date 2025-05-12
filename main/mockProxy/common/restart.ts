/**
 * 重启辅助脚本 (TypeScript 版本)
 * 这个脚本提供了一个用于重启 Node.js 应用的函数
 */

import { spawn } from 'child_process';

// 存储原始启动命令的顶级变量
let originalCommand = '';

/**
 * 尝试获取当前运行的脚本命令
 * @returns {string} 当前运行的npm脚本命令或默认命令
 */
function detectCurrentCommand(): string {
  // 方法1: 从process.env.npm_lifecycle_event获取npm脚本名称
  if (process.env.npm_lifecycle_event) {
    return `npm run ${process.env.npm_lifecycle_event}`;
  }
  
  // 方法2: 从process.argv分析运行命令
  const args = process.argv.slice(1);
  const npmIndex = args.findIndex(arg => arg.includes('npm'));
  
  if (npmIndex >= 0 && args[npmIndex + 1] === 'run' && args[npmIndex + 2]) {
    return `npm run ${args[npmIndex + 2]}`;
  }
  
  // 默认命令
  return 'npm run dev';
}

// 在模块加载时检测并缓存原始命令
originalCommand = detectCurrentCommand();
console.log('检测到的运行命令:', originalCommand);

/**
 * 重启当前的 Node.js 应用
 * 
 * @param {object} options - 配置选项
 * @param {number} options.exitDelay - 退出当前进程前的延迟时间（毫秒）
 * @param {Function} options.beforeExit - 退出前执行的回调函数
 * @returns {boolean} 重启是否成功
 */
export function restartApp(options: { exitDelay?: number; beforeExit?: () => void } = {}): boolean {
  const { exitDelay = 300, beforeExit } = options;
  
  console.log('准备重启应用，使用命令:', originalCommand);
  
  try {
    // 解析命令和参数
    const [cmd, ...args] = originalCommand.split(' ');
    const npmCmd = process.platform === 'win32' ? `${cmd}.cmd` : cmd;
    
    // 创建一个重启进程，它将在当前进程结束后执行
    const restarter = spawn(
      npmCmd, 
      args,
      {
        detached: true, // 使子进程独立于父进程
        stdio: 'inherit', // 共享父进程的标准输入输出
        env: process.env, // 传递当前的环境变量
        cwd: process.cwd() // 使用当前工作目录
      }
    );
    
    // 让子进程独立运行
    restarter.unref();
    
    // 如果有退出前的回调，执行它
    if (typeof beforeExit === 'function') {
      beforeExit();
    }
    
    // 在短暂延迟后退出当前进程
    setTimeout(() => {
      console.log('正在退出当前进程...');
      process.exit(0);
    }, exitDelay);
    
    return true;
  } catch (error) {
    console.error('重启过程发生错误:', error);
    return false;
  }
}
