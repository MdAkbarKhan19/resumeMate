#!/usr/bin/env python3
"""End-to-end production smoke test (run ON the server against localhost:3000).

Exercises the full user journey through the real API + DB + OpenAI + Puppeteer:
  signup -> entitlements -> create x2 (cap) -> ATS check -> PDF -> DOCX.
Writes the auth token + a resume id to /tmp so the bash upload step can reuse
them. Prints PASS/FAIL per step and exits non-zero if anything fails.
"""
import json, os, random, string, sys, urllib.request, urllib.error

BASE = os.environ.get("BASE", "http://localhost:3000")
rnd = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
EMAIL = f"e2e-{rnd}@jdsync-test.local"
PASSWORD = "Test1234!"

results = []
def record(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" :: {detail}" if detail else ""))

def req(method, path, data=None, token=None, raw=False):
    url = BASE + path
    headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            content = resp.read()
            return resp.status, (content if raw else json.loads(content or b"{}"))
    except urllib.error.HTTPError as e:
        content = e.read()
        try:
            return e.code, json.loads(content or b"{}")
        except Exception:
            return e.code, {"_raw": content[:200].decode("utf-8", "replace")}

RESUME_BODY = {
    "title": "E2E Test Resume",
    "templateId": "modern-two-column",
    "personalInfo": {"fullName": "E2E Tester", "email": EMAIL, "title": "Software Engineer",
                      "phone": "+1 555 010 2030", "location": "Remote"},
    "summary": "Senior software engineer experienced with React, TypeScript and Node.js on AWS.",
    "experience": [{"company": "Acme Corp", "position": "Senior Engineer", "location": "Remote",
                     "startDate": "2020-01", "current": True,
                     "bullets": ["Built scalable REST APIs with Node.js and PostgreSQL on AWS.",
                                 "Shipped React + TypeScript features via CI/CD with Jest tests."]}],
    "skills": [{"category": "Technical", "items": ["React", "TypeScript", "Node.js", "AWS", "PostgreSQL"]}],
}

# 1. Signup ------------------------------------------------------------------
st, body = req("POST", "/api/auth/signup", {"email": EMAIL, "password": PASSWORD, "name": "E2E Tester"})
token = (body.get("data") or {}).get("token")
record("signup returns token", st in (200, 201) and bool(token), f"http {st}")
if not token:
    print(json.dumps(body)[:300]); sys.exit(1)

# 2. Entitlements (PROMO_FREE_MODE proof) ------------------------------------
st, ent = req("GET", "/api/me/entitlements", token=token)
d = ent.get("data") or {}
promo_ok = (st == 200 and d.get("tier") == "pro" and d.get("watermark") is False
            and d.get("maxActiveResumes") == "unlimited")
record("entitlements: PROMO active (pro/unlimited/no-watermark)", promo_ok,
       f"tier={d.get('tier')} watermark={d.get('watermark')} max={d.get('maxActiveResumes')}")

# 3. Create resume x2 (free 1-resume cap must be lifted) ---------------------
ids = []
for n in (1, 2):
    st, body = req("POST", "/api/resumes", RESUME_BODY, token=token)
    rid = ((body.get("data") or {}).get("resume") or {}).get("id")
    if rid:
        ids.append(rid)
    record(f"create resume #{n} allowed (cap lifted)", st in (200, 201) and bool(rid),
           f"http {st} id={rid}")
resume_id = ids[0] if ids else None

# 4. ATS check (was 401 before the user.sub->user.id fix) --------------------
if resume_id:
    jd = ("Hiring a Senior Frontend Engineer with React, TypeScript, Node.js, AWS, "
          "PostgreSQL, REST APIs, CI/CD and Jest testing experience.")
    st, ats = req("POST", "/api/ats/check", {"resumeId": resume_id, "jobDescription": jd}, token=token)
    score = ats.get("score") if isinstance(ats, dict) else None
    record("ATS check returns a score (no 401)", st == 200 and isinstance(score, (int, float)),
           f"http {st} score={score}")

# 5. Export PDF --------------------------------------------------------------
if resume_id:
    st, pdf = req("GET", f"/api/export/pdf/{resume_id}", token=token, raw=True)
    record("PDF export returns a real PDF", st == 200 and pdf[:5] == b"%PDF-",
           f"http {st} bytes={len(pdf) if isinstance(pdf, (bytes, bytearray)) else 'n/a'}")

# 6. Export DOCX -------------------------------------------------------------
if resume_id:
    st, docx = req("GET", f"/api/export/docx/{resume_id}", token=token, raw=True)
    record("DOCX export returns a real DOCX", st == 200 and docx[:2] == b"PK",
           f"http {st} bytes={len(docx) if isinstance(docx, (bytes, bytearray)) else 'n/a'}")

# Hand off to the bash upload step.
with open("/tmp/e2e_token", "w") as f: f.write(token)
with open("/tmp/e2e_email", "w") as f: f.write(EMAIL)
with open("/tmp/e2e_ids", "w") as f: f.write(",".join(ids))

failed = [n for n, ok, _ in results if not ok]
print(f"\n=== {len(results)-len(failed)}/{len(results)} passed ===")
sys.exit(1 if failed else 0)
