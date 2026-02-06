const { chromium } = require("playwright");

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const testUrls = [
    "https://www.swu.ac.kr/front/boardview.do?pkid=508873&bbsConfigFK=4",
    "https://www.swu.ac.kr/front/boardview.do?pkid=508873&bbsConfigFK=4&menuGubun=1&siteGubun=1",
    "https://www.swu.ac.kr/front/boardview.do?bbsConfigFK=4&pkid=508873&menuGubun=1&siteGubun=1&searchField=ALL&currentPage=1&searchLowItem=ALL",
  ];

  for (const url of testUrls) {
    console.log(`\n테스트: ${url}`);
    const response = await page.goto(url, { waitUntil: "networkidle" });
    const finalUrl = page.url();
    const title = await page.evaluate(() => {
      const el = document.querySelector(".title_box span")
        || document.querySelector(".tit")
        || document.querySelector("title");
      return el?.textContent?.trim() || "제목 못 찾음";
    });
    console.log(`  최종 URL: ${finalUrl}`);
    console.log(`  제목: ${title}`);
    console.log(`  에러 여부: ${finalUrl.includes("gomsg")}`);
  }

  await browser.close();
}

debug();
