import { Facebook, Instagram } from "lucide-react";

type SocialLinksProps = {
  socialLinks: unknown;
};

type ParsedSocialLinks = {
  instagram?: string;
  facebook?: string;
};

function parseSocialLinks(value: unknown): ParsedSocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;

  return {
    instagram:
      typeof record.instagram === "string" ? record.instagram : undefined,
    facebook: typeof record.facebook === "string" ? record.facebook : undefined
  };
}

export function SocialLinks({ socialLinks }: SocialLinksProps): JSX.Element | null {
  const parsed = parseSocialLinks(socialLinks);
  const links = [
    parsed.instagram
      ? {
          href: parsed.instagram,
          icon: Instagram,
          label: "Instagram"
        }
      : null,
    parsed.facebook
      ? {
          href: parsed.facebook,
          icon: Facebook,
          label: "Facebook"
        }
      : null
  ].filter((link): link is { href: string; icon: typeof Instagram; label: string } =>
    Boolean(link)
  );

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Κοινωνικά</h2>
      <div className="mt-4 flex gap-3">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <a
              aria-label={link.label}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              href={link.href}
              key={link.label}
              rel="noreferrer"
              target="_blank"
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
