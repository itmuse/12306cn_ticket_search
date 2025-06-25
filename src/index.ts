import { chromium, Page, Frame } from 'playwright';
import fs from 'fs';

// 配置参数
const FROM = '上海';
const TO = '北京';
const DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1); // 明天
  return d.toISOString().split('T')[0];
})();

// 工具函数：将历时字符串转为分钟数（如 "5小时12分" => 312）
function durationToMinutes(duration: string): number {
  const hourMatch = duration.match(/(\d+)小时/);
  const minMatch = duration.match(/(\d+)分/);
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
  return hours * 60 + mins;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.12306.cn/index/');

  // 1. 输入出发地
  await page.click('#fromStationText');
  await page.fill('#fromStationText', '');
  await page.type('#fromStationText', 'shanghai', { delay: 100 });
  await page.waitForTimeout(500);
  let fromValue = '';
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    fromValue = await page.$eval('#fromStationText', el => (el as HTMLInputElement).value);
    if (fromValue === FROM) {
      await page.keyboard.press('Enter');
      break;
    }
  }
  if (fromValue !== FROM) throw new Error('未能选中上海主站，实际为：' + fromValue);
  await page.waitForTimeout(300);
  console.log('出发地实际输入：', fromValue);

  // 2. 输入到达地
  await page.click('#toStationText');
  await page.fill('#toStationText', '');
  await page.type('#toStationText', 'beijing', { delay: 100 });
  await page.waitForTimeout(500);
  let toValue = '';
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    toValue = await page.$eval('#toStationText', el => (el as HTMLInputElement).value);
    if (toValue === TO) {
      await page.keyboard.press('Enter');
      break;
    }
  }
  if (toValue !== TO) throw new Error('未能选中北京主站，实际为：' + toValue);
  await page.waitForTimeout(300);
  console.log('到达地实际输入：', toValue);

  // 3. 输入出发日期
  await page.click('#train_date');
  await page.fill('#train_date', DATE);
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  // 关闭日历弹窗，点击页面空白处
  await page.click('body', { position: { x: 0, y: 0 } });
  await page.waitForTimeout(200);

  // 4. 点击查询按钮
  await page.click('#search_one');

  // 5. 查询后等待新页面打开
  const resultPage = await context.waitForEvent('page');
  await resultPage.waitForLoadState('domcontentloaded');

  // 强制跳转到用户指定的查询结果页面，确保页面内容一致
  await resultPage.goto('https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=%E4%B8%8A%E6%B5%B7,SHH&ts=%E5%8C%97%E4%BA%AC,BJP&date=2025-06-26&flag=N,N,Y');
  await resultPage.waitForLoadState('domcontentloaded');

  // 6. 在新页面等待车票表格加载
  await resultPage.waitForSelector('tbody#queryLeftTable > tr', { timeout: 60000 });

  // 调试：输出所有行的内容
  const allRows = await resultPage.$$eval('tbody#queryLeftTable > tr', rows =>
    rows.map(row => ({
      attrs: row.getAttributeNames().reduce((acc, name) => ({ ...acc, [name]: row.getAttribute(name) }), {}),
      text: (row as HTMLElement).innerText
    }))
  );
  console.log('所有表格行内容：', JSON.stringify(allRows, null, 2));

  // 7. 提取所有车票信息（只保留有 datatran 或 data-train 的行，直接用 innerText 拆分）
  const tickets = await resultPage.$$eval('tbody#queryLeftTable > tr', (rows: Element[]) => {
    return rows
      .filter(row => row.hasAttribute('datatran') || row.hasAttribute('data-train'))
      .map(row => {
        const text = (row as HTMLElement).innerText;
        const parts = text.split(/\n|\t/).map(s => s.trim()).filter(Boolean);
        return {
          trainNo: parts[0] || '',
          trainType: parts[1] || '',
          departStation: parts[2] || '',
          arriveStation: parts[3] || '',
          departTime: parts[4] || '',
          arriveTime: parts[5] || '',
          duration: parts[6] || '',
          raw: parts
        };
      });
  });

  // 8. 过滤无效数据
  const validTickets = tickets.filter((t: any) => t.trainNo && t.duration);

  // 9. 按历时排序，取前5
  const sorted = validTickets.sort((a: any, b: any) => durationToMinutes(a.duration) - durationToMinutes(b.duration));
  const top5 = sorted.slice(0, 5);

  // 10. 保存所有车票信息
  fs.writeFileSync('data/tickets.json', JSON.stringify(validTickets, null, 2), 'utf-8');
  fs.writeFileSync('data/top5.json', JSON.stringify(top5, null, 2), 'utf-8');

  console.log('已保存所有车票信息到 data/tickets.json');
  console.log('已保存时间最短的5张票到 data/top5.json');

  await browser.close();
})(); 