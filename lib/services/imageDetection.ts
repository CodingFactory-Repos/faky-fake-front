export interface PredictionResult {
  filename: string;
  fake_probability: number;
  is_fake: boolean;
  model_used: string;
}

export class ImageDetectionService {
  private static readonly API_URL = "http://localhost:8000/predict";

  static async analyzeImage(file: File): Promise<PredictionResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(this.API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to analyze image");
    }

    return response.json();
  }

  static createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}