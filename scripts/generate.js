const xlsx = require('xlsx')
const {
  debuglog
} = require('util');
const {
  isRegExp
} = require('util').types;
const log = debuglog('REPORT');
const COL_SPLITER = '┋';

// 获取结构化数据
const wb = xlsx.readFile('./2021-report.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const list = xlsx.utils.sheet_to_json(sheet);

log(JSON.stringify(list, null, 2));

function formatDataMap(data, xkeys, keys) {
  const list = [];
  for (const k of keys) {
    let key = k;
    if (isRegExp(k)) {
      key = k.toString().replace(/[/^]/g, '');
    }

    const item = {};
    for (const xkey of xkeys) {
      const step = data[xkey];
      if (item[xkey] === undefined) {
        item[xkey] = 0;
      }
      if (step[key]) {
        item[xkey] += step[key];
      }
    }
    item.key = key;
    list.push(item);
  }
  return list;
}

function signleAnalysis(axis) {
  const results = {};
  for (const person of list) {
    const cols = person[axis].split(COL_SPLITER);
    for (const col of cols) {
      if (!results[col]) {
        results[col] = 0;
      }
      results[col]++;
    }
  }
  return results;
}

function formatData(map, xAxisList, yAxisList) {
  const result = [];
  result.push(['product', ...xAxisList]);
  for (const ykey of yAxisList) {
    const records = [];
    if (isRegExp(ykey)) {
      const key = ykey.toString().replace(/[/^]/g, '');
      records.push(key)
    } else {
      records.push(ykey)
    }
    for (const xkey of xAxisList) {
      const data = map[xkey];
      if (!data) {
        console.log(xkey, 'no data')
        continue;
      }
      // { "to b 应用": 37, "内部运营系统": 32, "to c 应用": 36, "自动化工具": 21, "其他〖to G〗": 1, "其他〖博客〗": 1, "其他": 5 }
      if (isRegExp(ykey)) {
        const keys = Object.keys(data);
        const list = keys.filter((key) => ykey.test(key));
        records.push(list.reduce((sum, key) => sum + data[key], 0));
      } else {
        records.push(data[ykey]);
      }
    }
    result.push(records);
  }
  return result
}

function twoDimensionalAnalysis(xHeader, yHeader) {
  const groupByX = list.reduce((map, item) => {
    if (!Array.isArray(map[item[xHeader]])) {
      map[item[xHeader]] = [];
    }
    map[item[xHeader]].push(item);
    return map;
  }, {});
  // got { xH1, xH2, xH3, ... }

  const xKeys = Object.keys(groupByX);
  const toRes = {};
  for (const key of xKeys) {
    const xList = groupByX[key];
    const yRes = {};
    for (const person of xList) {
      const cols = person[yHeader].split(COL_SPLITER);
      for (const col of cols) {
        yRes[col] ? ++yRes[col] : yRes[col] = 1;
      }
    }
    toRes[key] = yRes;
  }

  log(JSON.stringify(toRes, null, 2));
  return toRes;
}

// 应用场景
console.log('# 应用场景')
const senceRes = twoDimensionalAnalysis('21、所在公司规模', '25、主要使用 Node.js 开发的项目类型?')
const senceData = formatData(
  senceRes, ['1人', '2-10人', '11-50人', '51-500人', '501-1000人', '1001-5000人', '大于 5000人'], [
    "to c 应用",
    "to b 应用",
    "内部运营系统",
    "自动化工具",
    /^其他/
  ]
)
console.log(senceData);

// 开发场景
console.log('# 开发场景')
const depRes = twoDimensionalAnalysis('1、使用 Node.js 的时间', '24、使用 Node.js 开发的场景')
const depData = formatData(
  depRes, ['0~1 年', '1~3 年', '3~5 年', '5~10年'], [
    'Web API',
    'BFF 层',
    'Proxy 层',
    'CLI & 工具',
    '定时任务',
    'SSR 应用',
    '微服务',
    '其他',
    /代码片段/,
  ]
)
console.log(depData);

// 代码转译
console.log('# 代码转译')
const transRes = twoDimensionalAnalysis('1、使用 Node.js 的时间', '6、开发中常用的转译语言 (Transpilers)')
const transData = formatData(
  transRes, ['0~1 年', '1~3 年', '3~5 年', '5~10年'], [
    'TypeScript',
    'Babel',
    '不转译',
    'Dart',
    'ClojureScript',
    'Haxe',
    /其他/,
  ]
)
console.log(transData);

// 代码检查
console.log('# 代码检查')
const lintData = formatData(
  twoDimensionalAnalysis('22、使用同技术栈的团队规模', '5、常用的代码检查工具'), ['1人', '2-7人', '8-12人', '13-20人', '21-40人', '40-100人', '大于100人'], [
    'ESLint',
    'TSLint',
    'JSDoc',
    'Standard',
    'JSHint',
    /其他/,
    'JSCS',
    'Flow',
  ]
)
console.log(lintData);

// 配置方式
console.log('配置方式');
const cfgData = signleAnalysis('13、Node.js 应用配置管理方式');
console.log(cfgData);
console.log(lintData);

// 开发工具
console.log('开发工具');
const toolData = signleAnalysis('14、常用的开发工具是');
console.log(toolData);

// 进程管理
console.log('# 进程管理')
const processData = formatDataMap(
  twoDimensionalAnalysis('21、所在公司规模', '11、生产环境中 Node.js 进程管理方式(限选 2 项)'), [
    '1人',
    '2-10人',
    '11-50人',
    '51-500人',
    '501-1000人',
    '1001-5000人',
    '大于 5000人'
  ], [
    'PM2',
    'Docker',
    'k8s',
    'Serverless',
    'supervisor (Node)',
    'forever',
    /其他/,
    'Supervisord (Unix)',
    'naught'
  ]
)
console.log(processData);

// 部署环境
console.log('部署环境');
const deployData = signleAnalysis('10、生产环境中 Node.js 应用部署环境');
console.log(deployData);

// Web 框架
console.log('# Web 框架')
const frameworkData = formatDataMap(
  twoDimensionalAnalysis('1、使用 Node.js 的时间', '7、常用的 web 框架是?(限选 3 项)'), ['0~1 年', '1~3 年', '3~5 年', '5~10年'], [
    'Koa.js',
    'Express.js',
    'Egg.js',
    'Nest.js',
    'Midway.js',
    'Next.js',
    'Nuxt.js',
    'Fastify.js',
    'Restify.js',
    'Loopback.io',
    'Hapi.js',
    'Sails.js',
    /其他/
  ]
)
console.log(frameworkData);

// 数据库
console.log('# 数据库')
console.log(formatDataMap(
  twoDimensionalAnalysis('1、使用 Node.js 的时间', '8、主要使用的数据库是(限选 3 项)'), ['0~1 年', '1~3 年', '3~5 年', '5~10年'], [
    'MySQL',
    'Redis',
    'MongoDB',
    'PostgreSQL',
    'SQLite',
    'SQL Server',
    '自研',
    'TiDB',
    'Oracle',
    'HBASE',
    'DB2',
    'Influxdb',
    /其他/
  ]
))

// 反向代理
console.log('# 反向代理')
console.log(formatDataMap(
  twoDimensionalAnalysis('21、所在公司规模', '9、与 Node.js 应用配合使用的反向代理'), ['1人', '2-10人', '11-50人', '51-500人', '501-1000人', '1001-5000人', '大于 5000人'], [
    'Nginx',
    '不使用反向代理',
    '云中间件',
    'Envoy',
    'Apache',
    'Tomcat',
    'Linkerd',
    /其他/
  ]
))

// RPC
console.log('# RPC')
console.log(formatDataMap(
  twoDimensionalAnalysis('21、所在公司规模', '12、Node.js 应用中使用的 RPC 组件'), ['1人', '2-10人', '11-50人', '51-500人', '501-1000人', '1001-5000人', '大于 5000人'], [
    'HTTP',
    '消息队列',
    'gRPC',
    '不使用 RPC',
    '自研 RPC 协议',
    'dubbo',
    /其他/,
    'Thrift',
  ]
))



// Node 版本
console.log('Node 版本');
console.log(signleAnalysis('2、生产环境使用的 Node.js 版本(单选)'));

// 依赖管理
console.log('# 依赖管理')
console.log(formatDataMap(
  twoDimensionalAnalysis('1、使用 Node.js 的时间', '16、使用的依赖管理工具'), ['0~1 年', '1~3 年', '3~5 年', '5~10年'], [
    'npm',
    'yarn',
    'cnpm',
    'pnpm',
    'bower',
    'Duo',
    'JSPM',
    /其他/,

  ]
))

// NPM 镜像
console.log('NPM 镜像');
console.log(signleAnalysis('17、是否有意识的使用 NPM 镜像?(单选)'));

// 学习途径
console.log('# 学习途径')
console.log(formatDataMap(
  twoDimensionalAnalysis('19、从业经验(单选)', '26、技术知识学习途径'), ['小于 1 年',
    '1 到 3 年',
    '3 到 5 年',
    '5 到 10 年',
    '大于 10 年'
  ], [
    '开源代码 (Github, NPM 等)',
    '技术社区（掘金，segmentfault 等）',
    '博客 & 期刊 (Node Weekly 等)',
    '搜索引擎',
    '书籍',
    '视频教程 (无指导)',
    '在线课程',
    '公司',
    '线下活动',
    /其他/,

  ]
))

// 使用困惑
console.log('# 使用困惑')
console.log(formatDataMap(
  twoDimensionalAnalysis('1、使用 Node.js 的时间', '27、开发中最困惑地方是?'), ['0~1 年', '1~3 年', '3~5 年', '5~10年'], [
    '性能优化',
    '内存泄漏',
    'node_modules 依赖',
    '错误提示',
    'Debug',
    '事件驱动',
    '异步编程',
    /其他/,
  ]
))

// 资源需求
console.log('# 资源需求')
console.log(formatDataMap(
  twoDimensionalAnalysis('1、使用 Node.js 的时间', '28、在学习交流过程中期待更多什么类型的资源?'), ['0~1 年', '1~3 年', '3~5 年', '5~10年'], [
    '文档',
    '实战案例',
    '技术博主',
    '教程视频',
    '免费在线课程',
    '线下沙龙分享',
    '大会演讲视频',
    '线下编码活动',
    '大会活动',
    /其他/,
  ]
))

// 未来关键字
console.log('# 未来关键字')
console.log(formatDataMap(
  twoDimensionalAnalysis('19、从业经验(单选)', '30、比较关注的与 Node.js 相关的未来新技术是?'), ['小于 1 年',
    '1 到 3 年',
    '3 到 5 年',
    '5 到 10 年',
    '大于 10 年'
  ], [
    '多线程',
    'Serverless',
    'WebAssembly System Interface',
    'Async Hooks',
    'Deno',
    'N-API',
    'Code cache & AOT',
    /其他/,

  ]
))

// 生态期望
console.log('# 生态期望')
console.log(formatDataMap(
  twoDimensionalAnalysis('1、使用 Node.js 的时间', '29、对 Node.js 生态的期望'), ['0~1 年', '1~3 年', '3~5 年', '5~10年'], [
    '更好的性能',
    '更高的开发效率',
    '更容易维护',
    '更多的人参与',
    '更低的学习成本',
    /其他/,
  ]
))
