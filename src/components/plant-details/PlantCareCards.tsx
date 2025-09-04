
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlantCareCardsProps {
 careInstructions: string[];
 commonProblems: string[];
}

const PlantCareCards = ({ careInstructions, commonProblems }: PlantCareCardsProps) => {
 return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
   <Card>
    <CardHeader>
     <CardTitle className="text-plant-text">Care Instructions</CardTitle>
    </CardHeader>
    <CardContent>
     <ul className="space-y-2">
      {careInstructions.map((instruction, index) => (
       <li key={index} className="flex items-start space-x-2">
        <span className="w-2 h-2 bg-plant-primary rounded-full mt-2 flex-shrink-0"></span>
        <span className="text-plant-text text-sm">{instruction}</span>
       </li>
      ))}
     </ul>
    </CardContent>
   </Card>

   <Card>
    <CardHeader>
     <CardTitle className="text-plant-text">Common Problems</CardTitle>
    </CardHeader>
    <CardContent>
     <ul className="space-y-3">
      {commonProblems.map((problem, index) => (
       <li key={index} className="text-plant-text text-sm">
        <span className="font-medium">{problem.split(':')[0]}:</span>
        <span className="text-plant-text/70"> {problem.split(':')[1]}</span>
       </li>
      ))}
     </ul>
    </CardContent>
   </Card>
  </div>
 );
};

export default PlantCareCards;
