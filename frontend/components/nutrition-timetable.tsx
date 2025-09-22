import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Clock, Plus, Edit, Trash2, Utensils } from 'lucide-react';
import { useLanguage } from './language-context';

interface FeedingSchedule {
  id: string;
  time: string;
  feedType: string;
  quantity: string;
  notes: string;
  period: 'morning' | 'afternoon' | 'evening';
}

interface NutritionPlan {
  cattleType: string;
  weight: number;
  age: string;
  schedule: FeedingSchedule[];
}

const NutritionTimetable: React.FC = () => {
  const { t } = useLanguage();
  const [activePlan, setActivePlan] = useState<NutritionPlan>({
    cattleType: 'dairy-cow',
    weight: 500,
    age: 'adult',
    schedule: [
      {
        id: '1',
        time: '06:00',
        feedType: 'Fresh Grass',
        quantity: '15 kg',
        notes: 'Quality pasture grazing',
        period: 'morning'
      },
      {
        id: '2',
        time: '08:00',
        feedType: 'Concentrate Feed',
        quantity: '3 kg',
        notes: 'High protein mix',
        period: 'morning'
      },
      {
        id: '3',
        time: '12:00',
        feedType: 'Hay',
        quantity: '8 kg',
        notes: 'Good quality hay',
        period: 'afternoon'
      },
      {
        id: '4',
        time: '15:00',
        feedType: 'Water',
        quantity: '40 L',
        notes: 'Fresh, clean water',
        period: 'afternoon'
      },
      {
        id: '5',
        time: '18:00',
        feedType: 'Silage',
        quantity: '10 kg',
        notes: 'Corn silage',
        period: 'evening'
      },
      {
        id: '6',
        time: '20:00',
        feedType: 'Mineral Supplement',
        quantity: '50g',
        notes: 'Essential minerals',
        period: 'evening'
      }
    ]
  });

  const [newFeeding, setNewFeeding] = useState<Partial<FeedingSchedule>>({
    time: '',
    feedType: '',
    quantity: '',
    notes: '',
    period: 'morning'
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const cattleTypes = [
    { value: 'dairy-cow', label: 'Dairy Cow' },
    { value: 'beef-cattle', label: 'Beef Cattle' },
    { value: 'calf', label: 'Calf' },
    { value: 'bull', label: 'Bull' },
    { value: 'heifer', label: 'Heifer' }
  ];

  const feedTypes = [
    'Fresh Grass',
    'Hay',
    'Silage',
    'Concentrate Feed',
    'Grains (Corn/Barley)',
    'Protein Supplement',
    'Mineral Supplement',
    'Water',
    'Salt Block',
    'Root Vegetables'
  ];

  const handleAddFeeding = () => {
    if (newFeeding.time && newFeeding.feedType && newFeeding.quantity) {
      const feeding: FeedingSchedule = {
        id: Date.now().toString(),
        time: newFeeding.time!,
        feedType: newFeeding.feedType!,
        quantity: newFeeding.quantity!,
        notes: newFeeding.notes || '',
        period: determinePeriod(newFeeding.time!)
      };

      setActivePlan(prev => ({
        ...prev,
        schedule: [...prev.schedule, feeding].sort((a, b) => a.time.localeCompare(b.time))
      }));

      setNewFeeding({ time: '', feedType: '', quantity: '', notes: '', period: 'morning' });
      setShowAddForm(false);
    }
  };

  const handleDeleteFeeding = (id: string) => {
    setActivePlan(prev => ({
      ...prev,
      schedule: prev.schedule.filter(item => item.id !== id)
    }));
  };

  const determinePeriod = (time: string): 'morning' | 'afternoon' | 'evening' => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getScheduleByPeriod = (period: 'morning' | 'afternoon' | 'evening') => {
    return activePlan.schedule.filter(item => item.period === period);
  };

  const getTotalNutrition = () => {
    const totalProtein = Math.round(12 + Math.random() * 8); // Mock calculation
    const totalCarbs = Math.round(45 + Math.random() * 15);
    const totalFiber = Math.round(25 + Math.random() * 10);
    const totalCalories = Math.round(2800 + Math.random() * 400);

    return { totalProtein, totalCarbs, totalFiber, totalCalories };
  };

  const nutrition = getTotalNutrition();

  const generateRecommendations = () => {
    const recommendations = [];
    
    if (activePlan.cattleType === 'dairy-cow') {
      recommendations.push('Increase protein intake during lactation period');
      recommendations.push('Ensure adequate calcium for milk production');
    }
    
    if (activePlan.weight > 600) {
      recommendations.push('Monitor feed conversion ratio for large cattle');
    }
    
    recommendations.push('Provide fresh water constantly');
    recommendations.push('Adjust portions based on body condition score');
    
    return recommendations;
  };

  return (
    <div className="space-y-6">
      {/* Cattle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            {t('feedingSchedule')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cattle Type</label>
              <Select
                value={activePlan.cattleType}
                onValueChange={(value) => setActivePlan(prev => ({ ...prev, cattleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cattleTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Weight (kg)</label>
              <Input
                type="number"
                value={activePlan.weight}
                onChange={(e) => setActivePlan(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Age Category</label>
              <Select
                value={activePlan.age}
                onValueChange={(value) => setActivePlan(prev => ({ ...prev, age: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calf">Calf (0-1 year)</SelectItem>
                  <SelectItem value="young">Young (1-2 years)</SelectItem>
                  <SelectItem value="adult">Adult (2+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Schedule */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daily Feeding Schedule</CardTitle>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Feeding
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-4 border-dashed">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <Input
                    type="time"
                    placeholder="Time"
                    value={newFeeding.time}
                    onChange={(e) => setNewFeeding(prev => ({ ...prev, time: e.target.value }))}
                  />
                  <Select
                    value={newFeeding.feedType}
                    onValueChange={(value) => setNewFeeding(prev => ({ ...prev, feedType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Feed Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Quantity (e.g., 5 kg)"
                    value={newFeeding.quantity}
                    onChange={(e) => setNewFeeding(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={newFeeding.notes}
                    onChange={(e) => setNewFeeding(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddFeeding} size="sm">Add</Button>
                  <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="morning">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="morning">{t('morning')}</TabsTrigger>
              <TabsTrigger value="afternoon">{t('afternoon')}</TabsTrigger>
              <TabsTrigger value="evening">{t('evening')}</TabsTrigger>
            </TabsList>

            {['morning', 'afternoon', 'evening'].map(period => (
              <TabsContent key={period} value={period} className="space-y-3 mt-4">
                {getScheduleByPeriod(period as any).map(feeding => (
                  <Card key={feeding.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{feeding.time}</span>
                            <Badge variant="outline">{feeding.feedType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Quantity: <span className="font-medium">{feeding.quantity}</span>
                          </p>
                          {feeding.notes && (
                            <p className="text-sm text-muted-foreground">
                              Notes: {feeding.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFeeding(feeding.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getScheduleByPeriod(period as any).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No feeding scheduled for {period}
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Nutrition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Nutrition Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Protein</span>
                <span className="font-medium">{nutrition.totalProtein}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Carbohydrates</span>
                <span className="font-medium">{nutrition.totalCarbs}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fiber</span>
                <span className="font-medium">{nutrition.totalFiber}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Calories</span>
                <span className="font-medium">{nutrition.totalCalories} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {generateRecommendations().map((rec, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NutritionTimetable;