import { Avatar } from "@/components/ui/Avatar";

type CustomerAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Renders the shared branded avatar for dashboard customer surfaces.
 *
 * @param props - Customer name and optional size variant.
 * @returns A circular avatar.
 */
export function CustomerAvatar({
  name,
  size = "sm"
}: CustomerAvatarProps): JSX.Element {
  return <Avatar alt={`${name} προφίλ`} name={name} size={size} />;
}
