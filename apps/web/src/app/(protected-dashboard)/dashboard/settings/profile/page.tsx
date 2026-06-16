import type { Prisma } from "@radevu/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  removeLogoAction,
  removePhotoAction,
  saveProfileAction,
  uploadLogoAction,
  uploadPhotoAction
} from "./actions";
import { ProfileEditor } from "./ProfileEditor";

function getSocialLink(
  value: Prisma.JsonValue | null,
  key: "facebook" | "instagram"
): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : null;
}

export default async function ProfileSettingsPage(): Promise<JSX.Element> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: {
      ownerId: session.user.id
    },
    select: {
      contactEmail: true,
      contactPhone: true,
      logoUrl: true,
      mapsUrl: true,
      name: true,
      photoUrl: true,
      socialLinks: true
    }
  });

  if (!business) {
    redirect("/register");
  }

  return (
    <div className="space-y-5 pb-20">
      <ProfileEditor
        business={{
          contactEmail: business.contactEmail,
          contactPhone: business.contactPhone,
          facebookUrl: getSocialLink(business.socialLinks, "facebook"),
          instagramUrl: getSocialLink(business.socialLinks, "instagram"),
          logoUrl: business.logoUrl,
          mapsUrl: business.mapsUrl,
          name: business.name,
          photoUrl: business.photoUrl
        }}
        removeLogoAction={removeLogoAction}
        removePhotoAction={removePhotoAction}
        saveProfileAction={saveProfileAction}
        uploadLogoAction={uploadLogoAction}
        uploadPhotoAction={uploadPhotoAction}
      />
      <ChangePasswordForm />
    </div>
  );
}
