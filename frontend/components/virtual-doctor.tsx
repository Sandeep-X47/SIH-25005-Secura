import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Send, Bot, User, Plus, Stethoscope, AlertTriangle, CheckCircle, XCircle, Mic, MicOff, Loader2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HealthQuestion {
  id: string;
  question: string;
  type: 'yesno' | 'multiple' | 'scale' | 'text';
  options?: string[];
  category: 'general' | 'behavioral' | 'physical' | 'nutritional' | 'reproductive';
  weight: number;
}

interface HealthAssessment {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  urgentActions: string[];
  followUp: string[];
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'doctor';
  timestamp: Date;
  type?: 'question' | 'answer' | 'assessment' | 'recommendation' | 'general';
  questionId?: string;
}

const VirtualDoctor: React.FC = () => {
  const { t } = useTranslation('common');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [healthAssessment, setHealthAssessment] = useState<HealthAssessment | null>(null);
  const [chatMode, setChatMode] = useState<'general' | 'assessment'>('general');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Supported languages for speech recognition
  const supportedLanguages = [
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
  ];

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
      id: 'body_condition',
      question: 'How would you rate the animal\'s body condition?',
      type: 'multiple',
      options: ['Excellent (well-muscled)', 'Good', 'Fair', 'Poor (thin)', 'Very poor (emaciated)'],
      category: 'physical',
      weight: 3
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
      id: 'lameness',
      question: 'Does the animal show any signs of lameness or difficulty walking?',
      type: 'yesno',
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
      id: 'temperature',
      question: 'Have you checked the animal\'s temperature?',
      type: 'yesno',
      category: 'physical',
      weight: 2
    },
    {
      id: 'feed_intake',
      question: 'How much feed is the animal consuming compared to normal?',
      type: 'multiple',
      options: ['More than normal', 'Normal amount', 'Slightly less', 'Significantly less', 'Hardly eating'],
      category: 'nutritional',
      weight: 2
    }
  ];

  useEffect(() => {
    // Initialize with simple hello message
    if (messages.length === 0) {
      const helloMessage: Message = {
        id: 'hello',
        text: 'Hello!',
        sender: 'doctor',
        timestamp: new Date(),
        type: 'general'
      };
      setMessages([helloMessage]);
    }

    // Initialize speech recognition
    initializeSpeechRecognition();
  }, []);

  const initializeSpeechRecognition = () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage;
      
      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      setSpeechSupported(true);
    } else if (typeof window !== 'undefined' && 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage;
      
      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      setSpeechSupported(true);
    }
  };

  // Reinitialize speech recognition when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage;
    }
  }, [selectedLanguage]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const generateDoctorResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for assessment request
    if (lowerMessage.includes('assessment') || lowerMessage.includes('health check') || lowerMessage.includes('evaluate')) {
      setChatMode('assessment');
      setCurrentQuestionIndex(0);
      setAnswers({});
      setAssessmentComplete(false);
      setHealthAssessment(null);
      return '🔍 **Starting Health Assessment**\n\nI\'ll ask you a series of questions to evaluate your animal\'s health. This will help identify potential issues and provide recommendations.\n\nLet\'s begin with the first question...';
    }
    
    // Check for general chat mode
    if (lowerMessage.includes('general') || lowerMessage.includes('chat') || lowerMessage.includes('question')) {
      setChatMode('general');
      return '💬 **Switched to General Chat Mode**\n\nFeel free to ask me any questions about cattle health, nutrition, breeding, or management practices!';
    }

    // Fallback responses for common questions when API is not available
    const getFallbackResponse = (message: string): string => {
      const msg = message.toLowerCase();
      
      if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return "Hello! I'm your virtual veterinary assistant. How can I help you with your cattle today?";
      }
      
      if (msg.includes('sick') || msg.includes('ill') || msg.includes('disease') || msg.includes('problem')) {
        return "I understand you're concerned about a sick animal. Can you describe the symptoms? Common signs include loss of appetite, lethargy, abnormal breathing, or changes in behavior. It's important to isolate the animal and contact a local veterinarian for proper diagnosis.";
      }
      
      if (msg.includes('feed') || msg.includes('nutrition') || msg.includes('food') || msg.includes('diet')) {
        return "Proper nutrition is crucial for cattle health. Adult cattle typically need 2-3% of their body weight in dry matter daily. Ensure access to clean water (30-50 gallons per day), quality forage, and appropriate supplements. Would you like specific feeding recommendations based on your cattle's age or condition?";
      }
      
      if (msg.includes('pregnancy') || msg.includes('pregnant') || msg.includes('breeding') || msg.includes('calf')) {
        return "Pregnant cattle require special care. Gestation period is about 283 days. Ensure proper nutrition with increased protein and energy intake, especially in the last trimester. Regular veterinary checkups are essential. Keep detailed breeding records and prepare a clean calving area.";
      }
      
      if (msg.includes('vaccine') || msg.includes('vaccination') || msg.includes('immunization')) {
        return "Vaccination schedules vary by region and herd conditions. Common vaccines include those for respiratory diseases, clostridial diseases, and reproductive diseases. Consult with your local veterinarian to develop an appropriate vaccination program based on your area's disease risks.";
      }
      
      if (msg.includes('milk') || msg.includes('milking') || msg.includes('production')) {
        return "Milk production depends on breed, nutrition, and management. Ensure hygienic milking practices, proper udder health management, and maintain consistent milking schedules. Average daily production varies greatly by breed - dairy breeds can produce 20-40+ liters per day.";
      }
      
      if (msg.includes('temperature') || msg.includes('fever') || msg.includes('hot')) {
        return "Normal cattle body temperature is 101.5°F (38.6°C). Temperatures above 103°F (39.4°C) indicate fever. Check for other symptoms like reduced appetite, lethargy, or labored breathing. Contact a veterinarian if fever persists or if the animal shows other concerning symptoms.";
      }
      
      if (msg.includes('lameness') || msg.includes('limp') || msg.includes('walking') || msg.includes('leg')) {
        return "Lameness in cattle can be caused by various factors including foot rot, laminitis, or joint issues. Provide a clean, dry resting area and limit movement. If lameness persists or worsens, consult a veterinarian for proper diagnosis and treatment.";
      }
      
      if (msg.includes('breathing') || msg.includes('cough') || msg.includes('respiratory')) {
        return "Respiratory issues in cattle can be serious. Monitor for coughing, nasal discharge, labored breathing, or fever. Ensure good ventilation and reduce dust. If symptoms persist, contact a veterinarian immediately as respiratory diseases can spread quickly through the herd.";
      }
      
      return "Thank you for your question. While I can provide general guidance, for specific health concerns, I recommend consulting with a local veterinarian who can examine your cattle in person. Is there a particular aspect of cattle health or management you'd like to know more about?";
    };

    try {
      console.log('Calling chat API with message:', userMessage);
      
      // Call Llama API for dynamic responses
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: 'cattle_health_veterinary_assistant',
          conversation_history: messages.slice(-10).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      if (data.status === 'success' && data.response) {
        return data.response;
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error calling chat API:', error);
      
      // Use fallback responses when API is not available
      console.log('Using fallback response system');
      return getFallbackResponse(userMessage);
    }
  };

  const askNextQuestion = () => {
    if (currentQuestionIndex >= healthQuestions.length) {
      completeAssessment();
      return;
    }

    const question = healthQuestions[currentQuestionIndex];
    const questionMessage: Message = {
      id: `question_${question.id}`,
      text: `**Question ${currentQuestionIndex + 1}/${healthQuestions.length}**\n\n${question.question}`,
      sender: 'doctor',
      timestamp: new Date(),
      type: 'question',
      questionId: question.id
    };

    setMessages(prev => [...prev, questionMessage]);
  };

  const handleAnswer = (answer: any) => {
    const currentQuestion = healthQuestions[currentQuestionIndex];
    const answerMessage: Message = {
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

    healthQuestions.forEach(question => {
      const answer = answers[question.id];
      if (answer === undefined) return;

      maxScore += question.weight * 4;

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

        default:
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

    const assessmentMessage: Message = {
      id: 'assessment_complete',
      text: '🎯 **Health Assessment Complete!**\n\nI\'ve analyzed all your responses and prepared a comprehensive health evaluation for your animal.',
      sender: 'doctor',
      timestamp: new Date(),
      type: 'assessment'
    };

    setMessages(prev => [...prev, assessmentMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'general'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Check if starting assessment
    if (inputValue.toLowerCase().includes('assessment') || inputValue.toLowerCase().includes('health check')) {
    setTimeout(() => {
        setChatMode('assessment');
        askNextQuestion();
        setIsTyping(false);
      }, 1500);
      return;
    }

    try {
      // Get response from Llama
      const responseText = await generateDoctorResponse(inputValue);
      
      const doctorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'doctor',
        timestamp: new Date(),
        type: 'general'
      };

      setMessages(prev => [...prev, doctorResponse]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble processing your request right now. Please try again.',
        sender: 'doctor',
        timestamp: new Date(),
        type: 'general'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setSpeechError(null);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getLanguagePlaceholder = () => {
    const currentLang = supportedLanguages.find(lang => lang.code === selectedLanguage);
    const langName = currentLang?.name || 'English';
    
    if (!speechSupported) {
      return `Type your message or 'assessment' to start health check...`;
    }
    
    switch (selectedLanguage) {
      case 'hi-IN':
        return `अपना संदेश टाइप करें, 'assessment' कहें स्वास्थ्य जांच के लिए, या बोलने के लिए माइक पर क्लिक करें...`;
      case 'ta-IN':
        return `உங்கள் செய்தியை தட்டச்சு செய்யுங்கள், 'assessment' என்று சொல்லுங்கள் சுகாதார சோதனைக்கு, அல்லது பேச மைக் கிளிக் செய்யுங்கள்...`;
      default:
        return `Type your message, say 'assessment' for health check, or click mic to speak...`;
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

  const resetAssessment = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setAssessmentComplete(false);
    setHealthAssessment(null);
    setChatMode('general');
    const resetMessage: Message = {
      id: 'reset',
      text: '🔄 Assessment reset. You can start a new health assessment by typing "assessment" or ask me any general questions!',
      sender: 'doctor',
      timestamp: new Date(),
      type: 'general'
    };
    setMessages(prev => [...prev, resetMessage]);
  };

  return (
    <div className="relative min-h-[600px] max-h-[800px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg blur"></div>
      <Card className="relative h-full flex flex-col bg-card/80 backdrop-blur-lg border border-purple-500/20">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-400" />
            <span className="bg-white bg-clip-text text-transparent">Virtual Doctor</span>
            {assessmentComplete && healthAssessment && (
              <Badge className={`ml-auto ${getRiskLevelColor(healthAssessment.riskLevel)} text-white`}>
                {healthAssessment.riskLevel.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'doctor' && (
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
              {chatMode === 'assessment' && !assessmentComplete && currentQuestionIndex < healthQuestions.length && (
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
        
          <div className="p-4 border-t flex-shrink-0">
            {/* Speech Error Display */}
            {speechError && (
              <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-300">{speechError}</p>
              </div>
            )}
            
            {/* Speech Status Display */}
            {isListening && (
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Listening in {supportedLanguages.find(lang => lang.code === selectedLanguage)?.name}... Speak now
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Voice Language:</span>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const userMessage: Message = {
                      id: Date.now().toString(),
                      text: `[Uploaded file] ${file.name}`,
                      sender: 'user',
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, userMessage]);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload file"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {/* Speech Recognition Button */}
                {speechSupported && (
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleListening}
                    disabled={isTyping}
                    title={isListening ? "Stop listening" : "Start voice input"}
                    className={isListening ? "animate-pulse" : ""}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getLanguagePlaceholder()}
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Speech Support Notice */}
            {!speechSupported && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Voice input not supported in this browser. Please use Chrome, Edge, or Safari for voice features.
              </p>
            )}
          </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default VirtualDoctor;