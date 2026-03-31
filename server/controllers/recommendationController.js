import Product from '../models/productModel.js';
import Doctor from '../models/doctorModel.js';
import Order from '../models/orderModel.js';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

const uploadBufferToCloudinary = (buffer, folder = 'recommendations') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
};

export const getProductRecommendations = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get user's previous orders to determine categories
        const userOrders = await Order.find({ user: userId });
        const purchasedCategories = new Set();

        userOrders.forEach(order => {
            order.items?.forEach(item => {
                if (item.category) purchasedCategories.add(item.category);
            });
        });

        let query = {};
        if (purchasedCategories.size > 0) {
            query.category = { $in: Array.from(purchasedCategories) };
        }

        // Get recommended products
        const recommendations = await Product.find(query)
            .limit(10)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, recommendations });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getDoctorRecommendations = async (req, res) => {
    try {
        const { specialization } = req.query;

        let query = { verified: true };

        if (specialization) {
            query.specialization = specialization;
        }

        const recommendations = await Doctor.find(query)
            .select('-password')
            .limit(10)
            .sort({ experience: -1 });

        res.status(200).json({ success: true, recommendations });
    } catch (error) {
        console.error('Get doctor recommendations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getRecommendationsByCategory = async (req, res) => {
    try {
        const { category } = req.query;

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }

        const products = await Product.find({ category })
            .limit(15)
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Get category recommendations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// AI-Powered Recommendation with Image Analysis
export const getAIRecommendations = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!req.body?.answers) {
            return res.status(400).json({ success: false, message: 'Answers are required' });
        }

        let answers;
        try {
            answers = JSON.parse(req.body.answers);
        } catch {
            return res.status(400).json({ success: false, message: 'Invalid answers format' });
        }
        
        // Get image file
        const imageFile = req.file;
        
        if (!imageFile) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        // Upload image to Cloudinary (supports multer memory and disk storage)
        let result;
        if (imageFile.buffer) {
            result = await uploadBufferToCloudinary(imageFile.buffer, 'recommendations');
        } else if (imageFile.path) {
            result = await cloudinary.uploader.upload(imageFile.path, {
                folder: 'recommendations',
                resource_type: 'image'
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid image payload' });
        }

        const imageUrl = result.secure_url;

        // Get all products from database
        const allProducts = await Product.find({ stock: { $gt: 0 } });

        if (!allProducts.length) {
            return res.status(200).json({ success: true, recommendations: [], userProfile: analyzeUserAnswers(answers) });
        }

        // Analyze answers to determine user profile
        const userProfile = analyzeUserAnswers(answers);

        // Use OpenAI GPT-4 Vision API for AI recommendation (if configured)
        // Otherwise fall back to rule-based recommendation
        let recommendations = [];
        
        const openaiApiKey = process.env.OPENAI_API_KEY;
        
        if (openaiApiKey) {
            try {
                recommendations = await getOpenAIRecommendations(
                    answers, 
                    imageUrl, 
                    allProducts, 
                    userProfile,
                    openaiApiKey
                );
            } catch (aiError) {
                console.error('OpenAI API error:', aiError);
                // Fall back to rule-based
                recommendations = getRuleBasedRecommendations(userProfile, allProducts);
            }
        } else {
            // Use rule-based recommendation
            recommendations = getRuleBasedRecommendations(userProfile, allProducts);
        }

        res.status(200).json({ 
            success: true, 
            recommendations,
            userProfile // Optional: send user profile for debugging
        });

    } catch (error) {
        console.error('AI Recommendation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate recommendations',
            error: error.message 
        });
    }
};

// Analyze user answers to create a profile
function analyzeUserAnswers(answers) {
    const profile = {
        healthGoal: answers[1] || 'General Wellness',
        ageGroup: answers[2] || '26-35 years',
        activityLevel: answers[3] || 'Moderately Active',
        dietaryRestrictions: answers[4] || 'None',
        primaryConcern: answers[5] || 'General Health',
        healthRating: answers[6] || 'Good',
        chronicConditions: answers[7] || 'None',
        sleepQuality: answers[8] || 'Good',
        stressLevel: answers[9] || 'Moderate',
        productInterest: answers[10] || 'Supplements & Vitamins'
    };
    
    return profile;
}

// OpenAI GPT-4 Vision API Integration
async function getOpenAIRecommendations(answers, imageUrl, products, userProfile, apiKey) {
    try {
        const productContext = products.map(p => ({
            name: p.name,
            category: p.category,
            description: p.description,
            tags: p.tags
        }));

        const prompt = `You are a health and wellness expert AI. Analyze the following:

USER PROFILE:
- Health Goal: ${userProfile.healthGoal}
- Age Group: ${userProfile.ageGroup}
- Activity Level: ${userProfile.activityLevel}
- Dietary Restrictions: ${userProfile.dietaryRestrictions}
- Primary Concern: ${userProfile.primaryConcern}
- Health Rating: ${userProfile.healthRating}
- Chronic Conditions: ${userProfile.chronicConditions}
- Sleep Quality: ${userProfile.sleepQuality}
- Stress Level: ${userProfile.stressLevel}
- Product Interest: ${userProfile.productInterest}

AVAILABLE PRODUCTS:
${JSON.stringify(productContext.slice(0, 20), null, 2)}

USER IMAGE:
The user has uploaded an image at: ${imageUrl}
Please analyze the image for any visible health indicators (skin condition, posture, etc.)

TASK:
1. Analyze the user's questionnaire responses
2. Analyze the uploaded image for health indicators
3. Recommend 3-6 products from the available products list
4. For each recommendation, provide a brief reason why it matches their needs
5. Return response as JSON array with format: [{"productName": "name", "matchReason": "reason"}]

Return only the JSON array, no additional text.`;

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 1500
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;
        const recommendations = JSON.parse(aiResponse);

        // Match AI recommendations with actual products
        const matchedProducts = recommendations.map(rec => {
            const product = products.find(p => 
                p.name.toLowerCase().includes(rec.productName.toLowerCase()) ||
                rec.productName.toLowerCase().includes(p.name.toLowerCase())
            );
            
            if (product) {
                return {
                    ...product.toObject(),
                    matchReason: rec.matchReason
                };
            }
            return null;
        }).filter(p => p !== null);

        return matchedProducts.length > 0 ? matchedProducts : getRuleBasedRecommendations(userProfile, products);

    } catch (error) {
        console.error('OpenAI API Error:', error.response?.data || error.message);
        throw error;
    }
}

// Rule-based recommendation (fallback when AI is not available)
function getRuleBasedRecommendations(userProfile, products) {
    const scoredProducts = products.map(product => {
        let score = 0;
        const productCategory = String(product.category || '').toLowerCase();
        const productTags = Array.isArray(product.tags)
            ? product.tags.map(tag => String(tag).toLowerCase())
            : [];
        
        // Score based on health goal
        if (userProfile.healthGoal === 'Weight Loss' && 
            (productCategory.includes('fitness') || 
             productTags.some(tag => tag.includes('weight')))) {
            score += 10;
        }
        
        if (userProfile.healthGoal === 'Muscle Gain' && 
            (productCategory.includes('fitness') || 
             productCategory.includes('supplement'))) {
            score += 10;
        }
        
        // Score based on primary concern
        if (userProfile.primaryConcern === 'Skin Health' && 
            (productCategory.includes('skin') || 
             productTags.some(tag => tag.includes('skin')))) {
            score += 15;
        }
        
        if (userProfile.primaryConcern === 'Digestive Health' && 
            productTags.some(tag => ['digestive', 'probiotic', 'fiber'].includes(tag))) {
            score += 15;
        }
        
        if (userProfile.primaryConcern === 'Heart Health' && 
            productTags.some(tag => ['heart', 'cardio', 'omega'].includes(tag))) {
            score += 15;
        }
        
        if (userProfile.primaryConcern === 'Joint & Bone Health' && 
            productTags.some(tag => ['joint', 'bone', 'calcium'].includes(tag))) {
            score += 15;
        }
        
        if (userProfile.primaryConcern === 'Mental Health & Stress' && 
            productTags.some(tag => ['stress', 'mental', 'anxiety'].includes(tag))) {
            score += 15;
        }
        
        // Score based on product interest
        if (userProfile.productInterest.includes('Supplements') && 
            productCategory.includes('supplement')) {
            score += 8;
        }
        
        if (userProfile.productInterest.includes('Herbal') && 
            productTags.some(tag => tag.includes('herbal'))) {
            score += 8;
        }
        
        if (userProfile.productInterest.includes('Fitness') && 
            productCategory.includes('fitness')) {
            score += 8;
        }
        
        // Score based on activity level
        if (userProfile.activityLevel.includes('Very Active') || 
            userProfile.activityLevel.includes('Athlete')) {
            if (productCategory.includes('fitness') || 
                productCategory.includes('sport')) {
                score += 7;
            }
        }
        
        // Score based on chronic conditions
        if (userProfile.chronicConditions === 'Diabetes' && 
            productTags.some(tag => ['sugar', 'diabetes', 'glucose'].includes(tag))) {
            score += 12;
        }
        
        if (userProfile.chronicConditions === 'Hypertension' && 
            productTags.some(tag => ['blood pressure', 'heart'].includes(tag))) {
            score += 12;
        }
        
        // Add some randomness for variety
        score += Math.random() * 3;
        
        return { product, score };
    });
    
    // Sort by score and get top 6
    const topProducts = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(item => ({
            ...item.product.toObject(),
            matchReason: generateMatchReason(userProfile, item.product)
        }));
    
    return topProducts;
}

// Generate match reason for rule-based recommendations
function generateMatchReason(userProfile, product) {
    const reasons = [];
    const productCategory = String(product.category || '').toLowerCase();
    const productName = String(product.name || '').toLowerCase();
    const productTags = Array.isArray(product.tags)
        ? product.tags.map(tag => String(tag).toLowerCase())
        : [];
    
    if (userProfile.primaryConcern && 
        productTags.some(tag => tag.includes(userProfile.primaryConcern.toLowerCase().split(' ')[0]))) {
        reasons.push(`Matches your ${userProfile.primaryConcern} concern`);
    }
    
    if (userProfile.healthGoal && 
        (productCategory.includes(userProfile.healthGoal.toLowerCase().split(' ')[0]) ||
         productName.includes(userProfile.healthGoal.toLowerCase().split(' ')[0]))) {
        reasons.push(`Supports your ${userProfile.healthGoal} goal`);
    }
    
    if (userProfile.activityLevel.includes('Very Active') && 
        productCategory.includes('fitness')) {
        reasons.push('Suitable for your high activity level');
    }
    
    if (reasons.length === 0) {
        reasons.push('Recommended based on your health profile');
    }
    
    return reasons[0];
}