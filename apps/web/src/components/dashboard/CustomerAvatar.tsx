type CustomerAvatarProps = {
  name: string;
  size?: "sm" | "lg";
};

/**
 * Renders a customer initial avatar for dashboard customer surfaces.
 *
 * @param props - Customer name and optional size variant.
 * @returns A circular initial avatar.
 */
export function CustomerAvatar({
  name,
  size = "sm"
}: CustomerAvatarProps): JSX.Element {
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase("el-GR") ?? "?";
  const sizeClass = size === "lg" ? "h-14 w-14 text-xl" : "h-11 w-11 text-base";

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-500 font-semibold text-white`}
    >
      {initial}
    </span>
  );
}
