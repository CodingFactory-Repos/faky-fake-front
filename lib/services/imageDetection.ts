export interface PredictionResult {
  filename: string;
  fake_probability: number;
  is_fake: boolean;
  model_used: string;
  cam_map: number[][];
}

export class ImageDetectionService {
  private static readonly API_URL = process.env.NEXT_PUBLIC_BACK_URL + "/upload";

  static async analyzeImage(file: File): Promise<PredictionResult> {
    const formData = new FormData();
    formData.append("image", file);

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