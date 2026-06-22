# Deployment Guide

This site runs on **Supabase** (database + admin auth + image storage) and
**Vercel** (hosting). Email uses **EmailJS**. There is no Firebase.

Follow the steps once. After that, every `git push` auto-deploys.

---

## 1. Supabase — create the backend (~5 min)

1. Go to **https://supabase.com** → sign in → **New project**.
   - Pick a name + database password (save the password somewhere).
   - Wait ~2 min for it to provision.

2. **SQL Editor** (left sidebar) → **New query** → open the file
   `supabase/schema.sql` from this repo, copy ALL of it, paste, click **Run**.
   - This creates the tables, security rules, and the page-view counter.
   - Safe to run more than once.

3. **Storage** (left sidebar) → **New bucket**:
   - Name: `products` → toggle **Public bucket ON** → Create.
   - **New bucket** again → Name: `gallery` → **Public bucket ON** → Create.

4. **Authentication** → **Users** → **Add user** → **Create new user**:
   - Enter the admin email + password he wants for logging into `/admin`.
5. **Authentication → Providers → Email** (or **Settings**) → **turn OFF**
   "Allow new users to sign up". **Required** — the admin is the only account, and
   leaving signups on would let anyone register and edit site content.

5. **Project Settings** (gear icon) → **API**. Copy these two values, keep them
   for step 2:
   - **Project URL**  → e.g. `https://xxxx.supabase.co`
   - **anon / public** key (the long `sb_publishable_...` one)

---

## 2. Vercel — deploy the site (~3 min)

1. Get the code into **his** GitHub repo (clone this repo, push to his repo, or
   paste these files over his old project and push).

2. Go to **https://vercel.com** → **Add New → Project** → import his repo.
   - Framework preset: **Vite** (auto-detected). Leave build settings default.

3. Before deploying, open **Environment Variables** and add (see step 3 for the
   Resend values):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Project URL from step 1.5 |
   | `VITE_SUPABASE_ANON_KEY` | anon key from step 1.5 |
   | `RESEND_API_KEY` | from Resend (step 3) — **server-side, no VITE_ prefix** |
   | `CONTACT_TO_EMAIL` | inbox that receives leads, e.g. `bogotmaster@gmail.com` |
   | `CONTACT_FROM_EMAIL` | verified sender, e.g. `Bogot Master <noreply@bogotmaster.org>` |

4. Click **Deploy**. Wait for the build to finish.

---

## 3. Resend — email sending (~10 min)

Email is sent by the serverless function `api/send.js`. It needs a Resend account
and a verified sending domain.

1. Go to **https://resend.com** → sign up.
2. **Domains** → **Add Domain** → enter his domain (e.g. `bogotmaster.org`).
   - Resend shows several DNS records (SPF/DKIM, `MX`/`TXT`). Add them in his
     domain's DNS provider (or in Vercel → Domains → DNS if Vercel manages it).
   - Click **Verify** once added (can take a few minutes to propagate).
3. **API Keys** → **Create API Key** → copy it (shown once).
4. Put the three email env vars in Vercel (step 2.3):
   - `RESEND_API_KEY` = the key
   - `CONTACT_TO_EMAIL` = where leads should arrive
   - `CONTACT_FROM_EMAIL` = a sender on the verified domain, e.g.
     `Bogot Master <noreply@bogotmaster.org>`
5. **Redeploy** so the function picks up the variables.

> No verified domain yet? For quick testing, set
> `CONTACT_FROM_EMAIL=onboarding@resend.dev` — but messages can only go to his own
> Resend signup email until a domain is verified. Verify the domain for real use.

> Free tier: 3,000 emails/month, 100/day — plenty for a contact form.

---

## 4. Fill the content (~1 min)

1. Open `https://<his-site>.vercel.app/admin/login` (or his domain `/admin/login`).
2. Log in with the admin email + password from step 1.4.
3. Go to the **Database** tab → click **"Seed from defaults"**.
   - This loads all products and text.
4. Edit products, photos, hero text, and translations as needed — changes save
   to Supabase and go live immediately.

---

## Custom domain

If he already has a domain on his old Vercel project, it keeps working — nothing
in this version is tied to the domain. To attach a domain to a new project:
**Vercel → Project → Settings → Domains → Add**, then point the DNS as Vercel
instructs.

---

## Notes

- **Old Firebase data does not transfer.** The previous version stored data in
  Firebase; this one uses Supabase. Re-seed (step 4) then edit. Images already in
  Supabase Storage are safe if he reuses the same Supabase project.
- **Local email testing:** `npm run dev` (Vite) does not run the `/api` function.
  Use `vercel dev` to test the contact form locally, or just test on the deployed
  Vercel URL. Leads are still saved to Supabase even if the email step fails.
- The public site renders built-in seed content even before the database is
  seeded, so it never looks empty during setup.
- The `anon` key is safe to expose publicly — security is enforced by the
  database rules in `schema.sql`, not by hiding the key.
