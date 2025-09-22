import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Upload, Video } from 'lucide-react';
import { IoVideocam } from "react-icons/io5";


const LamenessAnalysis: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [lamenessResult, setLamenessResult] = useState<string | null>(null);
  const { t } = useTranslation('common');
  const fileRef = useRef<HTMLInputElement>(null);

  const generateLamenessResult = () => {
    // Generate random yes/no result
    const isLame = Math.random() < 0.3; // 30% chance of being lame
    setLamenessResult(isLame ? 'Yes' : 'No');
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-[#151825] rounded-lg"></div>
        <Card className="relative border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IoVideocam className="h-5 w-5" color={"#6d94da"} />
              <span className="text-white bg-clip-text text-transparent leading-normal pb-1">{t('lamenessAnalysis')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 space-y-4">
                {selectedVideo ? (
                  <div className="relative w-full">
                    <video src={selectedVideo} controls className="max-w-full max-h-64 rounded-lg shadow-lg align-middle" style={{ marginBottom: '6px' }} />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSelectedVideo(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload video</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setSelectedVideo(ev.target?.result as string);
                      generateLamenessResult(); // Generate random result when video is selected
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <Button variant="outline" className="flex items-center gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {selectedVideo ? 'Change Video' : 'Upload Video'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lameness Detection Result */}
      {selectedVideo && lamenessResult && (
        <div className="relative">
          <div className="absolute inset-0 bg-[#151825] rounded-lg blur"></div>
          <Card className="relative border">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Lameness Detection Result</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Lameness Detected:</span>
                  <span className={`text-xl font-bold ${lamenessResult === 'Yes' ? 'text-red-500' : 'text-green-500'}`}>
                    {lamenessResult}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {lamenessResult === 'Yes' 
                    ? 'This cow shows signs of lameness and may need veterinary attention.' 
                    : 'This cow appears to be walking normally with no signs of lameness.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LamenessAnalysis;


