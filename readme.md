# 查询 12306.cn 网站的高铁票项目

## 项目定义

### 项目名称：查询 12306.cn 网站的高铁票

### 项目目标：使用 Playwright 自动查询 12306.cn 网站的高铁票，然后找出 5 张时间最短的票

### 目标MVP 功能：

+ 自动打开网页：https://www.12306.cn/index/
+ 自动输入“出发地”、“到达地”和“出发日期”
+ 把查询出来的车票，保存在 json 格式文件里面
+ 在查询出来的车票中，找出时间最短的 5 张票

---

# 快速开始（适合普通工程师）

## 一、环境要求

- Node.js 16 及以上版本（建议 LTS 版本）
- npm（Node.js 自带）
- 推荐操作系统：macOS、Linux、Windows 10+

## 二、依赖安装

在项目根目录下执行：

```bash
npm install
```

## 三、运行项目

1. 确保已安装依赖（见上）。
2. 运行主程序：

```bash
npx ts-node src/index.ts
```

> 首次运行 Playwright 会自动下载浏览器驱动，需联网。

## 四、功能说明

- 自动打开 12306 官网，自动输入“上海”到“北京”的高铁票查询。
- 自动点击查询，自动在新窗口跳转到结果页。
- 自动提取所有车票信息，保存到 `data/tickets.json`。
- 自动筛选出时间最短的 5 张车票，保存到 `data/top5.json`。

## 五、结果文件说明

- `data/tickets.json`：所有查询到的车票详细信息（结构化 JSON）。
- `data/top5.json`：时间最短的 5 张车票（结构化 JSON）。

## 六、常见问题

1. **浏览器未弹出/报错**：请确保本地网络畅通，Node.js 版本符合要求。
2. **数据为空**：请确认查询日期有票，或更换日期重试。
3. **12306 页面结构变化**：如遇页面大改，需调整 `src/index.ts` 里的选择器和解析逻辑。

## 七、依赖组件

- [playwright](https://playwright.dev/)：自动化浏览器操作
- typescript：类型安全开发
- ts-node：直接运行 TypeScript 脚本
- @types/node：Node.js 类型声明

## 八、扩展说明

- 如需查询其他城市或日期，请修改 `src/index.ts` 里的 FROM、TO、DATE 变量。
- 如需采集更多字段（如余票、席别、票价等），可扩展 `tickets` 的解析逻辑。

---

如有问题请联系本项目维护者。

# 技术栈选择

## 框架：需要用到playright ，使用 Typescript 编程语言

## 技术实现要求：先要调用playright mcp 访问网页：https://www.12306.cn/index/ ，找到你需要的“出发地”、“到达地”和“出发日期”元素和“查询”按钮元素