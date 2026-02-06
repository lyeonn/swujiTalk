const { chromium } = require("playwright");

const URLS = [
  "https://www.swu.ac.kr/www/noticea.html",
  // 나머지 4개 URL 추가
  // "https://www.swu.ac.kr/www/noticeb.html",
  // "https://www.swu.ac.kr/www/noticec.html",
  // "https://www.swu.ac.kr/www/noticed.html",
  // "https://www.swu.ac.kr/www/noticee.html",
];

async function crawlNoticeBoard(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });

  // 게시판이 iframe 안에 있으므로 frame 직접 접근
  const boardFrame = page.frames().find((f) =>
    f.url().includes("boardlist.do")
  );

  if (!boardFrame) {
    console.error("게시판 프레임을 찾을 수 없습니다:", url);
    return [];
  }

  await boardFrame.waitForSelector(".b_list_wrap table tbody tr");

  // iframe URL에서 bbsConfigFK 추출
  const frameUrl = boardFrame.url();
  const bbsConfigFK =
    new URL(frameUrl).searchParams.get("bbsConfigFK") || "";

  const notices = await boardFrame.$$eval(
    ".b_list_wrap table tbody tr",
    (rows, bbs) => {
      return rows
        .filter((row) => !row.classList.contains("notice")) // TOP 공지 제외
        .map((row) => {
          const tds = row.querySelectorAll("td");

          // 번호
          const number = tds[0]?.querySelector("div")?.textContent?.trim();

          // 제목 (strong 또는 span)
          const anchor = tds[1]?.querySelector("a");
          const titleEl =
            anchor?.querySelector("strong") ||
            anchor?.querySelector("div > span");
          const title = titleEl?.textContent?.trim();

          // 링크 추출 (onclick="boardMove('/front/boardview.do','508864')")
          const onclickAttr = anchor?.getAttribute("onclick") || "";
          const idMatch = onclickAttr.match(/'(\d+)'/);
          const link = idMatch
            ? `https://www.swu.ac.kr/gopage/goboard1.jsp?bbsConfigFK=${bbs}&pkid=${idMatch[1]}`
            : null;

          // 등록일 (번호, 제목, 첨부파일, 등록일, 조회수)
          const date = tds[3]?.querySelector("div")?.textContent?.trim();

          return { number, title, link, date };
        })
        .filter((item) => item.number);
    },
    bbsConfigFK
  );

  return notices;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const url of URLS) {
    console.log(`\n크롤링 중: ${url}`);
    const notices = await crawlNoticeBoard(page, url);

    notices.forEach((notice) => {
      console.log(
        `[${notice.number}] ${notice.title} | ${notice.date} | ${notice.link}`
      );
    });

    console.log(`총 ${notices.length}건 수집 완료`);
  }

  await browser.close();
}

main();
