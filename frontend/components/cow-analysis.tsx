import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, Camera, FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import AnimatedContainer from './ui/animated-container';
import { IoVideocam } from "react-icons/io5";

interface CowAnalysisData {
  height: number;
  length: number;
  angle: number;
  bodyCondition: number;
  overallScore: number;
  confidence: number;
  recommendations: string[];
}

const CowAnalysis: React.FC = () => {
  const { t } = useTranslation('common');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<CowAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [measurementsData, setMeasurementsData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isVideoFile = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedMedia(e.target?.result as string);
        setIsVideo(isVideoFile);
        setError(null);
        setAnalysisData(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const file = fileInputRef.current.files[0];
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/upload/', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg = errBody?.message || `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      const payload = await res.json();
      const data = payload?.data;
      const measurements = data?.measurements || {};

      // Get confidence from first detection
      const confidence = data?.detections?.[0]?.confidence ?? 0;
      
      const uiData: CowAnalysisData = {
        height: Math.round(measurements.height_cm ?? measurements.height_px ?? 0),
        length: Math.round(measurements.body_length_cm ?? measurements.body_length_px ?? 0),
        angle: Math.round(measurements.back_angle_deg ?? 0),
        bodyCondition: Math.max(1, Math.min(5, Math.round((measurements.score_0_100 ?? 50) / 20))),
        overallScore: Math.round(measurements.score_0_100 ?? 0),
        confidence: Math.round(confidence * 100),
        recommendations: [
          'Maintain current feeding schedule',
          'Monitor weight gain weekly',
          'Ensure adequate water supply',
          'Regular veterinary checkups recommended',
        ],
      };

      // Set image ID and timestamp
      setImageId(data?.id || '');
      setTimestamp(data?.timestamp || '');
      setMeasurementsData(data?.measurements);

      setAnalysisData(uiData);

      const storedAnalyses = JSON.parse(localStorage.getItem('cowAnalyses') || '[]');
      const newAnalysis = {
        id: data?.id || Date.now().toString(),
        timestamp: data?.timestamp || new Date().toISOString(),
        data: uiData,
        imageUrl: data?.file_url || selectedMedia,
      };
      storedAnalyses.push(newAnalysis);
      localStorage.setItem('cowAnalyses', JSON.stringify(storedAnalyses));
    } catch (err: any) {
      setError(err?.message || t('analysisError') || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      <AnimatedContainer>
        <div className="relative">
          <div className="absolute inset-0 bg-[#131826] color-black rounded-lg blur"></div>
          <Card className="relative bg-background/50 backdrop-blur-sm border border-blue-500/20">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-400" />
                <span className="text-white color-black leading-normal">{t('uploadImageOrVideo')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <AnimatedContainer className="w-full">
                <div>
                  {/* Image Upload */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-lg p-6 space-y-4 bg-transparent">
                    {selectedMedia ? (
                      <div className="relative">
                        {isVideo ? (
                          <video
                            src={selectedMedia}
                            controls
                            className="max-w-full max-h-64 rounded-lg shadow-lg align-middle"
                            style={{ marginBottom: '6px' }}
                          />
                        ) : (
                          <img
                            src={selectedMedia}
                            alt="Selected cow"
                            className="max-w-full max-h-64 rounded-lg shadow-lg align-middle"
                            style={{ marginBottom: '6px' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (fileInputRef.current?.files?.[0]) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  target.src = event.target?.result as string;
                                };
                                reader.readAsDataURL(fileInputRef.current.files[0]);
                              }
                            }}
                          />
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedMedia(null);
                            setIsVideo(false);
                            setAnalysisData(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload cow image or video for analysis
                        </p>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {selectedMedia ? 'Change File' : 'Upload File'}
                    </Button>
                  </div>

                  {/* Analyze Button */}
                  {selectedMedia && !analysisData && (
                    <Button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="w-full mt-4"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('analyzing')}
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" color={"black"}/>
                          {t('startAnalysis')}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mt-4">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}
                </div>
              </AnimatedContainer>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>

      {analysisData && (
        <AnimatedContainer>
          <div className="relative">
            <div className="absolute inset-0 bg-blue rounded-lg blur"></div>
            <Card className="relative bg-card/80 backdrop-blur-lg border border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-green-400" />
                  <span className="bg-black bg-clip-text color-black">
                    {t('analysisComplete')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatedContainer>
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-medium">{t('overallScore')}</h3>
                      <div className="flex items-center justify-center gap-2">
                        <div className={`${getScoreColor(analysisData.overallScore)} text-white px-4 py-2 rounded-full`}>
                          {analysisData.overallScore}/100
                        </div>
                        <Badge variant="secondary">
                          {getScoreLabel(analysisData.overallScore)}
                        </Badge>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><span className="font-medium">Image ID:</span> {imageId}</p>
                      <p><span className="font-medium">Timestamp:</span> {timestamp && new Date(timestamp).toLocaleString()}</p>
                    </div>

                    {/* Confidence Bar */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Detection Confidence</span>
                          <span className="font-semibold">{analysisData.confidence}%</span>
                        </div>
                        <Progress value={analysisData.confidence} className="h-2" />
                      </CardContent>
                    </Card>

                    {/* Measurements */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-muted-foreground">Height</p>
                          <p className="text-xl font-semibold text-blue-400">
                            {analysisData.height} {measurementsData?.height_cm ? 'cm' : 'px'}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-muted-foreground">Length</p>
                          <p className="text-xl font-semibold text-purple-400">
                            {analysisData.length} {measurementsData?.body_length_cm ? 'cm' : 'px'}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-muted-foreground">Angle</p>
                          <p className="text-xl font-semibold text-yellow-400">{analysisData.angle}°</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Body Condition */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Body Condition Score</span>
                          <span className="font-semibold">{analysisData.bodyCondition}/5</span>
                        </div>
                        <Progress value={analysisData.bodyCondition * 20} className="mt-2" />
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Recommendations:</h4>
                      <ul className="space-y-1">
                        {analysisData.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AnimatedContainer>
              </CardContent>
            </Card>
          </div>
        </AnimatedContainer>
      )}
    </div>
  );
};

export default CowAnalysis;
