interface PagePlaceholderProps {
  title: string;
}

export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <><Navbar /><main className="route-placeholder"><p className="eyebrow">Kohisaar</p><h1>{title}</h1></main><Footer /></>
  );
}
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
