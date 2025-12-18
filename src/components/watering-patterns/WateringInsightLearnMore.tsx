/**
 * Educational content dialog for watering pattern insights
 * Provides detailed information about watering risks and tips
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Droplets,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Calendar,
  Lightbulb,
  Eye,
  Clock
} from 'lucide-react';
import { PatternInsight } from '@/types/wateringPatternTypes';
import { cn } from '@/lib/utils';

interface WateringInsightLearnMoreProps {
  isOpen: boolean;
  onClose: () => void;
  insight: PatternInsight | null;
  plantName?: string;
}

const WateringInsightLearnMore = ({
  isOpen,
  onClose,
  insight,
  plantName = 'your plant',
}: WateringInsightLearnMoreProps) => {
  if (!insight) return null;

  const getInsightContent = () => {
    switch (insight.type) {
      case 'underwatering_risk':
        return {
          icon: TrendingDown,
          iconColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          title: 'Understanding Underwatering',
          sections: [
            {
              title: 'What This Means',
              icon: AlertTriangle,
              content: `Based on your watering pattern, you're consistently watering ${plantName} later than the recommended schedule. While plants can tolerate some flexibility, regularly waiting too long between waterings can stress the plant and affect its health.`
            },
            {
              title: 'Signs to Watch For',
              icon: Eye,
              items: [
                'Drooping or wilting leaves, especially at the tips',
                'Soil pulling away from the edges of the pot',
                'Dry, crispy, or browning leaf edges',
                'Slower growth than usual',
                'Leaves feeling thin or papery to the touch',
                'Soil that\'s completely dry several inches down'
              ]
            },
            {
              title: 'What You Can Do',
              icon: Lightbulb,
              items: [
                'Set calendar reminders for your watering schedule',
                'Check soil moisture before the scheduled date if you notice drooping',
                'Consider adjusting your schedule to better match your routine',
                'Use a moisture meter for more accurate timing',
                'Group plants with similar needs for easier care'
              ]
            },
            {
              title: 'Pro Tips',
              icon: CheckCircle2,
              items: [
                'Morning watering is usually best, allowing excess to evaporate during the day',
                'Water thoroughly until it drains from the bottom',
                'The "finger test" - stick your finger 1-2 inches into the soil to check moisture',
                'Different seasons may require schedule adjustments'
              ]
            }
          ]
        };

      case 'overwatering_risk':
        return {
          icon: TrendingUp,
          iconColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          title: 'Understanding Overwatering',
          sections: [
            {
              title: 'What This Means',
              icon: AlertTriangle,
              content: `You're watering ${plantName} more frequently than recommended. Overwatering is one of the most common causes of plant health issues. Most plants need their soil to partially dry out between waterings to allow roots to breathe.`
            },
            {
              title: 'Signs to Watch For',
              icon: Eye,
              items: [
                'Yellow leaves, especially lower/older ones',
                'Wilting despite wet soil',
                'Soft, mushy stems or base',
                'Fungus gnats hovering around the soil',
                'Moldy or musty smell from the soil',
                'Root rot (black, mushy roots)',
                'Edema (water blisters on leaves)'
              ]
            },
            {
              title: 'What You Can Do',
              icon: Lightbulb,
              items: [
                'Let the soil dry more between waterings',
                'Check soil moisture before watering - if it\'s still damp, wait',
                'Ensure your pot has drainage holes',
                'Consider if your pot size is appropriate for the plant',
                'Reduce watering frequency, especially in winter',
                'Improve air circulation around the plant'
              ]
            },
            {
              title: 'Pro Tips',
              icon: CheckCircle2,
              items: [
                'When in doubt, it\'s safer to underwater than overwater',
                'Weight test - lift the pot when dry vs. wet to learn the difference',
                'Use well-draining soil appropriate for your plant type',
                'Water less frequently in cooler months when growth slows',
                'Bottom watering can help prevent overwatering'
              ]
            }
          ]
        };

      case 'consistency_improvement':
        return {
          icon: Calendar,
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          title: 'Improving Watering Consistency',
          sections: [
            {
              title: 'Why Consistency Matters',
              icon: AlertTriangle,
              content: `${plantName} is experiencing irregular watering intervals. While plants are resilient, consistent care helps them establish healthy growth patterns and reduces stress. Irregular watering can confuse the plant's natural cycles.`
            },
            {
              title: 'Benefits of Consistent Care',
              icon: CheckCircle2,
              items: [
                'Healthier, more predictable growth',
                'Easier to spot problems early',
                'Less plant stress and shock',
                'Better root development',
                'More reliable blooming for flowering plants',
                'Easier to establish a care routine'
              ]
            },
            {
              title: 'Tips for Building Consistency',
              icon: Lightbulb,
              items: [
                'Set recurring calendar reminders on your phone',
                'Pick a specific day of the week for each plant',
                'Use the SproutHub schedule notifications',
                'Create a simple watering checklist',
                'Link watering to an existing routine (like Sunday mornings)',
                'Keep a watering log to track patterns'
              ]
            },
            {
              title: 'Making It Sustainable',
              icon: Clock,
              items: [
                'Choose a schedule that realistically fits your lifestyle',
                'It\'s okay to adjust schedules seasonally',
                'Group plants with similar needs together',
                'Consider self-watering pots if you travel often',
                'Start with a flexible buffer - aim for a 1-2 day window'
              ]
            }
          ]
        };

      default:
        return null;
    }
  };

  const content = getInsightContent();
  if (!content) return null;

  const Icon = content.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', content.bgColor)}>
              <Icon className={cn('w-5 h-5', content.iconColor)} />
            </div>
            <div>
              <DialogTitle>{content.title}</DialogTitle>
              <DialogDescription>
                Expert guidance for {plantName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {content.sections.map((section, index) => {
            const SectionIcon = section.icon;
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <SectionIcon className="w-4 h-4 text-sprout-primary" />
                  <h3 className="font-medium text-base">{section.title}</h3>
                </div>

                {section.content && (
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                    {section.content}
                  </p>
                )}

                {section.items && (
                  <ul className="space-y-2 pl-6">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Droplets className="w-3 h-3 text-sprout-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {/* Call to Action */}
          <div className="pt-4 border-t">
            <div className="p-4 bg-sprout-pale/30 dark:bg-sprout-dark/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Remember</h4>
                  <p className="text-xs text-muted-foreground">
                    Every plant is unique, and these are general guidelines. Pay attention to how {plantName} responds to your care and adjust accordingly. When in doubt, check the soil moisture before watering.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Got It</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WateringInsightLearnMore;
