// components/auth/UserProfileForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ru", name: "Russian" },
  { code: "pt", name: "Portuguese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

export default function UserProfileForm({ walletAddress, onSuccess, onError }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nativeLanguage: "",
    learningLanguages: [{ languageCode: "", proficiencyLevel: "BEGINNER" }],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLearningLanguageChange = (index, field, value) => {
    setFormData((prev) => {
      const newLearningLanguages = [...prev.learningLanguages];
      newLearningLanguages[index] = {
        ...newLearningLanguages[index],
        [field]: value,
      };
      return { ...prev, learningLanguages: newLearningLanguages };
    });
  };

  const addLearningLanguage = () => {
    setFormData((prev) => ({
      ...prev,
      learningLanguages: [
        ...prev.learningLanguages,
        { languageCode: "", proficiencyLevel: "BEGINNER" },
      ],
    }));
  };

  const removeLearningLanguage = (index) => {
    setFormData((prev) => {
      const newLearningLanguages = [...prev.learningLanguages];
      newLearningLanguages.splice(index, 1);
      return { ...prev, learningLanguages: newLearningLanguages };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.username || !formData.email || !formData.nativeLanguage) {
      onError("Please fill in all required fields");
      return;
    }

    if (formData.learningLanguages.some((lang) => !lang.languageCode)) {
      onError("Please select all learning languages");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Profile update successful
      onSuccess();
      router.push("/dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
      onError(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wallet Address
        </label>
        <input
          type="text"
          value={walletAddress}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username*
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email*
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Native Language*
        </label>
        <select
          name="nativeLanguage"
          value={formData.nativeLanguage}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Select your native language</option>
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Languages You Want to Learn*
        </label>

        {formData.learningLanguages.map((lang, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <select
              value={lang.languageCode}
              onChange={(e) =>
                handleLearningLanguageChange(
                  index,
                  "languageCode",
                  e.target.value
                )
              }
              required
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select language</option>
              {LANGUAGES.filter(
                (language) => language.code !== formData.nativeLanguage
              ).map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>

            <select
              value={lang.proficiencyLevel}
              onChange={(e) =>
                handleLearningLanguageChange(
                  index,
                  "proficiencyLevel",
                  e.target.value
                )
              }
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="ELEMENTARY">Elementary</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="FLUENT">Fluent</option>
            </select>

            {index > 0 && (
              <button
                type="button"
                onClick={() => removeLearningLanguage(index)}
                className="cursor-pointer px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addLearningLanguage}
          className="cursor-pointer mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Add Another Language
        </button>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer mt-4 md:mt-0 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all"
        >
          {isSubmitting ? "Saving..." : "Complete Profile"}
        </button>
      </div>
    </form>
  );
}
