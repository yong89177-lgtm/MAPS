const { readBody, methodNotAllowed, nowIso } = require("./_lib/http");
const { requireAdmin } = require("./_lib/auth");
const { update } = require("./_lib/blob");

module.exports = async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res);
  const s = await requireAdmin(req, res);
  if (!s) return;
  const { id, approve, reason } = await readBody(req);
  const isSuper = s.id === "admin";
  if (!approve && !String(reason || "").trim()) {
    return res.status(400).json({ ok: false, error: "반려 사유가 필요합니다." });
  }

  let errorOut = null;
  await update("dash_requests", { items: [] }, (cur) => {
    const q = (cur.items || []).find((x) => x.id === id);
    if (!q) { errorOut = "요청을 찾을 수 없습니다."; return cur; }

    if (q.status === "pending") {
      // 1차 IT 검토 — 슈퍼관리자(admin)만
      if (!isSuper) { errorOut = "1차 IT 검토는 관리자(admin) 계정만 처리할 수 있습니다."; return cur; }
      q.stage1 = { by: s.id, ts: nowIso(), decision: approve ? "approved" : "rejected", reason: reason || "" };
      q.status = approve ? "it_approved" : "rejected";
    } else if (q.status === "it_approved") {
      // 2차 적절성 검토 — 슈퍼관리자를 제외한 다른 관리자만
      if (isSuper) { errorOut = "2차 적절성 검토는 다른 관리자 계정이 처리해야 합니다."; return cur; }
      q.stage2 = { by: s.id, ts: nowIso(), decision: approve ? "approved" : "rejected", reason: reason || "" };
      q.status = approve ? "approved" : "rejected";
    } else {
      errorOut = "이미 처리된 요청입니다.";
    }
    return cur;
  });
  if (errorOut) return res.status(400).json({ ok: false, error: errorOut });
  res.status(200).json({ ok: true });
};
