import Image from "next/image";

interface LogoProps {
  className?: string;
  priority?: boolean;
}

export function Logo({ className = "", priority = false }: LogoProps) {
  return (
    <Image
      className={`logo ${className}`}
      src="/images/kohi-saar-logo.jpeg"
      alt="Kohisaar"
      width={56}
      height={56}
      priority={priority}
    />
  );
}
