import React from "react";
import { Link } from "react-router-dom";

const Question = () => {
  return (
    <div className="bg-gray-50 py-16 px-6">

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">

        {/* Left Side - Image */}
        <div>
          <img
            src="/question.jpg"
            alt="Answer Questions"
            className="w-full rounded-xl shadow-lg"
          />
        </div>

        {/* Right Side - Content */}
        <div>
          <h2 className="text-3xl font-bold mb-4">
            Find the Right Products for You
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Answer a few simple questions and upload relevant images to help us
            understand your needs better. Based on your responses, we will
            recommend the most suitable healthcare products specially for you.
          </p>

          <Link to="/recommended">
            <button className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-600 transition">
              Get Recommended Products
            </button>
          </Link>
        </div>

      </div>

    </div>
  );
};

export default Question;
