import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Send, Bot, User, Stethoscope, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HealthQuestion {
  id: string;
  question: string;
  type: 'yesno' | 'multiple' | 'scale' | 'text';
  options?: string[];
  category: 'general' | 'behavioral' | 'physical' | 'nutritional' | 'reproductive';
  weight: number; // Importance weight for scoring
}

interface HealthAssessment {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  urgentActions: string[];
  followUp: string[];
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'question' | 'answer' | 'assessment' | 'recommendation';
  questionId?: string;
}

const CattleHealthChatbot: React.FC = () => {
  const { t } = useTranslation('common');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [healthAssessment, setHealthAssessment] = useState<HealthAssessment | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const healthQuestions: HealthQuestion[] = [
    // General Health Questions
    {
      id: 'animal_type',
      question: 'What type of animal are you concerned about?',
      type: 'multiple',
      options: ['Cow (Dairy)', 'Cow (Beef)', 'Buffalo', 'Calf (Under 6 months)', 'Heifer (6-24 months)'],
      category: 'general',
      weight: 1
    },
    {
      id: 'age',
      question: 'What is the approximate age of your animal?',
      type: 'multiple',
      options: ['Under 6 months', '6-12 months', '1-2 years', '2-5 years', 'Over 5 years'],
      category: 'general',
      weight: 1
    },
    {
      id: 'breed',
      question: 'What breed is your animal? (Optional)',
      type: 'text',
      category: 'general',
      weight: 0.5
    },

    // Behavioral Questions
    {
      id: 'appetite',
      question: 'How is the animal\'s appetite?',
      type: 'multiple',
      options: ['Normal', 'Slightly reduced', 'Significantly reduced', 'No appetite at all'],
      category: 'behavioral',
      weight: 3
    },
    {
      id: 'activity_level',
      question: 'How active is the animal?',
      type: 'multiple',
      options: ['Very active', 'Normal activity', 'Slightly lethargic', 'Very lethargic', 'Lying down most of the time'],
      category: 'behavioral',
      weight: 2
    },
    {
      id: 'social_behavior',
      question: 'How is the animal interacting with the herd?',
      type: 'multiple',
      options: ['Normal interaction', 'Slightly isolated', 'Very isolated', 'Aggressive behavior', 'Submissive behavior'],
      category: 'behavioral',
      weight: 1
    },

    // Physical Symptoms
    {
      id: 'body_condition',
      question: 'How would you rate the animal\'s body condition?',
      type: 'multiple',
      options: ['Excellent (well-muscled)', 'Good', 'Fair', 'Poor (thin)', 'Very poor (emaciated)'],
      category: 'physical',
      weight: 3
    },
    {
      id: 'temperature',
      question: 'Have you checked the animal\'s temperature?',
      type: 'yesno',
      category: 'physical',
      weight: 2
    },
    {
      id: 'temperature_value',
      question: 'What is the temperature reading? (if checked)',
      type: 'text',
      category: 'physical',
      weight: 2
    },
    {
      id: 'breathing',
      question: 'How is the animal\'s breathing?',
      type: 'multiple',
      options: ['Normal', 'Slightly labored', 'Heavy breathing', 'Very labored', 'Coughing'],
      category: 'physical',
      weight: 3
    },
    {
      id: 'discharge',
      question: 'Is there any unusual discharge from nose, eyes, or mouth?',
      type: 'yesno',
      category: 'physical',
      weight: 2
    },
    {
      id: 'lameness',
      question: 'Does the animal show any signs of lameness or difficulty walking?',
      type: 'yesno',
      category: 'physical',
      weight: 3
    },
    {
      id: 'swelling',
      question: 'Are there any visible swellings or lumps on the body?',
      type: 'yesno',
      category: 'physical',
      weight: 2
    },

    // Nutritional Questions
    {
      id: 'feed_intake',
      question: 'How much feed is the animal consuming compared to normal?',
      type: 'multiple',
      options: ['More than normal', 'Normal amount', 'Slightly less', 'Significantly less', 'Hardly eating'],
      category: 'nutritional',
      weight: 2
    },
    {
      id: 'water_intake',
      question: 'How is the animal\'s water consumption?',
      type: 'multiple',
      options: ['Normal', 'Increased', 'Decreased', 'Very little water'],
      category: 'nutritional',
      weight: 2
    },
    {
      id: 'feed_quality',
      question: 'Has there been any change in feed quality or type recently?',
      type: 'yesno',
      category: 'nutritional',
      weight: 1
    },

    // Reproductive Questions (for females)
    {
      id: 'pregnancy_status',
      question: 'Is the animal pregnant?',
      type: 'yesno',
      category: 'reproductive',
      weight: 2
    },
    {
      id: 'milk_production',
      question: 'If lactating, how is milk production?',
      type: 'multiple',
      options: ['Normal', 'Slightly decreased', 'Significantly decreased', 'No milk production', 'Not applicable'],
      category: 'reproductive',
      weight: 2
    },
    {
      id: 'breeding_history',
      question: 'When was the last breeding/insemination? (if known)',
      type: 'text',
      category: 'reproductive',
      weight: 1
    }
  ];

  useEffect(() => {
    // Start the assessment
    if (messages.length === 0) {
      startAssessment();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const startAssessment = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: '🐄 Welcome to the Cattle Health Assessment Chatbot! I\'ll help you evaluate your animal\'s health through a series of questions. This assessment will help identify potential health issues and provide recommendations. Let\'s begin!',
      sender: 'bot',
      timestamp: new Date(),
      type: 'question'
    };
    setMessages([welcomeMessage]);
    
    setTimeout(() => {
      askNextQuestion();
    }, 2000);
  };

  const askNextQuestion = () => {
    if (currentQuestionIndex >= healthQuestions.length) {
      completeAssessment();
      return;
    }

    const question = healthQuestions[currentQuestionIndex];
    const questionMessage: ChatMessage = {
      id: `question_${question.id}`,
      text: `**Question ${currentQuestionIndex + 1}/${healthQuestions.length}**\n\n${question.question}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'question',
      questionId: question.id
    };

    setMessages(prev => [...prev, questionMessage]);
  };

  const handleAnswer = (answer: any) => {
    const currentQuestion = healthQuestions[currentQuestionIndex];
    const answerMessage: ChatMessage = {
      id: `answer_${currentQuestion.id}`,
      text: typeof answer === 'string' ? answer : answer.toString(),
      sender: 'user',
      timestamp: new Date(),
      type: 'answer'
    };

    setMessages(prev => [...prev, answerMessage]);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    
    setIsTyping(true);
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsTyping(false);
      askNextQuestion();
    }, 1000);
  };

  const calculateHealthScore = (): HealthAssessment => {
    let totalScore = 0;
    let maxScore = 0;
    const recommendations: string[] = [];
    const urgentActions: string[] = [];
    const followUp: string[] = [];

    // Calculate score based on answers
    healthQuestions.forEach(question => {
      const answer = answers[question.id];
      if (answer === undefined) return;

      maxScore += question.weight * 4; // Max score per question is 4

      switch (question.id) {
        case 'appetite':
          if (answer === 'No appetite at all') {
            totalScore += question.weight * 0;
            urgentActions.push('🚨 URGENT: Animal has no appetite - immediate veterinary attention required');
          } else if (answer === 'Significantly reduced') {
            totalScore += question.weight * 1;
            urgentActions.push('⚠️ Animal has significantly reduced appetite - monitor closely');
          } else if (answer === 'Slightly reduced') {
            totalScore += question.weight * 2;
            recommendations.push('Monitor feed intake and consider dietary adjustments');
          } else {
            totalScore += question.weight * 4;
          }
          break;

        case 'activity_level':
          if (answer === 'Lying down most of the time') {
            totalScore += question.weight * 0;
            urgentActions.push('🚨 URGENT: Animal is extremely lethargic - immediate veterinary attention required');
          } else if (answer === 'Very lethargic') {
            totalScore += question.weight * 1;
            urgentActions.push('⚠️ Animal is very lethargic - monitor closely and consider veterinary consultation');
          } else if (answer === 'Slightly lethargic') {
            totalScore += question.weight * 2;
            recommendations.push('Monitor activity levels and check for other symptoms');
          } else {
            totalScore += question.weight * 4;
          }
          break;

        case 'body_condition':
          if (answer === 'Very poor (emaciated)') {
            totalScore += question.weight * 0;
            urgentActions.push('🚨 URGENT: Animal is emaciated - immediate veterinary attention and nutritional support required');
          } else if (answer === 'Poor (thin)') {
            totalScore += question.weight * 1;
            urgentActions.push('⚠️ Animal is underweight - nutritional assessment and veterinary consultation needed');
          } else if (answer === 'Fair') {
            totalScore += question.weight * 2;
            recommendations.push('Improve nutrition and body condition');
          } else {
            totalScore += question.weight * 4;
          }
          break;

        case 'breathing':
          if (answer === 'Very labored' || answer === 'Coughing') {
            totalScore += question.weight * 0;
            urgentActions.push('🚨 URGENT: Severe breathing problems - immediate veterinary attention required');
          } else if (answer === 'Heavy breathing') {
            totalScore += question.weight * 1;
            urgentActions.push('⚠️ Breathing difficulties - monitor closely and consider veterinary consultation');
          } else if (answer === 'Slightly labored') {
            totalScore += question.weight * 2;
            recommendations.push('Monitor breathing and check for respiratory issues');
          } else {
            totalScore += question.weight * 4;
          }
          break;

        case 'lameness':
          if (answer === true) {
            totalScore += question.weight * 1;
            urgentActions.push('⚠️ Animal shows lameness - veterinary examination recommended');
            recommendations.push('Provide comfortable resting area and limit movement');
          } else {
            totalScore += question.weight * 4;
          }
          break;

        case 'discharge':
          if (answer === true) {
            totalScore += question.weight * 1;
            urgentActions.push('⚠️ Unusual discharge detected - veterinary examination recommended');
          } else {
            totalScore += question.weight * 4;
          }
          break;

        case 'swelling':
          if (answer === true) {
            totalScore += question.weight * 1;
            urgentActions.push('⚠️ Swellings detected - veterinary examination recommended');
          } else {
            totalScore += question.weight * 4;
          }
          break;

        case 'temperature':
          if (answer === true && answers['temperature_value']) {
            const temp = parseFloat(answers['temperature_value']);
            if (temp > 103 || temp < 100) {
              totalScore += question.weight * 0;
              urgentActions.push('🚨 URGENT: Abnormal temperature - immediate veterinary attention required');
            } else {
              totalScore += question.weight * 4;
            }
          } else {
            totalScore += question.weight * 2; // Partial score if not checked
          }
          break;

        default:
          // For other questions, give full score for now
          totalScore += question.weight * 3;
          break;
      }
    });

    const percentage = (totalScore / maxScore) * 100;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (percentage >= 80) {
      riskLevel = 'low';
      recommendations.push('✅ Animal appears to be in good health - continue current management practices');
    } else if (percentage >= 60) {
      riskLevel = 'medium';
      recommendations.push('⚠️ Some health concerns detected - monitor closely and consider preventive measures');
    } else if (percentage >= 40) {
      riskLevel = 'high';
      recommendations.push('🚨 Multiple health concerns detected - veterinary consultation strongly recommended');
    } else {
      riskLevel = 'critical';
      recommendations.push('🚨 CRITICAL: Multiple serious health issues detected - immediate veterinary attention required');
    }

    // Add general recommendations
    if (riskLevel !== 'low') {
      recommendations.push('📋 Keep detailed health records and monitor daily');
      recommendations.push('🏥 Schedule regular veterinary checkups');
      recommendations.push('🍽️ Ensure proper nutrition and clean water access');
    }

    followUp.push('📅 Schedule follow-up assessment in 1-2 weeks');
    followUp.push('📊 Continue monitoring the animal\'s condition daily');
    followUp.push('📞 Contact your veterinarian if symptoms worsen');

    return {
      score: Math.round(percentage),
      riskLevel,
      recommendations,
      urgentActions,
      followUp
    };
  };

  const completeAssessment = () => {
    const assessment = calculateHealthScore();
    setHealthAssessment(assessment);
    setAssessmentComplete(true);

    const assessmentMessage: ChatMessage = {
      id: 'assessment_complete',
      text: '🎯 **Health Assessment Complete!**\n\nI\'ve analyzed all your responses and prepared a comprehensive health evaluation for your animal.',
      sender: 'bot',
      timestamp: new Date(),
      type: 'assessment'
    };

    setMessages(prev => [...prev, assessmentMessage]);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Stethoscope className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderQuestionOptions = (question: HealthQuestion) => {
    if (question.type === 'yesno') {
      return (
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => handleAnswer(true)}
            variant="outline"
            size="sm"
          >
            Yes
          </Button>
          <Button
            onClick={() => handleAnswer(false)}
            variant="outline"
            size="sm"
          >
            No
          </Button>
        </div>
      );
    }

    if (question.type === 'multiple' && question.options) {
      return (
        <div className="grid grid-cols-1 gap-2 mt-3">
          {question.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleAnswer(option)}
              variant="outline"
              size="sm"
              className="justify-start text-left"
            >
              {option}
            </Button>
          ))}
        </div>
      );
    }

    if (question.type === 'text') {
      return (
        <div className="mt-3">
          <Input
            placeholder="Type your answer here..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                handleAnswer(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      );
    }

    return null;
  };

  const resetAssessment = () => {
    setMessages([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setAssessmentComplete(false);
    setHealthAssessment(null);
    startAssessment();
  };

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg blur"></div>
      <Card className="relative h-full flex flex-col bg-card/80 backdrop-blur-lg border border-green-500/20">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-400" />
            <span className="bg-white bg-clip-text text-transparent">Cattle Health Assessment</span>
            {assessmentComplete && healthAssessment && (
              <Badge className={`ml-auto ${getRiskLevelColor(healthAssessment.riskLevel)} text-white`}>
                {healthAssessment.riskLevel.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4 h-0" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Current Question */}
              {!assessmentComplete && currentQuestionIndex < healthQuestions.length && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg max-w-[85%]">
                    <div className="text-sm whitespace-pre-wrap">
                      {healthQuestions[currentQuestionIndex] && (
                        <>
                          **Question {currentQuestionIndex + 1}/{healthQuestions.length}**
                          {'\n\n'}
                          {healthQuestions[currentQuestionIndex].question}
                          {renderQuestionOptions(healthQuestions[currentQuestionIndex])}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Health Assessment Results */}
              {assessmentComplete && healthAssessment && (
                <div className="space-y-4">
                  {/* Score and Risk Level */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      {getRiskLevelIcon(healthAssessment.riskLevel)}
                      <h3 className="text-lg font-semibold">Health Assessment Results</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Health Score</span>
                        <span className="text-lg font-bold">{healthAssessment.score}%</span>
                      </div>
                      <Progress value={healthAssessment.score} className="h-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Risk Level</span>
                        <Badge className={getRiskLevelColor(healthAssessment.riskLevel)}>
                          {healthAssessment.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Urgent Actions */}
                  {healthAssessment.urgentActions.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">🚨 Urgent Actions Required</h4>
                      <ul className="space-y-1">
                        {healthAssessment.urgentActions.map((action, index) => (
                          <li key={index} className="text-sm text-red-700 dark:text-red-300">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Recommendations</h4>
                    <ul className="space-y-1">
                      {healthAssessment.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-700 dark:text-blue-300">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Follow-up */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">📋 Follow-up Actions</h4>
                    <ul className="space-y-1">
                      {healthAssessment.followUp.map((action, index) => (
                        <li key={index} className="text-sm text-green-700 dark:text-green-300">
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Reset Button */}
                  <div className="flex justify-center pt-4">
                    <Button onClick={resetAssessment} variant="outline">
                      Start New Assessment
                    </Button>
                  </div>
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CattleHealthChatbot;
