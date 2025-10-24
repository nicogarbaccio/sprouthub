import { CascadingContainer } from "@/components/ui/cascading-container";

interface WelcomeHeaderProps {
  greeting: string;
}

export const WelcomeHeader = ({ greeting }: WelcomeHeaderProps) => {
  return (
    <CascadingContainer delay={0}>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-medium text-foreground mb-2">
          {greeting} 🌱
        </h1>
        <p className="text-foreground/60 text-lg">
          Here's how your plants are doing today
        </p>
      </div>
    </CascadingContainer>
  );
};
