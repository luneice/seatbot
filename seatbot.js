/**
 * Created by luneice on 18-6-13.
 */

const puppeteer = require('puppeteer');

async function seatbot() {
  let reservated = false;

  while(1) {
    var time = new Date().getHours();
    if (time >= 8 && time <=21) {
      // 新的一天开始预约标志
      if (!reservated) {
        const browser = await puppeteer.launch({
          headless: true
        });
        const page = await browser.newPage();
        // 使用 iPhone 的屏幕运行
        await page.setViewport({
          width: 375,
          height: 667,
          isMobile: true,
          hasTouch: true
        });
        await page.goto("http://www.jzwz88.com/www/login.html", {timeout: 0}); // 等待浏览器加载完毕
        await page.screenshot({path: new Date().getTime() + '.png'});
        await page.waitFor(".g-schools.schoolNum");
        // 通过脚本填写信息
        await page.$eval('body', ()=> {
          // 此代码在浏览器中运行
          const conf = {
            school: "3df715dc-e177-4b71-907c-af530ff9f8ca",
            username: "你的学号",
            password: "你的密码"
          };
          $(".g-schools.schoolNum")[0].value = conf.school;
          $(".input.userNum")[0].value = conf.username;
          $(".input.userPwd")[0].value = conf.password;
        });
        await page.click(".g-login");
        await page.goto("http://www.jzwz88.com/www/index.html", {timeout: 0});
        // 查询是否预约了座位
        let reservation = await page.$eval("body", getReservation);
        // 查询结果处理
        if (reservation) {
          reservated = isReservation(reservation);
          console.log(42, reservated);
        }
        console.log(44, reservated);
        // 如果预约了
        if (reservated) {
          console.log("已经预约了一个座位");
          await page.close();
        } else {
          // 如果没有预约
          await page.goto("http://www.jzwz88.com/www/subscribe.html#", {timeout: 0}); // 等待浏览器加载完毕
          console.log("开始预约座位");
          await page.waitFor(".col.t-c");
          await page.touchscreen.tap(275, 295);
          // 全程模拟人类点击
          await page.tap(".pickdate.dateChange");
          // 点击小时
          const point = dateXY(8, 30);
          await page.touchscreen.tap(point.h.x, point.h.y);
          // 点击分
          await page.touchscreen.tap(point.m.x, point.m.y);
          // 确定预约时间
          await page.tap("#confirm");
          // 进入选座页面
          await page.touchscreen.tap(280, 580);
          await page.waitFor("#seat");
          // 通过脚本注入，选择座位
          await page.$eval("#seat", () => {
            // 此代码在浏览器中运行
            // 夏天图书馆最佳位置
            // 远离门，头顶空调
            const summer_seat = {
              "1-3": 159637,
              "1-4": 159638,
              "6-3": 159707,
              "6-4": 159708,
              "12-3": 159797,
              "12-4": 159798,
              "20-3": 159917,
              "20-4": 159918,
              "6-1": 159705
            };

            function isAvailable(seatNum) {
              let seatArray = $("#seat > ul > .unOptional.selected");
              let available = true;
              for (let len = 0; len < seatArray.length; ++len) {
                if ($(seatArray[len])[0].outerHTML.match(seatNum)) {
                  available = false
                }
              }
              return available;
            }

            for (let item in summer_seat) {
              if (isAvailable(summer_seat[item])) {
                $("#SeatDataID")[0].value = summer_seat[item];
              }
            }
          });

          // 确定座位
          await page.tap(".btn.btn-conner.btn-block.btn-blue");
          // 等待页面加载
          await page.waitFor(".btn.btn-conner.btn-block.btn-blue");
          // 确定预约
          await page.tap(".btn.btn-conner.btn-block.btn-blue");
          // 截图
          // await page.screenshot({path: new Date().getTime() + '.png'});
          // await page.screenshot({path: new Date().getTime() + '.png'});
          await browser.close();
        }
      } else {
      //  什么也不做
      }

    } else {
      console.log("不可预约时间");
      console.log("新的一天开始");
      // 置预约标志为可预约
      reservated = false;
    }
  }
}

// 在屏幕尺寸为 375 × 667 下时刻所在的坐标位置
function dateXY(hour, min) {
  /*
  x 70        125       175        305       y
   ----------------------------
   |06        07        08    |    00        190
   |09        10        11    |    10        245
   |12        13        14    |    20        295
   |15        16        17    |    30        345
   |18        19        20    |    40        395
   |21        22        23    |    50        445
   ----------------------------
  */
  // 以 06 : 00 作为参考点
  const h_x_offset = [70, 125, 175][(hour - 6) % 3];
  const h_y_offset = [190, 245, 295, 345, 395, 445][parseInt((hour - 6) / 3 ) % 6];
  const m_x_offset = 305;
  const m_y_offset = [190, 245, 295, 345, 395, 445][min / 10 % 6];
  return {
    h: {x: h_x_offset, y: h_y_offset},
    m: {x: m_x_offset, y: m_y_offset}
  }
}

async function getReservation() {
  return await new Promise((resolve, reject) => {
    var userInfo = g.userInfo();
    var dataS = {
      "url":g.ContextPath + "reservation/selectReservationByUser",
      "userInfoId":userInfo.userInfoId,
      "Authorization":userInfo.token
    };
    $.ajax({
      type: "post",
      url		:	 "../WebAction/Api/requestApi",
      dataType : "json",
      data    : {
        "data" : JSON.stringify(dataS)
      } ,
      success	:	function(e){
        resolve(e);
      },
      error:function(e) {
        reject(e);
      }
    });
  })
}

function isReservation(reservation) {
  // 判断第二天是否已经预约
  let list = reservation.list;
  let offset = null;
  for (let item in list) {
    let date = list[item].sreservationBeginTime;
    let today = new Date();
    let nextDay = today.getTime() + 24 * 60 * 60 * 1000;
    let nextDate = new Date(nextDay);
    // Bug node.js 中 .toLocaleDateString() 与浏览器中返回的值不一致
    offset = parseInt(nextDate.toLocaleDateString().split("-")[2]) - parseInt(new Date(date).toLocaleDateString().split("-")[2]);
    if (offset === 0) {
      break;
    }
  }
  console.log("offset", false);
  return offset === 0;
}

seatbot();

