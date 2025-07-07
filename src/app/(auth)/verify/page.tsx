"use client";
import axios from "axios";
import React, { useState } from "react";



const VerifyPage = () => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Replace with your actual API call
            const res = await axios.post("/api/auth/verify", {
                code: code.trim(),
            });

            if (res.status === 200) {
                setMessage("Verification successful!");
                // Optionally redirect or update UI
            } else {
                const data = await res.data;
                setMessage(data.error || "Verification failed.");
            }
        } catch (error) {
            setMessage("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded shadow-md w-full max-w-md"
            >
                <h1 className="text-2xl font-bold mb-6 text-center">Verify Account</h1>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                    Enter Verification Code
                </label>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    {loading ? "Verifying..." : "Verify"}
                </button>
                {message && (
                    <div className="mt-4 text-center text-sm text-red-600">{message}</div>
                )}
            </form>
        </div>
    );
};

export default VerifyPage;