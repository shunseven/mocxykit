import fs from 'fs';
import path from 'path';

// MCP配置接口
export interface McpConfig {
  open: boolean;
  editors: string[];
  port: number;
}

// 编辑器配置接口
export interface EditorConfig {
  editor: string;
  path: string;
}

// 默认MCP配置
const defaultMcpConfig: McpConfig = {
  open: false,
  editors: ['cursor'],
  port: 3200
};

// 支持的编辑器配置
export const supportedEditors: EditorConfig[] = [
  { editor: 'cursor', path: '.cursor/mcp.json' },
  { editor: 'windsurf', path: '.windsurf/mcp.json' } // 暂不支持，但保留配置
];

// 获取项目根路径
function getProjectRootPath(): string {
  return process.cwd();
}

// MCP配置文件路径
const mcpConfigPath = path.join(getProjectRootPath(), 'proxyMockData', 'mcpConfig.json');

// 获取MCP配置
export function getMcpConfig(): McpConfig {
  try {
    if (fs.existsSync(mcpConfigPath)) {
      const configData = fs.readFileSync(mcpConfigPath, 'utf-8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('读取MCP配置失败:', error);
  }
  
  // 如果配置不存在或读取失败，返回默认配置
  return { ...defaultMcpConfig };
}

// 保存MCP配置
export function saveMcpConfig(config: McpConfig): void {
  try {
    const dirPath = path.dirname(mcpConfigPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('保存MCP配置失败:', error);
  }
}

// 创建编辑器MCP配置文件
export function createEditorMcpConfig(editor: string, port: number): void {
  const editorConfig = supportedEditors.find(e => e.editor === editor);
  if (!editorConfig) return;

  try {
    const projectRoot = getProjectRootPath();
    const configPath = path.join(projectRoot, editorConfig.path);
    const configDir = path.dirname(configPath);
    
    // 创建目录（如果不存在）
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 检查文件是否已存在
    let existingConfig: any = {};
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        existingConfig = JSON.parse(fileContent);
      } catch (err) {
        console.error(`读取现有配置文件失败: ${configPath}`, err);
      }
    }
    
    // 更新或添加配置
    if (!existingConfig.mcpServers) {
      existingConfig.mcpServers = {};
    }
    
    existingConfig.mcpServers["sample-project-server"] = {
      url: `http://localhost:${port}/sse`
    };
    
    fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
    console.log(`已更新 ${editor} MCP配置文件: ${configPath}`);
  } catch (error) {
    console.error(`创建/更新 ${editor} MCP配置文件失败:`, error);
  }
}

// 删除编辑器MCP配置中的特定服务器配置
export function deleteEditorMcpConfig(editor: string): void {
  const editorConfig = supportedEditors.find(e => e.editor === editor);
  if (!editorConfig) return;

  try {
    const projectRoot = getProjectRootPath();
    const configPath = path.join(projectRoot, editorConfig.path);
    
    if (fs.existsSync(configPath)) {
      try {
        // 读取现有配置
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(fileContent);
        
        // 如果存在mcpServers配置
        if (config.mcpServers && config.mcpServers["sample-project-server"]) {
          // 删除特定的服务器配置
          delete config.mcpServers["sample-project-server"];
          
          // 如果mcpServers为空对象，则删除整个mcpServers属性
          if (Object.keys(config.mcpServers).length === 0) {
            delete config.mcpServers;
          }
          
          // 如果配置文件变为空对象，则删除整个文件
          if (Object.keys(config).length === 0) {
            fs.unlinkSync(configPath);
            console.log(`已删除空的 ${editor} MCP配置文件: ${configPath}`);
          } else {
            // 否则，保存更新后的配置
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`已从 ${editor} MCP配置文件中移除服务器配置: ${configPath}`);
          }
        } else {
          console.log(`${editor} MCP配置文件中没有找到目标服务器配置: ${configPath}`);
        }
      } catch (err) {
        console.error(`处理 ${editor} MCP配置文件失败:`, err);
      }
    } else {
      console.log(`${editor} MCP配置文件不存在: ${configPath}`);
    }
  } catch (error) {
    console.error(`删除 ${editor} MCP配置文件中的服务器配置失败:`, error);
  }
} 