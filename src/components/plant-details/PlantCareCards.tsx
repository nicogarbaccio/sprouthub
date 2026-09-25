import { AlertTriangle, ListChecks } from 'lucide-react';

interface PlantCareCardsProps {
  careInstructions: string[];
  commonProblems: string[];
}

const PlantCareCards = ({ careInstructions, commonProblems }: PlantCareCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3.5">
      <section className="rounded-card bg-card p-[18px] md:p-6">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[-0.02em] text-foreground">
          <span className="w-9 h-9 rounded-xl bg-sprout-success text-sprout-dark flex items-center justify-center">
            <ListChecks className="w-[18px] h-[18px]" />
          </span>
          Care Instructions
        </h2>
        <ul className="space-y-2.5 mt-4">
          {careInstructions.map((instruction, index) => (
            <li key={index} className="flex items-start gap-2.5 text-[15px] text-foreground leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-sprout-light mt-2 shrink-0" aria-hidden="true" />
              {instruction}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card bg-card p-[18px] md:p-6">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[-0.02em] text-foreground">
          <span className="w-9 h-9 rounded-xl bg-sprout-warning text-sprout-dark flex items-center justify-center">
            <AlertTriangle className="w-[18px] h-[18px]" />
          </span>
          Common Problems
        </h2>
        <ul className="space-y-2 mt-4">
          {commonProblems.map((problem, index) => {
            const [name, ...rest] = problem.split(':');
            return (
              <li key={index} className="rounded-[18px] bg-field px-4 py-3 text-sm leading-snug">
                <span className="block font-bold text-foreground">{name}</span>
                {rest.length > 0 && <span className="text-muted-foreground">{rest.join(':').trim()}</span>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default PlantCareCards;
