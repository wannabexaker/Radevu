# Email setup

Radevu sends transactional email with Resend. Cloudflare is the DNS/security
layer for the domain; it is not the SMTP provider for app email.

## Current beta target

Live beta can use:

```text
Sending domain: radevu.olamov.com
From address: noreply@radevu.olamov.com
App env: RESEND_FROM_EMAIL=noreply@radevu.olamov.com
```

Production later can switch to `noreply@radevu.gr` after `radevu.gr` is
registered and verified.

## Recommended DNS model

Use a sending subdomain instead of the root domain. This keeps sender reputation
separate from normal personal/business email on `olamov.com`.

1. In Resend, add `radevu.olamov.com` as a domain.
2. In Cloudflare DNS for `olamov.com`, add the exact records Resend generates:
   MX return-path/SPF record, TXT SPF record, and TXT DKIM record.
3. Keep all email-auth records DNS-only. Do not proxy mail/auth records.
4. In Resend, click `Verify DNS Records`.
5. After Resend status is `verified`, set the Pi env:

```bash
RESEND_FROM_EMAIL=noreply@radevu.olamov.com
BOOKING_OWNER_ALERT_EMAIL_OVERRIDE=
```

Do not set `BOOKING_OWNER_ALERT_EMAIL_OVERRIDE` in normal production. When it is
blank, new-booking alerts go to the business `contact_email`, then fallback to
the owner login email.

`CONTACT_NOTIFICATION_EMAIL` is only for Radevu landing-page contact requests to
the founder. It must not be used for every business booking alert.

## Anti-spam baseline

- SPF and DKIM must pass through Resend verification.
- Add a DMARC TXT record for `radevu.olamov.com`; start with monitoring policy
  while testing:

```text
Name: _dmarc.radevu
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:<your-report-email>; adkim=s; aspf=s
```

After real delivery is stable, move to `p=quarantine`, then later `p=reject`.

## Local development

Keep `RESEND_API_KEY=` blank locally until the domain is verified and you have a
real `re_...` API key. The dev app will skip email delivery with an info log
instead of calling Resend with a dummy key.

Do not use placeholder values like `dummy_resend_key`; they are treated as
unusable in development and invalid in production.

## Runtime checks

On the Pi:

```bash
docker exec radevu-web env | sort \
  | grep -E "^(RESEND|CONTACT|BOOKING_OWNER_ALERT)"
```

Expected after verification:

```text
RESEND_API_KEY=<set>
RESEND_FROM_EMAIL=noreply@radevu.olamov.com
BOOKING_OWNER_ALERT_EMAIL_OVERRIDE=
CONTACT_NOTIFICATION_EMAIL=<founder-email>
```

Then book a test appointment with a real customer email. The customer gets the
confirmation email. The business gets the owner alert at the email it configured
in Settings -> Profile.

## References

- Resend recommends sending from a verified domain/subdomain and shows domain
  status/DNS records in the Domains dashboard: https://resend.com/docs/dashboard/domains/introduction
- Resend's Cloudflare guide covers the generated MX/SPF/DKIM records and the
  `Verify DNS Records` step: https://resend.com/docs/knowledge-base/cloudflare
- Cloudflare documents SPF, DKIM, and DMARC as the records that prevent domain
  spoofing: https://developers.cloudflare.com/dmarc-management/security-records/
