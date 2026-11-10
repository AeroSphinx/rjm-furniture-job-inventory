import Image from "next/image";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: 40,
  md: 64,
} as const;

/**
 * `public/rjm-logo.jpg` is a raster JPG with a black background and yellow
 * lettering — neither colour belongs to the brand palette, and a JPG cannot
 * be transparent. Rendering it inside a Midnight Navy rounded tile makes
 * the black edge read as an intentional frame instead of a mistake (design
 * §5.7, Requirement 18.11). Fixed render size avoids layout shift; `alt`
 * text is exact, never decorative.
 */
function BrandLogo({
  size = "sm",
  priority = false,
  className,
}: {
  size?: "sm" | "md";
  priority?: boolean;
  className?: string;
}) {
  const px = SIZES[size];

  return (
    <div
      className={cn("inline-flex items-center justify-center rounded-lg bg-navy-900 p-2", className)}
      style={{ width: px + 16, height: px + 16 }}
    >
      <Image
        src="/rjm-logo.jpg"
        alt="RJM Furniture logo"
        width={px}
        height={px}
        priority={priority}
        className="rounded-sm object-cover"
      />
    </div>
  );
}

export { BrandLogo };
