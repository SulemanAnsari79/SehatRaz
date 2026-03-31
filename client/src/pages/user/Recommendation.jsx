import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const questions = [
  {
    id: 1,
    question: "What is your primary health goal?",
    options: [
      "Weight Loss",
      "Muscle Gain",
      "General Wellness",
      "Disease Management",
      "Energy & Vitality"
    ]
  },
  {
    id: 2,
    question: "What is your age group?",
    options: [
      "18-25 years",
      "26-35 years",
      "36-45 years",
      "46-60 years",
      "60+ years"
    ]
  },
  {
    id: 3,
    question: "What is your activity level?",
    options: [
      "Sedentary (Little to no exercise)",
      "Lightly Active (1-3 days/week)",
      "Moderately Active (3-5 days/week)",
      "Very Active (6-7 days/week)",
      "Athlete (Intense training)"
    ]
  },
  {
    id: 4,
    question: "Do you have any dietary restrictions?",
    options: [
      "None",
      "Vegetarian",
      "Vegan",
      "Gluten-Free",
      "Lactose Intolerant"
    ]
  },
  {
    id: 5,
    question: "What is your primary concern?",
    options: [
      "Skin Health",
      "Digestive Health",
      "Heart Health",
      "Joint & Bone Health",
      "Mental Health & Stress"
    ]
  },
  {
    id: 6,
    question: "How would you rate your current health?",
    options: [
      "Excellent",
      "Good",
      "Fair",
      "Poor",
      "Very Poor"
    ]
  },
  {
    id: 7,
    question: "Do you have any chronic conditions?",
    options: [
      "None",
      "Diabetes",
      "Hypertension",
      "Thyroid Issues",
      "Other"
    ]
  },
  {
    id: 8,
    question: "What is your sleep quality?",
    options: [
      "Excellent (7-9 hours)",
      "Good (6-7 hours)",
      "Fair (5-6 hours)",
      "Poor (4-5 hours)",
      "Very Poor (Less than 4 hours)"
    ]
  },
  {
    id: 9,
    question: "What is your stress level?",
    options: [
      "Very Low",
      "Low",
      "Moderate",
      "High",
      "Very High"
    ]
  },
  {
    id: 10,
    question: "What type of products are you most interested in?",
    options: [
      "Supplements & Vitamins",
      "Herbal Products",
      "Fitness Equipment",
      "Health Monitoring Devices",
      "Wellness & Self-Care"
    ]
  }
];

const Recommendation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (!answers[questions[currentStep].id]) {
      toast.error('Please select an option before proceeding');
      return;
    }
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(questions.length); // Move to image upload step
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      toast.error('Please upload an image before submitting');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('answers', JSON.stringify(answers));

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:4000/api/recommendation/ai-recommend',formData,{headers: {'Authorization': `Bearer ${token}`,'Content-Type': 'multipart/form-data'}});

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
        setShowResults(true);
        toast.success('Recommendations generated successfully!');
      }
    } catch (error) {
      console.error('Recommendation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setSelectedImage(null);
    setImagePreview(null);
    setRecommendations([]);
    setShowResults(false);
  };

  const progress = ((currentStep) / (questions.length + 1)) * 100;

  if (showResults) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Personalized Recommendations</h1>
              <p className="text-gray-600">Based on your answers and uploaded image</p>
            </div>

            {recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recommendations.map((product, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => product?._id && navigate(`/product/${product._id}`)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && product?._id) {
                        navigate(`/product/${product._id}`);
                      }
                    }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <img 
                      src={product.images?.[0] || '/placeholder.jpg'} 
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-indigo-600">₹{product.price}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                      </div>
                      {product.matchReason && (
                        <p className="text-xs text-gray-500 mt-3 italic border-t pt-2">
                          Why recommended: {product.matchReason}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product?._id) {
                            navigate(`/product/${product._id}`);
                          }
                        }}
                        className="mt-3 bg-black text-white px-4 py-2 text-xs rounded"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">No specific products match your criteria at the moment.</p>
                <p className="text-gray-500">Our AI has analyzed your responses. Check back soon for new recommendations!</p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={resetQuiz}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Take Assessment Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Health Recommendation Assessment</h1>
            <p className="text-indigo-100">Answer 10 questions and upload an image to get personalized product recommendations</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 h-2">
            <div 
              className="bg-indigo-600 h-2 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Content */}
          <div className="p-8">
            {currentStep < questions.length ? (
              <>
                {/* Question */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
                      {currentStep + 1}
                    </span>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {questions[currentStep].question}
                    </h2>
                  </div>
                  
                  {/* Options */}
                  <div className="space-y-3 mt-6">
                    {questions[currentStep].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(questions[currentStep].id, option)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                          answers[questions[currentStep].id] === option
                            ? 'border-indigo-600 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                            answers[questions[currentStep].id] === option
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-gray-300'
                          }`}>
                            {answers[questions[currentStep].id] === option && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-gray-700 font-medium">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      currentStep === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    {currentStep === questions.length - 1 ? 'Continue to Image Upload' : 'Next'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Image Upload Step */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <span className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
                      📸
                    </span>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Upload Your Image
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Upload a photo (e.g., skin condition, posture, affected area) to help our AI provide better recommendations
                  </p>

                  {/* Image Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-h-64 mx-auto rounded-lg shadow-md"
                        />
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <label className="cursor-pointer">
                          <span className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 inline-block">
                            Choose Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-gray-500 text-sm mt-2">PNG, JPG or JPEG (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <button
                    onClick={handlePrevious}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {loading ? 'Analyzing...' : 'Get Recommendations'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50 px-8 py-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              Step {Math.min(currentStep + 1, questions.length + 1)} of {questions.length + 1} • 
              Your data is secure and used only for recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendation;
