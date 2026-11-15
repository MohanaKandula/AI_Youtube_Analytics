# TutorTrace Security Remediation & Credential Rotation Protocol

## 1. Exposed Secrets & Rotation Actions
During the initial repository audit, five live credentials were identified in plain-text source files in commit `023ce9e`. The source files have been scrubbed in the working tree, and the following credential rotation actions are required immediately:

| Credential | Former Location | Exposure Risk | Rotation Procedure |
| :--- | :--- | :--- | :--- |
| **YouTube Data API Key** | `app.py` line 169 & `src/utils/youtube.ts` line 2 | Quota theft, unauthorized API access, billing charges | 1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).<br>2. Delete key `AIzaSyAoybA...`<br>3. Create a new API Key.<br>4. Under "API restrictions", restrict key **only** to "YouTube Data API v3".<br>5. Store in `.env` as `YOUTUBE_API_KEY`. |
| **Gmail App Password** | `app.py` line 164 | Full email account compromise, spam relay | 1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords).<br>2. Delete the app password `bzkf rvbh awnd zhxl`.<br>3. Generate a new 16-character App Password.<br>4. Store in `.env` as `MAIL_PASSWORD`. |
| **OpenRouter AI API Key** | `app.py` line 3178 | Unauthorized LLM inference credits drainage | 1. Navigate to [OpenRouter API Keys](https://openrouter.ai/keys).<br>2. Delete key `sk-or-v1-f74e...`<br>3. Create a new restricted key.<br>4. Store in `.env` as `OPENROUTER_API_KEY`. |
| **PostgreSQL Database Password**| `app.py` line 177 | Local database unauthorized read/write | 1. Update postgres role password: `ALTER USER postgres WITH PASSWORD 'strong_unique_password';`<br>2. Store in `.env` as `DB_PASSWORD`. |
| **Flask JWT Secret Key** | `app.py` line 155 | Token forgery, identity spoofing | 1. Generate random 256-bit key: `python -c "import secrets; print(secrets.token_hex(32))"`<br>2. Store in `.env` as `SECRET_KEY`. |

---

## 2. Git History Scrubbing Protocol
Even though the working tree files are sanitized, Git keeps historical snapshots in commit `023ce9e`. If this repository is pushed to a remote GitHub repository, the historical commit will still be exposed.

### Recommended Scrubbing via `git-filter-repo`:
1. Install `git-filter-repo`:
   ```bash
   pip install git-filter-repo
   ```
2. Create a replacement file `replace_secrets.txt`:
   ```text
   AIzaSyAoybAHRQn7vnq-mjQ_iov1QeHnmJBObIA==>REDACTED_YOUTUBE_KEY
   AIzaSyCKKqX15NznaABZydmTgNvfT9pHIQcWZmg==>REDACTED_YOUTUBE_KEY
   bzkf rvbh awnd zhxl==>REDACTED_MAIL_PASSWORD
   sk-or-v1-REDACTED_HISTORICAL_TOKEN==>REDACTED_OPENROUTER_KEY
   0484fc9264f5d1da17152831465bf369da3146195740b8bc8aa78e2f58ace2d0==>REDACTED_JWT_SECRET
   ```
3. Execute filter repo:
   ```bash
   git filter-repo --replace-text replace_secrets.txt --force
   ```
4. Verify historical purge:
   ```bash
   git log -p -S "AIzaSyAoybAHRQn7vnq"
   # Output should be empty
   ```

---

## 3. API Response Safety Verification
Every endpoint has been audited to confirm zero data leakage:
- `/api/auth/send-otp` & `/api/auth/resend-otp`: `"dev_otp"` removed. Responses only return `{"message": "...", "email": "..."}`.
- `/api/auth/login` & `/api/auth/verify`: Password hashes and salts are never returned.
- `/api/user/profile`: Excludes `password_hash` from SELECT statements.
