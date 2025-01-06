'use client';

import { useState, ChangeEvent, FormEvent } from "react";

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
            setPreview(URL.createObjectURL(file));
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
        formData.append("file", selectedFile);

        try {
            const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const response = await fetch(url, {
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
                        <input
                            type="file"
                            id="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    {preview && (
                        // Center the image
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
                        {loading ? "Processing..." : "Analyze"}
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
