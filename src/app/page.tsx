'use client';

import { useState, ChangeEvent, FormEvent } from "react";
import { FiUpload, FiLoader } from 'react-icons/fi'; // Importation des icônes

export default function Home() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    // Resize image if its dimensions exceed 400x400
                    if (width > 400 || height > 400) {
                        const scaleFactor = Math.min(400 / width, 400 / height);
                        width = width * scaleFactor;
                        height = height * scaleFactor;
                    }

                    const elem = document.createElement("canvas");
                    elem.width = width;
                    elem.height = height;
                    const ctx = elem.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);
                    setPreview(elem.toDataURL());
                };
            };
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedFile) {
            alert("Please select an image first.");
            return;
        }

        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append("image", selectedFile);  // Field name is now 'image' to match the backend

        try {
            const url = process.env.NEXT_PUBLIC_BACK_URL || "http://localhost:5000";
            const response = await fetch(url + "/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: { result: string } = await response.json();
            setPrediction(data.result);
        } catch (error: any) {
            console.error("Error uploading image:", error);
            setError("Failed to analyze the image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    AI Face Detector
                </h1>
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <div>
                        <label
                            htmlFor="file"
                            className="block text-gray-600 font-medium mb-2"
                        >
                            Upload your image
                        </label>
                        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer">
                            <input
                                type="file"
                                id="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label htmlFor="file" className="flex flex-col items-center cursor-pointer">
                                <FiUpload size={24} className="text-blue-500" />
                                <span className="text-blue-500 mt-2">Choose File</span>
                            </label>
                        </div>
                    </div>
                    {preview && (
                        <div className="mt-4 flex justify-center">
                            <img
                                src={preview}
                                alt="Selected"
                                className="max-w-full h-auto border rounded-lg"
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <FiLoader className="animate-spin mr-2" /> Processing...
                            </span>
                        ) : (
                            "Analyze"
                        )}
                    </button>
                </form>
                {error && (
                    <div className="mt-4 text-red-500 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                {prediction && (
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-gray-800">Result:</h2>
                        <p
                            className={`mt-2 text-lg font-bold ${
                                prediction === "real" ? "text-green-500" : "text-red-500"
                            }`}
                        >
                            {prediction === "real" ? "Real Face" : "Fake Face"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
