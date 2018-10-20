import Logline from 'logline'
import {DateTime} from 'luxon'
import * as _ from "lodash"
$ = window.$ = window.jQuery = require('jquery')

Logline.using(Logline.PROTOCOL.INDEXEDDB)

var logger = {}

var mLoginUrl = "https://wqs.jd.com/my/indexv2.shtml"
var priceProUrl = "https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu"
var priceProPage = null

let jobs = [
  {
    id: '1',
    src: priceProUrl,
    title: '价格保护',
    mode: 'iframe',
    type: 'm',
    frequency: '5h'
  },
  {
    id: '3',
    src: 'https://plus.m.jd.com/index',
    title: 'PLUS券',
    mode: 'iframe',
    type: 'm',
    frequency: '5h'
  },
  {
    id: '4',
    src: 'https://m.jr.jd.com/mjractivity/rn/couponCenter/index.html?RN=couponCenter&tab=20',
    title: '领白条券',
    mode: 'iframe',
    type: 'm',
    frequency: '5h'
  },
  {
    id: '5',
    src: 'https://vip.m.jd.com/page/signin',
    title: '京东会员签到',
    mode: 'iframe',
    key: "vip",
    type: 'm',
    checkin: true,
    frequency: 'daily'
  },
  {
    id: '6',
    src: 'https://m.jr.jd.com/spe/qyy/main/index.html?userType=41',
    title: '金融钢镚签到',
    key: "jr-qyy",
    mode: 'iframe',
    type: 'm',
    checkin: true,
    frequency: 'daily'
  },
  {
    id: '7',
    src: 'https://bean.jd.com/myJingBean/list',
    title: '店铺签到',
    mode: 'tab',
    type: 'pc',
    frequency: 'never'
  },
  {
    id: '9',
    src: 'https://vip.jr.jd.com',
    title: '京东金融会员签到',
    key: "jr-index",
    checkin: true,
    mode: 'iframe',
    type: 'pc',
    frequency: 'daily'
  },
  {
    id: '11',
    src: 'https://bean.m.jd.com',
    title: '移动端京豆签到',
    key: "bean",
    checkin: true,
    mode: 'iframe',
    type: 'm',
    frequency: 'daily'
  },
  {
    id: '12',
    src: 'https://ljd.m.jd.com/countersign/index.action',
    title: '双签礼包',
    key: "double_check",
    mode: 'iframe',
    type: 'm',
    frequency: 'daily'
  },
  {
    id: '14',
    src: 'https://coin.jd.com/m/gb/index.html',
    title: '钢镚签到',
    key: "coin",
    checkin: true,
    mode: 'iframe',
    type: 'm',
    frequency: 'daily'
  },
  {
    id: '15',
    src: 'https://jjb.zaoshu.so/event/coupon',
    title: '全品类券',
    schedule: [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
    mode: 'iframe',
    type: 'pc',
    frequency: '2h'
  },
]

function getSetting(settingKey) {
  let setting = localStorage.getItem(settingKey)
  try {
    setting = JSON.parse(setting)
  } catch (error) {}
  return setting
}

// 会员礼包
// https://vip.m.jd.com/page/gift/list


let mapFrequency = {
  '2h': 2 * 60,
  '5h': 5 * 60,
  'daily': 24 * 60,
  'never': 99999
}

// 设置默认频率
_.forEach(jobs, (job) => {
  let frequency = getSetting('job' + job.id + '_frequency')
  if (!frequency) {
    localStorage.setItem('job' + job.id + '_frequency', job.frequency)
  }
})

// This is to remove X-Frame-Options header, if present
chrome.webRequest.onHeadersReceived.addListener(
  function(info) {
    var headers = info.responseHeaders;
    for (var i=headers.length-1; i>=0; --i) {
      var header = headers[i].name.toLowerCase();
      if (header == 'x-frame-options' || header == 'frame-options') {
          headers.splice(i, 1); // Remove header
      }
    }
    return {responseHeaders: headers};
  },
  {
      urls: ['*://*.jd.com/*', '*://*.jd.hk/*'], //
      types: ['sub_frame']
  },
  ['blocking', 'responseHeaders']
);

chrome.runtime.onInstalled.addListener(function (object) {
  var installed = localStorage.getItem('jjb_installed')
  if (installed) {
    console.log("已经安装")
  } else {
    localStorage.setItem('jjb_installed', 'Y');
    localStorage.setItem('jjb_admission-test', 'N');
    chrome.tabs.create({url: "/start.html"}, function (tab) {
      console.log("京价保安装成功！");
    });
  }
});

// use iPhone as USER AGENT
var iPhone_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/10.2 Mobile/15E148 Safari/604.1';
chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (details.requestHeaders[i].name === 'User-Agent') {
        details.requestHeaders[i].value = iPhone_USER_AGENT;
        break;
      }
    }
    return {
      requestHeaders: details.requestHeaders
    };
  }, {
    urls: ["*://*.m.jd.com/*", "*://m.jr.jd.com/*"]
  }, ['blocking', 'requestHeaders']);


// 判断浏览器
try {
  browser.runtime.getBrowserInfo().then(function (browserInfo) {
    localStorage.setItem('browserName', browserInfo.name);
  })
} catch (error) {}


// 阻止打开京东金融App的代码
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url == "https://m.jr.jd.com/statics/downloadApp/newdl/newdl.js")
      return {
        cancel: (details.url.indexOf("://m.jr.jd.com/") != -1)
      };
  }, {
    urls: ["*://m.jr.jd.com/*", "*://m.jd.com/*"]
  }, ["blocking"]);

chrome.alarms.onAlarm.addListener(function( alarm ) {
  log('background', "onAlarm", alarm)
  var jobId = alarm.name.split('_')[1]
  switch(true){
    // 计划任务
    case alarm.name.startsWith('runScheduleJob'):
      runJob(jobId, true)
      break;
    // 定时任务
    case alarm.name.startsWith('runJob'):
      runJob(jobId)
      break;
    // 周期运行（10分钟）
    case alarm.name == 'cycleTask':
      clearPinnedTabs()
      findJobs()
      runJob()
      break;
    case alarm.name.startsWith('clearIframe'):
      let iframeId = jobId || 'iframe'
      // 销毁掉 
      resetIframe(iframeId)
      break;
    case alarm.name.startsWith('closeTab'):
      try {
        chrome.tabs.get(jobId, (tab) => {
          if (tab) {
            chrome.tabs.remove(tab.id)
          }
        })
      } catch (e) {}
      break;
    case alarm.name == 'reload':
      chrome.runtime.reload()
      chrome.alarms.clearAll()
      // 保留3天内的log
      Logline.keep(3);
      break;
  }
})

// 保存任务栈
function saveJobStack(jobStack) {
  jobStack = _.uniq(jobStack)
  localStorage.setItem('jobStack', JSON.stringify(jobStack));
}

function getJobs() {
  return _.map(jobs, (job) => {
    var job_run_last_time = localStorage.getItem('job' + job.id + '_lasttime')
    job.last_run_at = job_run_last_time ? parseInt(job_run_last_time) : null
    job.frequency = getSetting('job' + job.id + '_frequency') || job.frequency
    // 如果是签到任务，则读取签到状态
    if (job.checkin) {
      let checkinRecord = localStorage.getItem('jjb_checkin_' + job.key) ? JSON.parse(localStorage.getItem('jjb_checkin_' + job.key)) : null
      if (checkinRecord && checkinRecord.date == DateTime.local().toFormat("o")) {
        job.checkinState = true
      }
    }
    return job
  })
}

// 寻找乔布斯
function findJobs() {
  let jobStack = localStorage.getItem('jobStack') ? JSON.parse(localStorage.getItem('jobStack')) : []
  let jobList = getJobs()
  let loginState = getLoginState()
  jobList.forEach(function(job) {
    if (loginState[job.type].state != 'alive') {
      return console.log(job.title, '由于账号未登录已暂停运行')
    }
    switch(job.frequency){
      case '2h':
        // 如果从没运行过，或者上次运行已经过去超过2小时，那么需要运行
        if (!job.last_run_at || (DateTime.local() > DateTime.fromMillis(job.last_run_at).plus({ hours: 2 }))) {
          jobStack.push(job.id)
        }
        break;
      case '5h':
        // 如果从没运行过，或者上次运行已经过去超过5小时，那么需要运行
        if (!job.last_run_at || (DateTime.local() > DateTime.fromMillis(job.last_run_at).plus({ hours: 5 }))) {
          jobStack.push(job.id)
        }
        break;
      case 'daily':
        // 如果从没运行过，或者上次运行不在今天，或者是签到任务但未完成
        if (!job.last_run_at || !(DateTime.local().hasSame(DateTime.fromMillis(job.last_run_at), 'day')) || (job.checkin && !job.checkinState)) {
          jobStack.push(job.id)
        }
        break;
      default:
        console.log('ok, never run ', job.title)
    }
  });
  saveJobStack(jobStack)
}

function rand(n){
  return (Math.floor(Math.random() * n + 1));
}

function log(type, message, details) {
  if (logger[type]) {
    logger[type](message, details)
  } else {
    logger[type] = new Logline(type)
    console.log(type, message, details)
  }
}

function resetIframe(domId) {
  $("#" + domId).remove();
  let iframeDom = `<iframe id="${domId}" width="400 px" height="600 px" src=""></iframe>`;
  $('body').append(iframeDom);
}

// 执行组织交给我的任务
function runJob(jobId, force = false) {
  // 不在凌晨阶段运行非强制任务
  if (DateTime.local().hour < 6 && !force) {
    return console.log('Silent Night')
  }
  log('background', "run job", {
    jobId: jobId,
    force: force
  })
  // 如果没有指定任务ID 就从任务栈里面找一个
  if (!jobId) {
    var jobStack = localStorage.getItem('jobStack') ? JSON.parse(localStorage.getItem('jobStack')) : []
    if (jobStack && jobStack.length > 0) {
      var jobId = jobStack.shift();
      saveJobStack(jobStack)
    } else {
      return log('info', '好像没有什么事需要我做...')
    }
  }
  var jobList = getJobs()
  var job = _.find(jobList, {id: jobId})
  // 检查登录状态
  let loginState = getLoginState()
  if (loginState[job.type].state != 'alive' && !force) {
    return log('job', job.title, '由于账号未登录已暂停运行')
  }
  if (job && (job.frequency != 'never' || force)) {
    // 如果不是强制运行，且任务有时间安排，则把任务安排到最近的下一个时段
    if (!force && job.schedule) {
      for (var i = 0, len = job.schedule.length; i < len; i++) {
        let hour = DateTime.local().hour;
        let scheduledHour = job.schedule[i]
        if (scheduledHour > hour) {
          let scheduledTime = DateTime.local().set({
            hour: scheduledHour, 
            minute: rand(5), 
            second: rand(55)
          }).valueOf()
          chrome.alarms.create('runScheduleJob_' + job.id, {
            when: scheduledTime
          })
          return log('background', "schedule job created", {
            job: job,
            time: scheduledHour,
            when: scheduledTime
          })
        }
      }
      // 如果当前已经过了最晚的运行时段，则放弃运行
      return log('background', "pass schedule job", {
        job: job
      })
    }
    log('background', "run", job)
    if (job.mode == 'iframe') {
      openByIframe(job.src, 'job')
    } else {
      chrome.tabs.create({
        index: 1,
        url: job.src,
        active: false,
        pinned: true
      }, function (tab) {
        // 将标签页静音
        chrome.tabs.update(tab.id, {
          muted: true
        }, function (result) {
          log('background', "muted tab", result)
        })
        // if (job.touch) {
        //   attachDebugger(tab)
        // }
        chrome.alarms.create('closeTab_'+tab.id, {delayInMinutes: 3})
      })
    }
  }

}

function openByIframe(src, type) {
  // 加载新的任务
  let iframeId = "iframe"
  if (type == 'temporary') {
    iframeId = 'iframe_' + rand(10241024)
  }
  resetIframe(iframeId)
  $("#" + iframeId).attr('src', src)
  // 10 分钟后清理 iframe
  chrome.alarms.create('clearIframe_' + iframeId, {
    delayInMinutes: 10
  })
}

function updateUnreadCount(change = 0) {
  let lastUnreadCount = localStorage.getItem('unreadCount') || 0
  let unreadCount = parseInt(Number(lastUnreadCount) + change)
  if (unreadCount < 0) {
    unreadCount = 0
  }
  localStorage.setItem('unreadCount', unreadCount);
  if (unreadCount > 0) {
    let unreadCountText = unreadCount.toString()
    if (unreadCount > 100) {
      unreadCountText = '99+'
    }
    chrome.browserAction.setBadgeText({ text: unreadCountText });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#4caf50" });
  } else {
    chrome.browserAction.setBadgeText({ text: "" });
  }
}



$( document ).ready(function() {
  log('background', "document ready")
  // 每10分钟运行一次定时任务
  chrome.alarms.create('cycleTask', {
    periodInMinutes: 10
  })

  // 每600分钟完全重载
  chrome.alarms.create('reload', {periodInMinutes: 600})

  // 载入后马上运行一次任务查找
  findJobs()

  // 载入显示未读数量
  updateUnreadCount()

  // 总是安全的访问京东
  var force_https = getSetting('force_https')
  if (force_https && force_https == 'checked') {
    chrome.tabs.onCreated.addListener(function (tab){
      forceHttps(tab)
    })
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      if (changeInfo.url) {
        forceHttps(tab)
      }
    })
  }
})


function openWebPageAsMoblie(url) {
  chrome.windows.create({
    width: 420,
    height: 800,
    url: url,
    type: "popup"
  });
}

// force ssl
function forceHttps(tab) {
  if (tab && tab.url && _.startsWith(tab.url, 'http://') && tab.url.indexOf('jd.com') !== -1) {
    chrome.tabs.update(tab.id, {
      url: tab.url.replace(/^http:\/\//i, 'https://')
    }, function () {
      console.log('force ssl jd.com')
    })
  }
}

// 清除不需要的tab
function clearPinnedTabs() {
  chrome.tabs.query({
    pinned: true
  }, function (tabs) {
    var tabIds = $.map(tabs, function (tab) {
      if (tab && tab.url.indexOf('jd.com') !== -1) {
        return tab.id
      }
    })

    // opera doesn't remove pinned tabs, so lets first unpin
    $.map(tabIds, function (tabId) {
        chrome.tabs.update(tabId, {"pinned":false}, function(theTab){ chrome.tabs.remove(theTab.id); });
    })
  })
}

// 点击通知
chrome.notifications.onClicked.addListener(function (notificationId) {
  if (notificationId.split('_').length > 0) {
    let batch = notificationId.split('_')[1]
    let type = notificationId.split('_')[2]
    if (batch && batch.length > 1) {
      switch (batch) {
        case 'baitiao':
          chrome.tabs.create({
            url: "https://vip.jr.jd.com/coupon/myCoupons?default=IOU"
          })
          break;
        case 'bean':
          chrome.tabs.create({
            url: "http://bean.jd.com/myJingBean/list"
          })
          break;
        case 'jiabao':
          openWebPageAsMoblie(priceProUrl)
          break;
        case 'login-failed':
          if (type == 'pc') {
            chrome.tabs.create({
              url: "https://passport.jd.com/uc/login"
            })
          } else {
            openWebPageAsMoblie(mLoginUrl)
          }
          break;
        default:
          if (batch && batch != 'undefined' && type == 'coupon') {
            chrome.tabs.create({
              url: "https://search.jd.com/Search?coupon_batch=" + batch
            })
          } else {
            chrome.tabs.create({
              url: "https://zaoshu.so/coupon"
            })
          }
      }
    }
  }
})

// 按钮点击
chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
  if (notificationId.split('_').length > 0) {
    let batch = notificationId.split('_')[1]
    let type = notificationId.split('_')[2]
    if (batch != 'login-failed') {
      return
    }
    switch (type) {
      case 'pc':
        if (buttonIndex == 0) {
          chrome.tabs.create({
            url: "https://passport.jd.com/uc/login"
          })
        }
        break;
      case 'm':
        if (buttonIndex == 0) {
          openWebPageAsMoblie(mLoginUrl)
        }
        break;
      default:
        chrome.tabs.create({
          url: "https://zaoshu.so/coupon"
        })
    }
  }
})

function getLoginState() {
  let loginState = {
    pc: localStorage.getItem('jjb_login-state_pc') ? JSON.parse(localStorage.getItem('jjb_login-state_pc')) : {
      state: "unknown"
    },
    m: localStorage.getItem('jjb_login-state_m') ? JSON.parse(localStorage.getItem('jjb_login-state_m')) : {
      state: "unknown"
    },
    class: "unknown"
  }
  // 处理登录状态
  if (loginState.m.state == 'alive') {
    loginState.class = "alive"
    if (loginState.pc.state != 'alive') {
      loginState.class = "warning"
    }
  } else {
    loginState.class = "failed"
  }
  return loginState
}


function saveLoginState(state) {
  if (state.state == 'alive') {
    chrome.browserAction.getBadgeText({}, function (text){
      if (text == "X") {
        chrome.browserAction.setBadgeText({
          text: ""
        });
        chrome.browserAction.setTitle({
          title: "京价保"
        })
      }
    })
  }
  localStorage.setItem('jjb_login-state_' + state.type, JSON.stringify({
    time: new Date(),
    message: state.content || state.message,
    state: state.state
  }));
  chrome.runtime.sendMessage({
    action: "loginState_updated",
    data:state
  });
}

// 浏览器通知（合并）
// mute_night
function sendChromeNotification(id, content) {
  let hour = DateTime.local().hour;
  let muteNight = getSetting('mute_night');
  if (muteNight && hour < 6) {
    log('background', 'mute_night', content);
  } else {
    chrome.notifications.create(id, content)
    log('message', id, content);
  }
}

function getPriceProtectionSetting() {
  let isPlus = getSetting('jjb_plus');
  let pro_min = getSetting('price_pro_min');
  let days = getSetting('price_pro_days')
  let is_plus = (getSetting('is_plus') ? getSetting('is_plus') == 'checked' : false ) || (isPlus == 'Y')
  let prompt_only = getSetting('prompt_only') ? getSetting('prompt_only') == 'checked' : false
  return {
    pro_days: days ? Number(days) : 15,
    pro_min: pro_min ? Number(pro_min) : 0.1,
    prompt_only,
    is_plus
  }
}

// 外部消息
chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendResponse) {
  console.log('onMessageExternal', msg)
  switch (msg.text) {
    case 'disablePriceChart':
      localStorage.setItem('disable_pricechart', JSON.stringify("checked"));
      return sendResponse("done")
      break;
  }
  // 如果消息 300ms 未被回复
  return true
});


// 报告价格
function reportPrice(sku, price, plus_price, pingou_price) {
  $.ajax({
    method: "POST",
    type: "POST",
    url: "https://jjb.zaoshu.so/price",
    data: {
      sku: sku,
      price: Number(price),
      plus_price: plus_price ? Number(plus_price) : null,
      pingou_price: pingou_price ? Number(pingou_price) : null,
    },
    timeout: 3000,
    dataType: "json"
  })
}

// 消息
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (!msg.action) {
    msg.action = msg.text
  }
  switch(msg.action){
    // 获取移动页商品价格
    case 'getProductPrice':
      let url = `https://item.m.jd.com/product/${msg.sku}.html`
      priceProPage = sender
      openByIframe(url, 'temporary')
      sendResponse({
        working: true
      })
      break;
    // 通知商品价格
    case 'productPrice':
      // 当前有价保页面
      if (priceProPage && priceProPage.tab) {
        chrome.tabs.sendMessage(priceProPage.tab.id, {
          action: 'productPrice',
          setting: getPriceProtectionSetting(),
          ...msg
        }, {
          frameId: priceProPage.frameId
        }, function (response) {
          console.log('productPrice response', response)
        })
      }
      // 价格追踪
      let disable_pricechart = (getSetting('disable_pricechart') ? getSetting('disable_pricechart') == 'checked' : false)
      if (disable_pricechart && msg.sku && msg.price) {
        reportPrice(msg.sku, msg.price, msg.plus_price, msg.pingou_price)
      }
      sendResponse({
        done: true
      })
      break;
    case 'loginState':
      saveLoginState(msg)
      break;
    case 'disablePriceChart':
      localStorage.setItem('disable_pricechart', JSON.stringify("checked"));
      return sendResponse("done")
      break;
    case 'getLoginState': 
      loginState = getLoginState()
      return sendResponse(loginState)
      break;
    case 'isPlus':
      localStorage.setItem('jjb_plus', 'Y');
      break;
    case 'disablePriceChart':
      localStorage.setItem('disable_pricechart', JSON.stringify("checked"));
      return sendResponse("done")
      break;
    case 'checkPermissions':
      chrome.permissions.contains({
        permissions: [msg.permissions],
      }, function (result) {
        return sendResponse({
          granted: result
        });
      });
      break;
    case 'requestPermissions':
      chrome.permissions.request({
        permissions: [msg.permissions],
      },  function (granted) {
        return sendResponse({
          granted: granted
        })
      });
      break;
    case 'getPriceProtectionSetting':
      let priceProtectionSetting = getPriceProtectionSetting()
      return sendResponse(priceProtectionSetting)
      break;
    case 'saveAccount':
      var content = JSON.parse(msg.content)
      if (content.username && content.password) {
        localStorage.setItem('jjb_account', msg.content);
      }
      break;
    // 获取设置
    case 'getSetting':
      let setting = getSetting(msg.content)
      let temporarySetting = localStorage.getItem('temporary_' + msg.content)
      // 如果存在临时设置
      if (temporarySetting) {
        // 临时设置2分钟失效
        setTimeout(() => {
          localStorage.removeItem('temporary_' + msg.content)
        }, 60*2*1000);
        return sendResponse(temporarySetting)
      }
      return sendResponse(setting)
      break;
    case 'getAccount':
      let account = localStorage.getItem('jjb_account') ? JSON.parse(localStorage.getItem('jjb_account')) : null
      let loginTypeState = localStorage.getItem('jjb_login-state_' + msg.type) ? JSON.parse(localStorage.getItem('jjb_login-state_' + msg.type)) : {}
      // 如果有 loginTypeState
      if (account && loginTypeState && loginTypeState.time) {
        loginTypeState.displayTime = DateTime.fromISO(loginTypeState.time).setLocale('zh-cn').toFormat('f')
        account.loginState = loginTypeState
      }
      return sendResponse(account)
      break;
    case 'paid':
      localStorage.setItem('jjb_paid', 'Y');
      sendChromeNotification(new Date().getTime().toString(), {
        type: "basic",
        title: "谢谢老板",
        message: "我会努力签到、领券、申请价格保护来回报你的",
        iconUrl: 'static/image/128.png'
      })
      break;
    case 'openLogin':
      loginState = getLoginState()
      if (loginState.class == 'failed') {
        openWebPageAsMoblie(mLoginUrl)
      } else {
        chrome.tabs.create({
          url: "https://passport.jd.com/uc/login"
        })
      }
      break;
    case 'openUrlAsMoblie':
      openWebPageAsMoblie(msg.url)
      break;
    case 'openPricePro':
      openWebPageAsMoblie(priceProUrl)
      break;
    // 登录失败
    case 'loginFailed':
      let loginErrMsg = (msg.type == 'pc' ? 'PC网页版' : '移动网页版') + "自动登录失败：" + msg.content
      chrome.browserAction.setBadgeBackgroundColor({
        color: [190, 190, 190, 230]
      });
      chrome.browserAction.setBadgeText({
        text: "X"
      });
      chrome.browserAction.setTitle({
        title: loginErrMsg
      })
      localStorage.setItem('jjb_login-state_' + msg.type, JSON.stringify({
        time: new Date(),
        message: msg.content,
        state: "failed"
      }));
      if (msg.notice) {
        sendChromeNotification(new Date().getTime().toString() + "_login-failed_" + msg.type, {
          type: "basic",
          title: loginErrMsg,
          message: "请点击本通知手动完成登录",
          iconUrl: 'static/image/128.png',
          buttons: [
            {
              "title": "现在登录"
            }
          ]
        })
      }
      break;
    case 'option':
      localStorage.setItem('jjb_'+msg.title, msg.content);
      break;
    // 手动运行任务
    case 'runJob':
      var jobId = msg.content.split('job')[1]
      var jobList = getJobs()
      var job = _.find(jobList, {id: jobId})
      // set 临时运行
      localStorage.setItem('temporary_job' + jobId + '_frequency', 'onetime');
      runJob(jobId, true)
      sendChromeNotification(new Date().getTime().toString(), {
        type: "basic",
        title: "正在重新运行" + job.title,
        message: "任务运行大约需要2分钟，如果有情况我再叫你（请勿连续运行）",
        iconUrl: 'static/image/128.png'
      })
      sendResponse({
        result: true
      })
      break;
   
    case 'notice':
      var play_audio = getSetting('play_audio')
      if (msg.batch == 'jiabao') {
        var hide_good = getSetting('hide_good')
        if (play_audio && play_audio == 'checked' || msg.test) {
          var myAudio = new Audio();
          myAudio.src = "static/audio/price_protection.ogg";
          myAudio.play();
        }
        if (!hide_good || hide_good != 'checked') {
          msg.content = (msg.product_name ? msg.product_name.substr(0, 22) : '') + msg.content
        }
      }
      if (msg.batch == 'rebate') {
        if (play_audio && play_audio == 'checked' || msg.test) {
          var myAudio = new Audio();
          myAudio.src = "static/audio/rebate.ogg";
          myAudio.play();
        }
      }
      let icon = 'static/image/128.png'
      if (msg.batch == 'rebate') {
        icon = 'static/image/rebate.png'
      }
      if (msg.batch == 'jiabao') {
        icon = 'static/image/money.png'
      }
      sendChromeNotification(new Date().getTime().toString() + '_' + msg.batch, {
        type: "basic",
        title: msg.title,
        message: msg.content,
        iconUrl: icon
      })
      break;
    case 'checkin_notice':
      var mute_checkin = getSetting('mute_checkin')
      if (mute_checkin && mute_checkin == 'checked' && !msg.test) {
        console.log('checkin', msg)
      } else {
        var play_audio = getSetting('play_audio')
        if (play_audio && play_audio == 'checked' || msg.test) {
          var myAudio = new Audio();
          myAudio.src = "static/audio/beans.ogg";
          if (msg.batch == 'coin') {
            myAudio.src = "static/audio/coin_drop.ogg";
          }
          myAudio.play();
        }
        let icon = 'static/image/bean.png'
        if (msg.batch == 'coin') {
          icon = 'static/image/coin.png'
        }
        sendChromeNotification( new Date().getTime().toString() + '_' + msg.batch, {
          type: "basic",
          title: msg.title,
          message: msg.content,
          iconUrl: icon
        })
      }
      break;
    // 签到状态
    case 'checkin_status':
      let currentStatus = localStorage.getItem('jjb_checkin_' + msg.batch) ? JSON.parse(localStorage.getItem('jjb_checkin_' + msg.batch)) : null
      let data = {
        date: DateTime.local().toFormat("o"),
        time: new Date(),
        value: msg.value
      }
      if (currentStatus && currentStatus.date == DateTime.local().toFormat("o")) {
        console.log('已经记录过今日签到状态了')
      } else {
        localStorage.setItem('jjb_checkin_' + msg.batch, JSON.stringify(data));
      }
      break;
    // 运行状态
    case 'run_status':
      console.log('run_status', msg)
      var jobList = getJobs()
      var job = _.find(jobList, { id: msg.jobId })
      localStorage.setItem('job' + job.id + '_lasttime', new Date().getTime())
      saveLoginState({
        content: job.title + "成功运行",
        state: "alive",
        type: job.type
      })
      // 如果任务周期小于10小时，且不是计划任务，则安排下一次运行
      if (mapFrequency[job.frequency] < 600 && !job.schedule) {
        chrome.alarms.create('runJob_' + job.id, {
          delayInMinutes: mapFrequency[job.frequency]
        })
      }
      break;
    case 'create_tab':
      var content = JSON.parse(msg.content)
      chrome.tabs.create({
        index: content.index,
        url: content.url,
        active: content.active == 'true',
        pinned: content.pinned == 'true'
      }, function (tab) {
        chrome.tabs.update(tab.id, {
          muted: true
        }, function (result) {
          log('background', "muted tab", result)
        })
        chrome.alarms.create('closeTab_' + tab.id, { delayInMinutes: 1 })
      })
      break;
    case 'remove_tab':
      var content = JSON.parse(msg.content)
      chrome.tabs.query({
        url: content.url,
        pinned: content.pinned == 'true'
      }, function (tabs) {
        var tabIds = $.map(tabs, function (tab) {
          return tab.id
        })
        chrome.tabs.remove(tabIds)
      })
      break;
    // 高亮Tab
    case 'highlightTab':
      var content = JSON.parse(msg.content)
      chrome.tabs.query({
        url: content.url,
        pinned: content.pinned == 'true'
      }, function (tabs) {
        $.map(tabs, function (tab) {
          chrome.tabs.update(tab.id, { pinned: false }, function (newTab) {
            sendChromeNotification(new Date().getTime().toString(), {
              type: "basic",
              title: content.title ? content.title : "京价保未能自动完成任务",
              message: "需要人工辅助，已将窗口切换至需要操作的标签" ,
              iconUrl: 'static/image/128.png'
            })
            chrome.tabs.highlight({
              tabs: newTab.index
            })
          })
          return tab.id
        })
      })
      break;
    case 'coupon':
      var coupon = JSON.parse(msg.content)
      var mute_coupon = getSetting('mute_coupon')
      if (mute_coupon && mute_coupon == 'checked') {
        console.log('coupon', msg)
      } else {
        sendChromeNotification( new Date().getTime().toString() + "_coupon_" + coupon.batch, {
          type: "basic",
          title: msg.title,
          message: coupon.name + coupon.price,
          isClickable: true,
          iconUrl: 'static/image/coupon.png'
        })
      }
      break;
    case 'orders':
      localStorage.setItem('jjb_orders', msg.content);
      localStorage.setItem('jjb_last_check', new Date().getTime());

      chrome.runtime.sendMessage({
        action: "orders_updated",
        data: msg.content
      });
      break;
    case 'clearUnread':
      updateUnreadCount(-999)
      break;
    case 'myTab':
      sendResponse({
        tab: sender.tab
      });
      break;
    default:
      console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
  }
  // 保存消息
  switch (msg.text) {
    case 'coupon':
    case 'notice':
    case 'checkin_notice':
      let messages = localStorage.getItem('jjb_messages') ? JSON.parse(localStorage.getItem('jjb_messages')) : [];
      if (msg.test) {
        break;
      }
      messages.push({
        type: msg.text,
        batch: msg.batch,
        title: msg.title,
        content: msg.content,
        time: new Date()
      })
      updateUnreadCount(1)
      // 如果消息数大于100了，就把最老的一条消息去掉
      if (messages.length > 100) {
        messages.shift()
      }
      chrome.runtime.sendMessage({
        action: "new_message",
        data: JSON.stringify(messages)
      });
      localStorage.setItem('jjb_messages', JSON.stringify(messages));
      break;
  }

  if (msg.text != 'saveAccount') {
    log('message', msg.text, msg);
  }
  // 如果消息 300ms 未被回复
  return true
});



Logline.keep(3);