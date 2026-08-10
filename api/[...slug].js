/* 단일 캐치올 함수. Vercel Hobby 플랜은 배포당 서버리스 함수 12개로 제한되는데,
   라우트마다 별도 파일(api/*.js)을 두면 60개가 넘어가 그 한도를 초과한다.
   그래서 실제 라우트 구현은 server/*.js에 두고, 여기 함수 하나에서만 내부적으로
   분기한다 — 배포되는 서버리스 함수는 이 파일 하나뿐이다.
   require()는 각각 정적 문자열로 써서 (1) 번들러가 모든 라우트 파일을 빠짐없이
   포함시키도록 하고, (2) 화이트리스트에 없는 경로는 아예 require할 수 없게 막는다. */
const routes = {
  "accounts": () => require("../server/accounts.js"),
  "admin-notifications": () => require("../server/admin-notifications.js"),
  "approve-account": () => require("../server/approve-account.js"),
  "approve-dash-request": () => require("../server/approve-dash-request.js"),
  "attach": () => require("../server/attach.js"),
  "comment": () => require("../server/comment.js"),
  "comment-delete": () => require("../server/comment-delete.js"),
  "dash-access": () => require("../server/dash-access.js"),
  "dash-rank": () => require("../server/dash-rank.js"),
  "dash-request": () => require("../server/dash-request.js"),
  "dash-request-cancel": () => require("../server/dash-request-cancel.js"),
  "dash-requests": () => require("../server/dash-requests.js"),
  "dash-stats": () => require("../server/dash-stats.js"),
  "dashboards-data": () => require("../server/dashboards-data.js"),
  "favorites": () => require("../server/favorites.js"),
  "health": () => require("../server/health.js"),
  "health-waive": () => require("../server/health-waive.js"),
  "history": () => require("../server/history.js"),
  "html-backup": () => require("../server/html-backup.js"),
  "html-history": () => require("../server/html-history.js"),
  "login": () => require("../server/login.js"),
  "logout": () => require("../server/logout.js"),
  "lounge-attach": () => require("../server/lounge-attach.js"),
  "lounge-delete": () => require("../server/lounge-delete.js"),
  "lounge-edit": () => require("../server/lounge-edit.js"),
  "lounge-like": () => require("../server/lounge-like.js"),
  "lounge-list": () => require("../server/lounge-list.js"),
  "lounge-post": () => require("../server/lounge-post.js"),
  "lounge-reply": () => require("../server/lounge-reply.js"),
  "lounge-reply-delete": () => require("../server/lounge-reply-delete.js"),
  "lounge-reply-edit": () => require("../server/lounge-reply-edit.js"),
  "manual": () => require("../server/manual.js"),
  "manual-delete": () => require("../server/manual-delete.js"),
  "manual-save": () => require("../server/manual-save.js"),
  "manuals": () => require("../server/manuals.js"),
  "me": () => require("../server/me.js"),
  "notice": () => require("../server/notice.js"),
  "pending-accounts": () => require("../server/pending-accounts.js"),
  "popular": () => require("../server/popular.js"),
  "popup": () => require("../server/popup.js"),
  "popup-admin": () => require("../server/popup-admin.js"),
  "popup-delete": () => require("../server/popup-delete.js"),
  "popup-dismiss": () => require("../server/popup-dismiss.js"),
  "popup-image": () => require("../server/popup-image.js"),
  "popup-save": () => require("../server/popup-save.js"),
  "post": () => require("../server/post.js"),
  "post-delete": () => require("../server/post-delete.js"),
  "post-edit": () => require("../server/post-edit.js"),
  "post-like": () => require("../server/post-like.js"),
  "posts": () => require("../server/posts.js"),
  "register": () => require("../server/register.js"),
  "render": () => require("../server/render.js"),
  "req-file": () => require("../server/req-file.js"),
  "request-status": () => require("../server/request-status.js"),
  "save": () => require("../server/save.js"),
  "share-add": () => require("../server/share-add.js"),
  "share-delete": () => require("../server/share-delete.js"),
  "share-edit": () => require("../server/share-edit.js"),
  "share-file": () => require("../server/share-file.js"),
  "share-list": () => require("../server/share-list.js"),
  "site-stats": () => require("../server/site-stats.js"),
  "site-visit": () => require("../server/site-visit.js"),
  "systems": () => require("../server/systems.js"),
  "upload-html": () => require("../server/upload-html.js"),
};

const { parse: parseUrl } = require("url");

/* 라우트 이름을 두 가지 방식으로 찾는다.
   1) 경로 기반: "/api/login" 처럼 직접 요청된 경우 -> "login"
   2) 쿼리 기반: vercel.json의 "/" -> "/api/render" 리라이트를 거치면
      Vercel이 경로는 원래 요청("/")로 그대로 두고, 매칭된 동적 세그먼트를
      쿼리스트링에 붙여서 넘긴다 — 이때 키 이름은 "slug"가 아니라 파일명
      그대로인 "...slug" (점 3개 포함, 실측 확인됨). 정확한 키를 가정하지
      않도록 "slug"로 끝나는 키를 전부 찾는다. */
function findSlugValue(query) {
  if (!query) return null;
  for (const key of Object.keys(query)) {
    if (key === "slug" || key.endsWith("slug")) {
      const v = query[key];
      return Array.isArray(v) ? v[0] : v;
    }
  }
  return null;
}
function routeNameFromUrl(reqUrl) {
  const parsed = parseUrl(String(reqUrl || ""), true);
  const parts = (parsed.pathname || "").split("/").filter(Boolean);
  if (parts[0] === "api" && parts.length === 2) return decodeURIComponent(parts[1]);
  return findSlugValue(parsed.query);
}

module.exports = async (req, res) => {
  let name = routeNameFromUrl(req.url);
  if (!name) name = findSlugValue(req.query);
  const loader = name ? routes[name] : null;
  if (!loader) {
    res.status(404).json({ ok: false, error: "알 수 없는 API 경로입니다.", path: req.url });
    return;
  }
  const handler = loader();
  return handler(req, res);
};
