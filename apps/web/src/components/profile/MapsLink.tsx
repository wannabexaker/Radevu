import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type MapsLinkProps = {
  mapsUrl: string | null;
};

export function MapsLink({ mapsUrl }: MapsLinkProps): JSX.Element | null {
  if (!mapsUrl) {
    return null;
  }

  return (
    <Button asChild className="w-full" variant="outline">
      <a href={mapsUrl} rel="noreferrer" target="_blank">
        <MapPin aria-hidden="true" className="h-5 w-5" />
        Δες στον χάρτη
      </a>
    </Button>
  );
}
