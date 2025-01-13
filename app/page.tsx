"use client";

import {
  Upload,
  ImageIcon,
  AlertTriangle,
  CheckCircle,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  ImageDetectionService,
  PredictionResult,
} from "@/lib/services/imageDetection";
import axios from "axios";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [camMapImage, setCamMapImage] = useState<string | null>(null); // New state for CAM map
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isServerHealthy, setIsServerHealthy] = useState(false); // Nouvel état pour la santé du serveur
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setPrediction(null);
      setCamMapImage(null);

      // Create preview
      const imagePreview = await ImageDetectionService.createImagePreview(file);
      setImage(imagePreview);

      // Analyze image
      const result = await ImageDetectionService.analyzeImage(file);
      setPrediction(result);

      if (result.cam_map) {
        const camMapBase64 = generateCamMapImage(result.cam_map);
        setCamMapImage(camMapBase64);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCamMapImage = (camMap: number[][]): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const width = camMap[0].length;
    const height = camMap.length;

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx?.createImageData(width, height);
    if (!imageData) return "";

    const data = imageData.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = camMap[y][x];
        const index = (y * width + x) * 4;

        data[index] = value;
        data[index + 1] = 0;
        data[index + 2] = 255 - value;
        data[index + 3] = 255;
      }
    }

    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }

    // Return the base64 image
    return canvas.toDataURL();
  };

  useEffect(() => {
    (async () => {
      try {
        const { status, data } = await axios.get(
          `${process.env.NEXT_PUBLIC_BACK_URL}/healthcheck`
        );
        setIsServerHealthy(status === 200 && data.status === "ok");
      } catch {
        setIsServerHealthy(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Fake Image Detector
          </h1>
          <p className="text-muted-foreground">
            Upload an image to check if it&apos;s AI-generated or authentic
          </p>
        </div>

        <Card className="p-8">
          <div className="space-y-8">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 transition-all",
                "hover:border-primary/50 hover:bg-muted/50",
                "flex flex-col items-center justify-center gap-4",
                image ? "border-primary" : "border-muted-foreground/25"
              )}
            >
              {image ? (
                <div className="relative w-full aspect-video">
                  <img
                    src={image}
                    alt="Uploaded image"
                    className="rounded-lg object-contain w-full h-full max-w-full max-h-full mx-auto"
                    style={{ maxWidth: "70%", maxHeight: "100%" }}
                  />
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-muted">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm text-center">
                    Drag and drop your image here, or click to select
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {isLoading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Progress value={33} className="animate-pulse" />
              </div>
            )}

            {prediction && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2">
                  {prediction.is_fake ? (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <h3 className="font-semibold">
                    {prediction.is_fake
                      ? "AI-Generated Image Detected"
                      : "Authentic Image"}
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Probability of being fake{" "}
                    </span>
                    <span className="font-medium">
                      {" "}
                      {(
                        parseFloat(prediction.fake_probability.toFixed(4)) * 100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                  <Progress
                    value={prediction.fake_probability * 100}
                    className={cn(
                      prediction.is_fake ? "bg-destructive/20" : "bg-green-100",
                      "h-2",
                      prediction.is_fake ? "bg-destructive" : "bg-green-500"
                    )}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  Analysis performed using{" "}
                  <span className="font-medium">{prediction.model_used}</span>
                </div>
              </div>
            )}

            {/* Render the CAM map as an image */}
            {camMapImage && (
              <div className="mt-4">
                <h4 className="font-semibold text-center">CAM Map (Heatmap)</h4>
                <img
                  src={camMapImage}
                  alt="CAM Heatmap"
                  className="rounded-lg object-contain w-full h-full mx-auto"
                  style={{ maxWidth: "70%", maxHeight: "70%" }}
                />
              </div>
            )}

            <Button
              onClick={() =>
                (
                  document.querySelector(
                    'input[type="file"]'
                  ) as HTMLInputElement
                )?.click()
              }
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Image
            </Button>
          </div>
        </Card>
      </div>

      {isServerHealthy && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-500 text-white rounded-full shadow-lg">
          <Check className="w-6 h-6" />
        </div>
      )}
      {!isServerHealthy && (
        <div className="fixed bottom-4 right-4 p-4 bg-destructive text-white rounded-full shadow-lg">
          <AlertTriangle className="w-6 h-6" />
          MODEL IS NOT LOADED YET
        </div>
      )}
    </main>
  );
}
